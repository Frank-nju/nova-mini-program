#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
追光健雄｜云端数字展馆 - 数字人聊天接口
功能：
  1. 加载 RAG 索引 + 知识库
  2. 接收用户问题
  3. RAG 检索相关段落
  4. 组装 Prompt（System + User）
  5. 调用通义千问 API 生成回答
  6. 交互式聊天循环

使用：
  python chat.py --preset          # 用预设问题测试
  python chat.py --preset --all    # 运行全部8个预设问题
  python chat.py                   # 自由聊天模式
"""

import json
import argparse
import os
import sys
import numpy as np
from typing import List, Dict, Optional

# ============================================================
# 配置
# ============================================================

# 通义千问 API（OpenAI 兼容模式）
LLM_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
LLM_MODEL = "qwen3.6-plus"

# 阿里云 DashScope Embedding
EMBED_PROVIDER = "dashscope"
EMBED_MODEL = "text-embedding-v4"
EMBED_DIM = 1536

# 文件路径
KNOWLEDGE_JSON = "/workspace/knowledge_chunks.json"
INDEX_DIR = "/workspace/rag_index"
PROMPTS_JSON = "/workspace/prompts.json"


# ============================================================
# 加载资源
# ============================================================

def load_rag_index():
    """加载 FAISS 索引和知识库元数据"""
    import faiss

    index_path = os.path.join(INDEX_DIR, "faiss_index.bin")
    meta_path = os.path.join(INDEX_DIR, "chunks_metadata.json")

    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(f"RAG 索引不存在，请先运行 rag_vector_store.py 构建")

    index = faiss.read_index(index_path)
    with open(meta_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    return index, chunks


def load_prompts():
    """加载 Prompt 模板"""
    with open(PROMPTS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_provider_info():
    """加载 provider 信息"""
    path = os.path.join(INDEX_DIR, "provider_info.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"provider": "mock", "model": "text-embedding-v4", "dimension": 1536}


# ============================================================
# RAG 检索
# ============================================================

def retrieve(query: str, index, chunks: List[Dict], api_key: str,
             top_k: int = 3) -> List[Dict]:
    """RAG 检索：查询 → 向量化 → FAISS 检索"""
    import dashscope
    from http import HTTPStatus

    dashscope.api_key = api_key

    # 查询向量化
    resp = dashscope.TextEmbedding.call(
        model=EMBED_MODEL,
        input=query,
        dimension=EMBED_DIM,
        text_type="query"
    )

    if resp.status_code != HTTPStatus.OK:
        raise Exception(f"Embedding API 错误: {resp.code} - {resp.message}")

    query_vector = np.array([resp.output["embeddings"][0]["embedding"]], dtype=np.float32)
    norm = np.linalg.norm(query_vector)
    if norm > 0:
        query_vector = query_vector / norm

    # FAISS 检索
    distances, indices = index.search(query_vector, min(top_k, len(chunks)))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if 0 <= idx < len(chunks):
            results.append({
                "rank": len(results) + 1,
                "similarity": round(float(dist), 4),
                "text": chunks[idx]["text"],
                "nodeBinding": chunks[idx].get("nodeBinding", ""),
                "containsQuote": chunks[idx].get("containsQuote", False),
                "quoteText": chunks[idx].get("quoteText", "")
            })

    return results


# ============================================================
# LLM 生成
# ============================================================

def generate_answer(
    query: str,
    retrieved_context: str,
    prompts_data: Dict,
    api_key: str,
    current_zone: str = "未指定",
    current_node: str = "未指定",
    unlocked_badges: str = "无"
) -> str:
    """调用通义千问 API 生成回答"""
    try:
        import openai
    except ImportError:
        print("请先安装 openai: pip install openai")
        sys.exit(1)

    client = openai.OpenAI(
        base_url=LLM_BASE_URL,
        api_key=api_key
    )

    # 组装 System Prompt
    system_content = prompts_data["systemPrompt"]["content"].replace(
        "{retrieved_context}", retrieved_context
    )

    # 组装 User Prompt
    user_content = prompts_data["userPromptTemplate"]["content"].replace(
        "{user_question}", query
    ).replace(
        "{current_zone}", current_zone
    ).replace(
        "{current_node}", current_node
    ).replace(
        "{unlocked_badges}", unlocked_badges
    )

    # 调用 API
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        temperature=0.7,
        max_tokens=1024
    )

    answer = response.choices[0].message.content.strip()

    # 后处理：检查禁用词汇
    forbidden = ["作为一个人工智能", "作为AI助手", "作为AI", "根据我的知识库",
                 "我无法回答", "我不知道", "模型", "算法"]
    for word in forbidden:
        if word in answer:
            answer = answer.replace(word, "")

    return answer


# ============================================================
# 完整问答流程
# ============================================================

def chat(query: str, index, chunks, prompts_data, embed_key: str,
         llm_key: str = None, current_zone: str = "未指定", current_node: str = "未指定",
         unlocked_badges: str = "无", show_retrieval: bool = True) -> str:
    """
    完整的 RAG + LLM 问答流程
    """
    # Step 1: RAG 检索
    results = retrieve(query, index, chunks, embed_key, top_k=3)

    if show_retrieval:
        print(f"\n  🔍 检索到 {len(results)} 条相关段落:")
        for r in results:
            print(f"    #{r['rank']} [{r['nodeBinding']}] 相似度={r['similarity']:.4f}")
            print(f"       {r['text'][:80]}...")
            if r['containsQuote']:
                print(f"       💬 名言: {r['quoteText']}")

    # Step 2: 组装检索上下文
    context_parts = []
    for r in results:
        context_parts.append(f"【{r['nodeBinding']}】{r['text']}")
    retrieved_context = "\n\n".join(context_parts)

    # 如果检索结果太少，追加 fallback 提示
    if len(results) == 0 or results[0]['similarity'] < 0.5:
        retrieved_context += "\n\n【提示】以上检索结果可能不够充分，请尽量基于已有信息回答，并引导用户探索展馆其他内容。"

    # Step 3: LLM 生成
    answer = generate_answer(
        query, retrieved_context, prompts_data, llm_key or embed_key,
        current_zone, current_node, unlocked_badges
    )

    return answer


# ============================================================
# 交互式聊天
# ============================================================

def interactive_chat(index, chunks, prompts_data, embed_key: str, llm_key: str = None):
    """交互式聊天循环"""
    print("\n" + "=" * 60)
    print("  追光健雄｜云端数字展馆 - 数字人对话")
    print("  输入问题开始聊天，输入 'quit' 退出")
    print("  输入 'preset' 运行预设问题测试")
    print("=" * 60)

    while True:
        try:
            query = input("\n🙋 你: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见！")
            break

        if not query:
            continue
        if query.lower() in ('quit', 'exit', 'q'):
            print("再见！")
            break
        if query.lower() == 'preset':
            run_preset_tests(index, chunks, prompts_data, embed_key, all_questions=False, llm_key=llm_key)
            continue

        print()
        answer = chat(query, index, chunks, prompts_data, embed_key, llm_key=llm_key)
        print(f"\n🧪 吴健雄: {answer}")


def run_preset_tests(index, chunks, prompts_data, embed_key: str, all_questions: bool = False, llm_key: str = None):
    """运行预设问题测试"""
    questions = prompts_data.get("presetQuestions", [])

    if not all_questions:
        # 随机选3个
        import random
        random.seed(42)
        questions = random.sample(questions, min(3, len(questions)))

    print("\n" + "=" * 60)
    print(f"  预设问题测试（{len(questions)} 题）")
    print("=" * 60)

    for i, q in enumerate(questions, 1):
        print(f"\n{'─' * 50}")
        print(f"  Q{i}: {q['question']}")
        print(f"  关联节点: {q['relatedNode']} | 展区: {q['relatedZone']}")
        print(f"  预期长度: {q['expectedLength']}")
        print(f"{'─' * 50}")

        answer = chat(
            q['question'], index, chunks, prompts_data, embed_key, llm_key=llm_key,
            current_zone=q['relatedZone'],
            current_node=q['relatedNode'],
            show_retrieval=True
        )

        print(f"\n  🧪 吴健雄: {answer}")
        print(f"  📏 回答长度: {len(answer)} 字")


# ============================================================
# 主函数
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="追光健雄 数字人聊天")
    parser.add_argument("--api-key", type=str, default=None, help="通义千问对话 API Key")
    parser.add_argument("--embed-key", type=str, default=None, help="DashScope Embedding API Key（如不同）")
    parser.add_argument("--preset", action="store_true", help="运行预设问题测试")
    parser.add_argument("--all", action="store_true", help="运行全部预设问题")
    parser.add_argument("--question", type=str, default=None, help="直接提问（单次模式）")
    args = parser.parse_args()

    # API Keys
    llm_key = args.api_key or os.environ.get("LLM_API_KEY")
    embed_key = args.embed_key or args.api_key or os.environ.get("DASHSCOPE_API_KEY")
    if not llm_key:
        print("❌ 请提供对话 API Key: --api-key sk-xxx")
        sys.exit(1)
    if not embed_key:
        print("❌ 请提供 Embedding API Key: --embed-key sk-xxx")
        sys.exit(1)

    # 加载资源
    print("📂 加载 RAG 索引和知识库...")
    index, chunks = load_rag_index()
    print(f"  ✅ 索引: {index.ntotal} 个向量")
    print(f"  ✅ 知识片段: {len(chunks)} 条")

    print("📂 加载 Prompt 模板...")
    prompts_data = load_prompts()
    print(f"  ✅ System Prompt: {len(prompts_data['systemPrompt']['content'])} 字符")
    print(f"  ✅ 预设问题: {len(prompts_data['presetQuestions'])} 条")

    # 执行模式
    if args.question:
        answer = chat(args.question, index, chunks, prompts_data, embed_key, llm_key=llm_key)
        print(f"\n🧪 吴健雄: {answer}")
    elif args.preset:
        run_preset_tests(index, chunks, prompts_data, embed_key, args.all, llm_key=llm_key)
    else:
        interactive_chat(index, chunks, prompts_data, embed_key, llm_key=llm_key)


if __name__ == "__main__":
    main()
