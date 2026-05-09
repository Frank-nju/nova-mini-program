#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
追光健雄｜云端数字展馆 - Web 网关（轮询版）
功能：异步任务 + 轮询，完美兼容代理环境
启动：python gateway.py
访问：http://localhost:8000
"""

import json
import os
import time
import uuid
import threading
import numpy as np
from typing import List, Dict
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

# ============================================================
# 配置
# ============================================================

LLM_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
LLM_MODEL = "qwen3.6-plus"
EMBED_MODEL = "text-embedding-v4"
EMBED_DIM = 1536

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

KNOWLEDGE_JSON = os.path.join(SCRIPT_DIR, "modules", "rag", "data", "knowledge-chunks.json")
INDEX_DIR = os.path.join(SCRIPT_DIR, "modules", "rag", "data", "rag-index")
PROMPTS_JSON = os.path.join(SCRIPT_DIR, "modules", "digital-human", "data", "prompts.json")

LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
EMBED_API_KEY = os.environ.get("EMBED_API_KEY", "")

TTS_MODEL = "cosyvoice-v3.5-plus"
TTS_VOICE = os.environ.get("TTS_VOICE_ID", "cosyvoice-v3.5-plus-vd-wjxszslow-41e6b9543b174ccfbe0ebae9eb4721c0")
TTS_AUDIO_DIR = "/data/user/work/tts_cache"
os.makedirs(TTS_AUDIO_DIR, exist_ok=True)

# ============================================================
# 全局资源
# ============================================================

faiss_index = None
chunks_meta = None
prompts_data = None

# 任务存储：task_id -> {status, text, retrieval, error, created_at}
tasks: Dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global faiss_index, chunks_meta, prompts_data

    print("📂 加载 RAG 索引和知识库...")
    import faiss
    faiss_index = faiss.read_index(os.path.join(INDEX_DIR, "faiss_index.bin"))
    with open(os.path.join(INDEX_DIR, "chunks_metadata.json"), 'r', encoding='utf-8') as f:
        chunks_meta = json.load(f)
    print(f"  ✅ 索引: {faiss_index.ntotal} 个向量, {len(chunks_meta)} 条片段")

    print("📂 加载 Prompt 模板...")
    with open(PROMPTS_JSON, 'r', encoding='utf-8') as f:
        prompts_data = json.load(f)
    print(f"  ✅ 预设问题: {len(prompts_data['presetQuestions'])} 条")
    print("🚀 服务就绪！")
    yield


app = FastAPI(title="追光健雄｜数字人对话", lifespan=lifespan)


# ============================================================
# RAG 检索
# ============================================================

def retrieve(query: str, top_k: int = 3) -> List[Dict]:
    import dashscope
    from http import HTTPStatus

    dashscope.api_key = EMBED_API_KEY
    resp = dashscope.TextEmbedding.call(
        model=EMBED_MODEL, input=query,
        dimension=EMBED_DIM, text_type="query"
    )
    if resp.status_code != HTTPStatus.OK:
        raise Exception(f"Embedding 错误: {resp.code} - {resp.message}")

    vec = np.array([resp.output["embeddings"][0]["embedding"]], dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    distances, indices = faiss_index.search(vec, min(top_k, len(chunks_meta)))
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if 0 <= idx < len(chunks_meta):
            c = chunks_meta[idx]
            results.append({
                "rank": len(results) + 1,
                "similarity": round(float(dist), 4),
                "nodeBinding": c.get("nodeBinding", ""),
                "text": c["text"],
                "containsQuote": c.get("containsQuote", False),
                "quoteText": c.get("quoteText", "")
            })
    return results


# ============================================================
# LLM 生成（非流式，直接拿完整结果）
# ============================================================

def generate_answer_stream(task_id: str, query: str, context: str) -> str:
    """流式调用 LLM，将片段实时写入任务字典，轮询可读到增量文本"""
    import openai

    client = openai.OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

    system_content = prompts_data["systemPrompt"]["content"].replace(
        "{retrieved_context}", context
    )
    user_content = prompts_data["userPromptTemplate"]["content"].replace(
        "{user_question}", query
    ).replace("{current_zone}", "\u672a\u6307\u5b9a").replace(
        "{current_node}", "\u672a\u6307\u5b9a"
    ).replace("{unlocked_badges}", "\u65e0")

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        temperature=0.7,
        max_tokens=512,
        stream=True,
        extra_body={"enable_thinking": False}  # 关闭模型自带推理，降低首字延迟
    )

    full_text = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            text = chunk.choices[0].delta.content
            # 清理禁用词
            for w in ["\u4f5c\u4e3a\u4e00\u4e2a\u4eba\u5de5\u667a\u80fd", "\u4f5c\u4e3aAI\u52a9\u624b", "\u4f5c\u4e3aAI", "\u6839\u636e\u6211\u7684\u77e5\u8bc6\u5e93"]:
                text = text.replace(w, "")
            full_text += text
            # 实时写入任务字典，轮询接口可读到增量文本
            tasks[task_id]["text"] = full_text
    return full_text.strip()


# ============================================================
# TTS 语音合成
# ============================================================

def generate_tts(task_id: str, text: str):
    """在后台线程中生成 TTS 音频，保存到文件"""
    try:
        import dashscope
        from dashscope.audio.tts_v2 import SpeechSynthesizer

        dashscope.api_key = EMBED_API_KEY
        dashscope.base_websocket_api_url = "wss://dashscope.aliyuncs.com/api-ws/v1/inference"

        synthesizer = SpeechSynthesizer(model=TTS_MODEL, voice=TTS_VOICE)
        audio = synthesizer.call(text)

        audio_path = os.path.join(TTS_AUDIO_DIR, f"{task_id}.mp3")
        with open(audio_path, "wb") as f:
            f.write(audio)

        tasks[task_id]["audio_ready"] = True
        tasks[task_id]["audio_size"] = len(audio)
        print(f"  🔊 TTS 完成: {task_id} ({len(audio)} bytes)")

    except Exception as e:
        print(f"  ⚠️ TTS 失败: {task_id} - {e}")
        tasks[task_id]["audio_ready"] = False
        tasks[task_id]["audio_error"] = str(e)


# ============================================================
# 后台任务执行
# ============================================================

def run_task(task_id: str, question: str, top_k: int):
    """在后台线程中执行 RAG + LLM，结果写入 tasks 字典"""
    try:
        tasks[task_id]["status"] = "retrieving"

        # 1. RAG 检索
        results = retrieve(question, top_k)
        tasks[task_id]["retrieval"] = [
            {"rank": r["rank"], "similarity": r["similarity"],
             "nodeBinding": r["nodeBinding"], "text_preview": r["text"][:80]}
            for r in results
        ]

        # 2. 组装上下文
        parts = [f"【{r['nodeBinding']}】{r['text']}" for r in results]
        context = "\n\n".join(parts)
        if not results or results[0]['similarity'] < 0.4:
            context += "\n\n【提示】检索结果不够充分，请基于已有信息回答。"

        # 3. 调用 LLM（流式，实时写入任务字典）
        tasks[task_id]["status"] = "generating"
        answer = generate_answer_stream(task_id, question, context)

        # 4. 完成
        tasks[task_id]["status"] = "done"
        tasks[task_id]["text"] = answer
        tasks[task_id]["latency_ms"] = int((time.time() - tasks[task_id]["created_at"]) * 1000)
        tasks[task_id]["audio_ready"] = False

        # 5. 异步生成 TTS（不阻塞用户）
        if answer and len(answer) > 5:
            tts_thread = threading.Thread(target=generate_tts, args=(task_id, answer), daemon=True)
            tts_thread.start()

    except Exception as e:
        tasks[task_id]["status"] = "error"
        tasks[task_id]["error"] = str(e)
        # 使用 fallback
        fallback = prompts_data.get("fallbackPrompt", {}).get("content",
            "这个问题让我想起了很多往事，但似乎一时难以完整回答。不如我们去看看展馆里的其他内容？")
        tasks[task_id]["text"] = fallback


# ============================================================
# API 路由
# ============================================================

class ChatRequest(BaseModel):
    question: str
    top_k: int = 3


@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """提交问题，立即返回 task_id，后台异步处理"""
    task_id = str(uuid.uuid4())[:8]
    tasks[task_id] = {
        "status": "pending",
        "text": "",
        "retrieval": [],
        "error": None,
        "created_at": time.time(),
        "latency_ms": 0
    }
    # 启动后台线程
    t = threading.Thread(target=run_task, args=(task_id, req.question, req.top_k), daemon=True)
    t.start()
    return {"task_id": task_id, "status": "pending"}


@app.get("/api/result/{task_id}")
async def api_result(task_id: str):
    """轮询任务状态和结果"""
    if task_id not in tasks:
        return {"status": "not_found", "text": "", "retrieval": [], "error": "任务不存在"}
    t = tasks[task_id]
    return {
        "status": t["status"],
        "text": t["text"],
        "retrieval": t["retrieval"],
        "error": t["error"],
        "latency_ms": t.get("latency_ms", 0),
        "audio_ready": t.get("audio_ready", False)
    }


@app.get("/api/tts/{task_id}")
async def api_tts(task_id: str):
    """获取 TTS 音频文件"""
    audio_path = os.path.join(TTS_AUDIO_DIR, f"{task_id}.mp3")
    if not os.path.exists(audio_path):
        return {"error": "音频未生成"}
    return FileResponse(audio_path, media_type="audio/mpeg", filename=f"{task_id}.mp3")


@app.get("/api/presets")
async def api_presets():
    return {"questions": prompts_data.get("presetQuestions", [])}


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "chunks": len(chunks_meta), "index_size": faiss_index.ntotal}


# ============================================================
# 聊天网页（轮询版）
# ============================================================

HTML_PAGE = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>追光健雄｜云端数字展馆</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Serif SC','Songti SC',serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column}
.header{background:linear-gradient(135deg,#16213e,#0f3460);padding:20px 30px;text-align:center;border-bottom:2px solid #e94560}
.header h1{color:#e94560;font-size:28px;font-weight:700;letter-spacing:4px}
.header p{color:#a0a0b0;font-size:14px;margin-top:6px}
.chat-container{flex:1;max-width:800px;width:100%;margin:0 auto;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.msg{max-width:85%;padding:14px 18px;border-radius:16px;line-height:1.7;font-size:15px;animation:fadeIn .3s ease}
.msg-user{align-self:flex-end;background:#0f3460;color:#fff;border-bottom-right-radius:4px}
.msg-ai{align-self:flex-start;background:#16213e;border:1px solid #2a2a4a;color:#e0e0e0;border-bottom-left-radius:4px}
.msg-ai .label{color:#e94560;font-size:12px;font-weight:600;margin-bottom:6px}
.msg-ai .retrieval{margin-top:8px;padding-top:8px;border-top:1px solid #2a2a4a;font-size:12px;color:#808090}
.msg-ai .retrieval span{color:#e94560}
.msg-ai .quote{margin-top:8px;padding:8px 12px;background:rgba(233,69,96,.1);border-left:3px solid #e94560;font-style:italic;font-size:13px;color:#c0c0d0}
.msg-system{align-self:center;color:#606080;font-size:13px;padding:4px 12px}
.input-area{max-width:800px;width:100%;margin:0 auto;padding:16px 20px 24px}
.input-row{display:flex;gap:10px}
.input-row input{flex:1;padding:14px 18px;border-radius:24px;border:1px solid #2a2a4a;background:#16213e;color:#e0e0e0;font-size:15px;outline:none;font-family:inherit}
.input-row input:focus{border-color:#e94560}
.input-row input::placeholder{color:#606080}
.input-row button{padding:14px 28px;border-radius:24px;border:none;background:#e94560;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;font-weight:600;transition:background .2s}
.input-row button:hover{background:#c73e54}
.input-row button:disabled{background:#404060;cursor:not-allowed}
.presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.presets button{padding:6px 14px;border-radius:16px;border:1px solid #2a2a4a;background:transparent;color:#a0a0b0;font-size:13px;cursor:pointer;font-family:inherit;transition:all .2s}
.presets button:hover{border-color:#e94560;color:#e94560}
.typing{display:inline-flex;gap:4px;padding:4px 0}
.typing span{width:6px;height:6px;border-radius:50%;background:#e94560;animation:blink 1.4s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
.cursor{display:inline-block;width:2px;height:1em;background:#e94560;animation:cursorBlink .8s infinite;vertical-align:text-bottom;margin-left:2px}
@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
.audio-btn{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 12px;border-radius:12px;border:1px solid #2a2a4a;background:transparent;color:#a0a0b0;font-size:12px;cursor:pointer;font-family:inherit;transition:all .2s}
.audio-btn:hover{border-color:#e94560;color:#e94560}
.audio-btn.playing{border-color:#e94560;color:#e94560;background:rgba(233,69,96,.1)}
.audio-btn .dot{width:6px;height:6px;border-radius:50%;background:#e94560;animation:audioPulse 1s infinite}
.audio-btn .dot:nth-child(2){animation-delay:.2s}
.audio-btn .dot:nth-child(3){animation-delay:.4s}
@keyframes audioPulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
.status-text{color:#606080;font-size:12px;margin-top:4px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,80%,100%{opacity:.3}40%{opacity:1}}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px}
</style>
</head>
<body>
<div class="header">
  <h1>追光健雄</h1>
  <p>云端数字展馆 · 对话吴健雄先生</p>
</div>
<div class="chat-container" id="chatBox">
  <div class="msg msg-ai">
    <div class="label">🧪 吴健雄</div>
    欢迎来到追光健雄云端数字展馆。我是吴健雄，很高兴能带你走进我的人生旅程。你可以问我关于我的求学经历、科研探索、人生感悟，或者任何你感兴趣的话题。
    <div class="quote">"把忠心交给国家，把孝心奉给父母，把爱心献给事业，把真诚送给朋友，把信心留给自己。"</div>
  </div>
</div>
<div class="input-area">
  <div class="input-row">
    <input type="text" id="userInput" placeholder="输入您想问吴健雄先生的问题..." autofocus />
    <button id="sendBtn" onclick="sendMessage()">发送</button>
  </div>
  <div class="presets" id="presetBtns"></div>
</div>
<script>
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

fetch('/api/presets').then(r=>r.json()).then(data=>{
  const box = document.getElementById('presetBtns');
  data.questions.forEach(q=>{
    const btn = document.createElement('button');
    btn.textContent = q.question;
    btn.onclick = ()=>{ userInput.value = q.question; sendMessage(); };
    box.appendChild(btn);
  });
});

userInput.addEventListener('keydown', e=>{ if(e.key==='Enter') sendMessage(); });

let currentAiDiv = null;
let currentTaskId = null;
let pollTimer = null;

async function sendMessage(){
  const q = userInput.value.trim();
  if(!q) return;
  userInput.value = '';
  sendBtn.disabled = true;

  appendMsg('user', q);

  // 创建 AI 消息容器（带状态提示）
  currentAiDiv = document.createElement('div');
  currentAiDiv.className = 'msg msg-ai';
  currentAiDiv.innerHTML = '<div class="label">🧪 吴健雄</div><div class="typing"><span></span><span></span><span></span></div><div class="status-text" id="statusText">正在思考...</div>';
  chatBox.appendChild(currentAiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // 第一步：提交问题，立刻返回 task_id（毫秒级）
    const submitResp = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question: q})
    });

    if(!submitResp.ok) throw new Error('HTTP ' + submitResp.status);

    const submitData = await submitResp.json();
    const taskId = submitData.task_id;
    currentTaskId = taskId;

    // 第二步：轮询结果（每 2 秒查一次）
    pollResult(taskId);

  } catch(err) {
    let msg = '请求出错，请稍后重试';
    if(err.message.includes('HTTP')) msg = '服务暂时不可用(' + err.message + ')';
    if(currentAiDiv){
      currentAiDiv.innerHTML = '<div class="label">🧪 吴健雄</div>' + escapeHtml(msg);
    }
    sendBtn.disabled = false;
    userInput.focus();
  }
}

function pollResult(taskId){
  let attempts = 0;
  const maxAttempts = 120; // 最多轮询 120 次 * 2秒 = 4 分钟

  pollTimer = setInterval(async ()=>{
    attempts++;
    if(attempts > maxAttempts){
      clearInterval(pollTimer);
      pollTimer = null;
      if(currentAiDiv){
        currentAiDiv.innerHTML = '<div class="label">🧪 吴健雄</div>回答超时了，请重新提问。';
      }
      sendBtn.disabled = false;
      userInput.focus();
      return;
    }

    try {
      const resp = await fetch('/api/result/' + taskId);
      if(!resp.ok) return;
      const data = await resp.json();

      // 更新状态文字和增量文本
      const statusEl = document.getElementById('statusText');
      if(data.status === 'retrieving'){
        if(statusEl) statusEl.textContent = '\u6b63\u5728\u68c0\u7d22\u77e5\u8bc6\u5e93...';
      }
      else if(data.status === 'generating'){
        if(statusEl && statusEl.parentNode) statusEl.parentNode.removeChild(statusEl);
        // 流式显示已生成的文本片段
        if(data.text){
          currentAiDiv.innerHTML = '<div class="label">\ud83e\uddea \u5434\u5065\u96c4</div>' + escapeHtml(data.text) + '<span class="cursor">\u258a</span>';
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }

      if(data.status === 'done'){
        clearInterval(pollTimer);
        pollTimer = null;
        showResult(data, taskId);
      }
      else if(data.status === 'error'){
        clearInterval(pollTimer);
        pollTimer = null;
        // 即使出错，如果有 fallback 文本也显示
        if(data.text){
          showResult(data, taskId);
        } else {
          currentAiDiv.innerHTML = '<div class="label">🧪 吴健雄</div>出了点小问题，请稍后再试。';
        }
        sendBtn.disabled = false;
        userInput.focus();
      }
    } catch(e){
      // 轮询请求失败，忽略继续下一次
      console.warn('轮询失败:', e);
    }
  }, 2000);
}

function showResult(data, taskId){
  let html = '<div class="label">🧪 吴健雄</div>';
  html += escapeHtml(data.text);

  // 检索信息
  if(data.retrieval && data.retrieval.length > 0){
    html += '<div class="retrieval">检索 ' + data.retrieval.length + ' 条相关段落';
    data.retrieval.forEach(r=>{
      html += ' · <span>' + r.nodeBinding + '</span>(' + r.similarity + ')';
    });
    if(data.latency_ms) html += ' · ' + data.latency_ms + 'ms';
    html += '</div>';
  }

  // 语音播放按钮（音频可能还在生成中）
  html += '<div id="audio-area-' + taskId + '"><button class="audio-btn" onclick="playAudio(\'' + taskId + '\')">♪ 加载语音中...</button></div>';

  currentAiDiv.innerHTML = html;
  chatBox.scrollTop = chatBox.scrollHeight;
  sendBtn.disabled = false;
  userInput.focus();

  // 轮询音频就绪状态
  pollAudio(taskId);
}

let currentAudio = null;
let audioPollTimer = null;

function pollAudio(taskId){
  if(audioPollTimer) clearInterval(audioPollTimer);
  audioPollTimer = setInterval(async ()=>{
    try {
      const resp = await fetch('/api/result/' + taskId);
      if(!resp.ok) return;
      const data = await resp.json();
      if(data.audio_ready){
        clearInterval(audioPollTimer);
        audioPollTimer = null;
        const area = document.getElementById('audio-area-' + taskId);
        if(area){
          area.innerHTML = '<button class="audio-btn" onclick="playAudio(\'' + taskId + '\')">🎤 播放语音</button>';
          // 自动播放
          playAudio(taskId);
        }
      }
    } catch(e){}
  }, 2000);
}

function playAudio(taskId){
  const area = document.getElementById('audio-area-' + taskId);
  if(!area) return;

  // 如果正在播放，暂停
  if(currentAudio && !currentAudio.paused){
    currentAudio.pause();
    currentAudio = null;
    area.innerHTML = '<button class="audio-btn" onclick="playAudio(\'' + taskId + '\')">🎤 播放语音</button>';
    return;
  }

  // 显示播放中状态
  area.innerHTML = '<button class="audio-btn playing" onclick="playAudio(\'' + taskId + '\')"><span class="dot"></span><span class="dot"></span><span class="dot"></span> 播放中</button>';

  currentAudio = new Audio('/api/tts/' + taskId);
  currentAudio.onended = ()=>{
    currentAudio = null;
    area.innerHTML = '<button class="audio-btn" onclick="playAudio(\'' + taskId + '\')">🎤 重播</button>';
  };
  currentAudio.onerror = ()=>{
    currentAudio = null;
    area.innerHTML = '<button class="audio-btn" onclick="playAudio(\'' + taskId + '\')">♪ 语音加载失败</button>';
  };
  currentAudio.play();
}

function appendMsg(type, content){
  const div = document.createElement('div');
  div.className = 'msg msg-' + type;
  div.innerHTML = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function escapeHtml(text){
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML.replace(/\n/g, '<br>');
}
</script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def index():
    return HTMLResponse(HTML_PAGE)


if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("  追光健雄｜云端数字展馆 - Web 网关（轮询版）")
    print("  http://localhost:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
