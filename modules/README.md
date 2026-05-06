# AI 文本管线模块

本目录包含追光健雄数字展馆的 AI 文本相关模块，由角色 F（AI/PM）负责。

## 目录结构

```
modules/
├── rag/                        # RAG 知识库模块
│   ├── data/
│   │   ├── knowledge-chunks.json   # 知识库分块（62 chunks, 11 nodes）
│   │   └── rag-index/              # FAISS 向量索引
│   │       ├── faiss_index.bin
│   │       ├── chunks_metadata.json
│   │       └── provider_info.json
│   └── scripts/
│       └── rag-vector-store.py     # 向量化构建脚本
│
└── digital-human/              # 数字人模块
    ├── data/
    │   ├── prompts.json            # Prompt 工程（System/User/Fallback）
    │   └── scripts.json            # 数字人脚本（23 scripts, 3 levels）
    ├── scripts/
    │   ├── gateway.py              # Web 网关（轮询版 + TTS）
    │   └── chat.py                 # CLI 对话工具
    └── voice/
        └── voice-id.txt            # 定制音色 ID
```

## 快速开始

### 环境变量

```bash
export LLM_API_KEY="your-llm-api-key"        # 通义千问 API Key
export EMBED_API_KEY="your-embed-api-key"     # DashScope Embedding API Key
export TTS_VOICE_ID="your-voice-id"           # 可选，默认使用内置音色
```

### 安装依赖

```bash
pip install fastapi uvicorn openai dashscope faiss-cpu numpy
```

### 启动网关

```bash
cd modules/digital-human/scripts
python gateway.py
# 访问 http://localhost:8000
```

### 重建向量索引（可选）

```bash
cd modules/rag/scripts
python rag-vector-store.py --provider dashscope --embed-key $EMBED_API_KEY
```

## 技术栈

| 组件 | 技术 |
|------|------|
| LLM | 通义千问 qwen3.6-plus（OpenAI 兼容协议） |
| Embedding | 阿里云 DashScope text-embedding-v4（1536维） |
| 向量检索 | FAISS IndexFlatIP |
| TTS | 阿里云 CosyVoice v3.5-plus（定制音色） |
| Web 框架 | FastAPI + Uvicorn |
| 前端交互 | 异步任务 + 轮询（兼容代理环境） |

## 关键设计决策

1. **关闭模型思考模式**（`enable_thinking: False`）：qwen3.6-plus 默认开启推理，导致首字延迟 40-80s，关闭后降至 3-5s
2. **轮询而非 SSE**：用户浏览器经过代理，SSE 流式连接被截断，轮询模式更稳定
3. **流式写入 + 增量渲染**：LLM 流式生成实时写入任务字典，前端轮询时显示增量文本
4. **TTS 异步生成**：LLM 完成后后台线程合成语音，不阻塞用户交互
5. **Prompt 基于 nuwa-skill 蒸馏方法论**：表达DNA + 心智模型 + 分级回答策略
