#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
追光健雄｜云端数字展馆 - RAG知识库向量化存储脚本
功能：
  1. 加载 knowledge_chunks.json
  2. 文本预处理（去特殊字符、统一标点）
  3. 调用 Embedding API 生成向量（支持阿里云 dashscope / OpenAI）
  4. 构建 FAISS 索引
  5. 检索测试
  6. 保存索引和元数据

依赖安装：
  pip install dashscope openai faiss-cpu numpy

使用方式：
  # 阿里云 dashscope（推荐国内用户）
  python rag_vector_store.py --provider dashscope --api-key sk-xxx --test
  python rag_vector_store.py --provider dashscope --api-key sk-xxx --model text-embedding-v4 --dimension 1536

  # 阿里云 OpenAI 兼容模式
  python rag_vector_store.py --provider openai_compatible --api-key sk-xxx --test

  # OpenAI 官方
  python rag_vector_store.py --provider openai --api-key sk-xxx --test

  # 无API Key测试（模拟向量化）
  python rag_vector_store.py --test
"""

import json
import re
import argparse
import os
import sys
import time
import numpy as np
from typing import List, Dict, Optional, Tuple

# ============================================================
# 配置
# ============================================================

# 各 provider 默认配置
PROVIDER_CONFIGS = {
    "dashscope": {
        "model": "text-embedding-v4",
        "dimension": 1536,       # v4 支持 2048/1536/1024/768/512/256/128/64
        "batch_size": 10,        # v4 单次最多10条
        "description": "阿里云 DashScope（推荐国内用户，中文效果最佳）"
    },
    "openai_compatible": {
        "model": "text-embedding-v3",
        "dimension": 1024,
        "batch_size": 20,
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "description": "阿里云 OpenAI 兼容模式"
    },
    "openai": {
        "model": "text-embedding-3-small",
        "dimension": 1536,
        "batch_size": 20,
        "description": "OpenAI 官方（需科学上网+国际信用卡）"
    }
}

DEFAULT_PROVIDER = "dashscope"
TOP_K_DEFAULT = 5  # 默认检索返回数量


# ============================================================
# Step 1: 文本预处理
# ============================================================

def preprocess_text(text: str) -> str:
    """
    文本预处理：
    - 去除特殊字符
    - 统一标点（全角→半角）
    - 去除多余空白
    - 检查完整性
    """
    if not text or not text.strip():
        return ""

    # 统一全角标点为半角（保留中文标点）
    # 这里我们保留中文标点，只处理英文相关
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # 去除多余空行
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 去除首尾空白
    text = text.strip()

    # 替换特殊空白字符
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    return text


def preprocess_chunks(chunks: List[Dict]) -> List[Dict]:
    """批量预处理所有文本片段"""
    processed = []
    skipped = []
    for chunk in chunks:
        clean_text = preprocess_text(chunk["text"])
        if len(clean_text) < 10:  # 过短的片段跳过
            skipped.append(chunk["id"])
            continue
        chunk["text_clean"] = clean_text
        processed.append(chunk)

    if skipped:
        print(f"⚠️  跳过 {len(skipped)} 个过短片段: {skipped}")
    return processed


# ============================================================
# Step 2: 向量化（多 Provider 支持）
# ============================================================

def get_embeddings_dashscope(
    texts: List[str],
    api_key: str,
    model: str = "text-embedding-v4",
    dimension: int = 1536,
    batch_size: int = 25
) -> List[List[float]]:
    """
    调用阿里云 DashScope Embedding API（原生 SDK）
    文档：https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-api-details
    """
    try:
        import dashscope
        from http import HTTPStatus
    except ImportError:
        print("❌ 请先安装 dashscope: pip install dashscope")
        sys.exit(1)

    dashscope.api_key = api_key
    all_embeddings = []
    total_batches = (len(texts) - 1) // batch_size + 1

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"  📦 向量化批次 {batch_num}/{total_batches} "
              f"({len(batch)} 条文本)...")

        max_retries = 3
        for retry in range(max_retries):
            try:
                resp = dashscope.TextEmbedding.call(
                    model=model,
                    input=batch,
                    dimension=dimension,
                    text_type="document"
                )
                if resp.status_code == HTTPStatus.OK:
                    for item in resp.output["embeddings"]:
                        all_embeddings.append(item["embedding"])
                    break
                else:
                    raise Exception(f"API 返回错误: {resp.code} - {resp.message}")
            except Exception as e:
                if retry < max_retries - 1:
                    wait_time = (retry + 1) * 3
                    print(f"    ⚠️  请求失败，{wait_time}秒后重试... 错误: {e}")
                    time.sleep(wait_time)
                else:
                    raise e

        # 避免 API 速率限制
        if i + batch_size < len(texts):
            time.sleep(0.5)

    return all_embeddings


def get_embeddings_openai(
    texts: List[str],
    api_key: str,
    model: str = "text-embedding-3-small",
    batch_size: int = 20,
    base_url: Optional[str] = None
) -> List[List[float]]:
    """
    调用 OpenAI 兼容的 Embedding API
    支持 OpenAI 官方 和 阿里云 OpenAI 兼容模式
    """
    try:
        import openai
    except ImportError:
        print("❌ 请先安装 openai: pip install openai")
        sys.exit(1)

    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    client = openai.OpenAI(**client_kwargs)

    all_embeddings = []
    total_batches = (len(texts) - 1) // batch_size + 1

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"  📦 向量化批次 {batch_num}/{total_batches} "
              f"({len(batch)} 条文本)...")

        max_retries = 3
        for retry in range(max_retries):
            try:
                response = client.embeddings.create(
                    model=model,
                    input=batch
                )
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                break
            except Exception as e:
                if retry < max_retries - 1:
                    wait_time = (retry + 1) * 5
                    print(f"    ⚠️  请求失败，{wait_time}秒后重试... 错误: {e}")
                    time.sleep(wait_time)
                else:
                    raise e

        if i + batch_size < len(texts):
            time.sleep(1)

    return all_embeddings


def get_embeddings_mock(texts: List[str], dim: int = 1536) -> List[List[float]]:
    """
    模拟向量化（用于无API Key时测试）
    生成随机但确定性的向量
    """
    print("  📦 使用模拟向量化（无API Key模式）...")
    np.random.seed(42)
    embeddings = []
    for text in texts:
        seed = hash(text) % (2**31)
        rng = np.random.RandomState(seed)
        vec = rng.randn(dim).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        embeddings.append(vec.tolist())
    return embeddings


def get_embeddings(
    texts: List[str],
    provider: str,
    api_key: Optional[str],
    model: Optional[str] = None,
    dimension: int = 1536,
    batch_size: Optional[int] = None
) -> Tuple[List[List[float]], int]:
    """
    统一向量化入口，根据 provider 自动选择调用方式
    返回: (embeddings, actual_dim)
    """
    config = PROVIDER_CONFIGS.get(provider, PROVIDER_CONFIGS[DEFAULT_PROVIDER])
    _model = model or config["model"]
    _batch = batch_size or config.get("batch_size", 20)

    if provider == "dashscope":
        embeddings = get_embeddings_dashscope(
            texts, api_key, model=_model,
            dimension=dimension, batch_size=_batch
        )
    elif provider in ("openai", "openai_compatible"):
        _base_url = config.get("base_url") if provider == "openai_compatible" else None
        embeddings = get_embeddings_openai(
            texts, api_key, model=_model,
            batch_size=_batch, base_url=_base_url
        )
    else:
        raise ValueError(f"不支持的 provider: {provider}，可选: {list(PROVIDER_CONFIGS.keys())}")

    actual_dim = len(embeddings[0]) if embeddings else dimension
    return embeddings, actual_dim


# ============================================================
# Step 3: 构建 FAISS 索引
# ============================================================

def build_faiss_index(
    embeddings: List[List[float]],
    dim: int = 1536
):
    """
    构建 FAISS 索引（内积相似度 = 余弦相似度）
    """
    try:
        import faiss
    except ImportError:
        print("❌ 请先安装 faiss-cpu: pip install faiss-cpu")
        sys.exit(1)

    vectors = np.array(embeddings, dtype=np.float32)

    # L2归一化，使内积等价于余弦相似度
    faiss.normalize_L2(vectors)

    # 使用 IndexFlatIP（内积索引）
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    print(f"✅ FAISS 索引构建完成：{index.ntotal} 个向量，{dim} 维")
    return index


# ============================================================
# Step 4: 检索功能
# ============================================================

def search(
    query: str,
    index,
    chunks: List[Dict],
    provider: str = "mock",
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    dimension: int = 1536,
    top_k: int = TOP_K_DEFAULT
) -> List[Dict]:
    """
    检索与查询最相似的文本片段
    """
    # 查询向量化
    if api_key and provider != "mock":
        query_emb, _ = get_embeddings([query], provider, api_key, model, dimension)
    else:
        query_emb = get_embeddings_mock([query], dimension)

    query_vector = np.array(query_emb, dtype=np.float32)
    # 归一化
    norm = np.linalg.norm(query_vector)
    if norm > 0:
        query_vector = query_vector / norm

    # FAISS 检索
    distances, indices = index.search(query_vector, min(top_k, len(chunks)))

    # 组装结果
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if 0 <= idx < len(chunks):
            results.append({
                "rank": len(results) + 1,
                "chunk_id": chunks[idx]["id"],
                "nodeBinding": chunks[idx]["nodeBinding"],
                "theme": chunks[idx]["theme"],
                "similarity": round(float(dist), 4),
                "text_preview": chunks[idx]["text"][:100] + "...",
                "text_full": chunks[idx]["text"],
                "spiritKeywords": chunks[idx].get("spiritKeywords", []),
                "containsQuote": chunks[idx].get("containsQuote", False),
                "quoteText": chunks[idx].get("quoteText", "")
            })

    return results


# ============================================================
# Step 5: 保存/加载
# ============================================================

def save_index_and_data(index, chunks: List[Dict], output_dir: str):
    """保存 FAISS 索引和元数据"""
    try:
        import faiss
    except ImportError:
        print("❌ 请先安装 faiss-cpu")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # 保存 FAISS 索引
    index_path = os.path.join(output_dir, "faiss_index.bin")
    faiss.write_index(index, index_path)
    print(f"  💾 FAISS 索引已保存: {index_path}")

    # 保存元数据（不含向量）
    meta_path = os.path.join(output_dir, "chunks_metadata.json")
    meta_chunks = []
    for c in chunks:
        meta = {k: v for k, v in c.items() if k != "text_clean"}
        meta_chunks.append(meta)

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta_chunks, f, ensure_ascii=False, indent=2)
    print(f"  💾 元数据已保存: {meta_path}")


def load_index_and_data(index_dir: str):
    """加载 FAISS 索引和元数据"""
    try:
        import faiss
    except ImportError:
        print("❌ 请先安装 faiss-cpu")
        sys.exit(1)

    index_path = os.path.join(index_dir, "faiss_index.bin")
    meta_path = os.path.join(index_dir, "chunks_metadata.json")

    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(f"索引文件不存在: {index_dir}")

    index = faiss.read_index(index_path)
    print(f"  📂 FAISS 索引已加载: {index.ntotal} 个向量")

    with open(meta_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    print(f"  📂 元数据已加载: {len(chunks)} 条")

    return index, chunks


# ============================================================
# Step 6: 检索测试
# ============================================================

def run_search_tests(index, chunks: List[Dict], provider: str = "mock",
                     api_key: Optional[str] = None, model: Optional[str] = None,
                     dimension: int = 1536):
    """运行预设检索测试"""
    test_queries = [
        {
            "query": "吴健雄是如何发现宇称不守恒的？",
            "expected_node": "node_1956_parity",
            "description": "宇称不守恒实验"
        },
        {
            "query": "做科研最重要的是什么？",
            "expected_node": "node_spirit_method",
            "description": "治学方法"
        },
        {
            "query": "吴健雄对中国科学发展有什么期望？",
            "expected_node": "node_1956_return",
            "description": "首次归国"
        },
        {
            "query": "吴健雄对年轻人有什么寄语？",
            "expected_node": "node_spirit_quote",
            "description": "名言警句"
        },
        {
            "query": "吴健雄在求学过程中遇到过什么困难？",
            "expected_node": "node_1936_usa",
            "description": "赴美深造"
        },
        {
            "query": "吴健雄和费米有什么交流？",
            "expected_node": "node_beta_decay",
            "description": "β衰变研究"
        },
        {
            "query": "吴健雄如何看待诺贝尔奖？",
            "expected_node": "node_1956_parity",
            "description": "诺贝尔奖争议"
        },
        {
            "query": "吴健雄的父亲是谁？对她的成长有什么影响？",
            "expected_node": "node_1912_birth",
            "description": "出生与童年"
        }
    ]

    print("\n" + "=" * 60)
    print("🔍 检索测试")
    print("=" * 60)

    correct = 0
    total = len(test_queries)

    for i, test in enumerate(test_queries, 1):
        print(f"\n--- 测试 {i}/{total}: {test['description']} ---")
        print(f"查询: {test['query']}")

        results = search(test["query"], index, chunks, provider, api_key, model, dimension, top_k=3)

        hit = False
        for r in results:
            marker = "✅" if r["nodeBinding"] == test["expected_node"] else "  "
            print(f"  {marker} #{r['rank']} [{r['nodeBinding']}] "
                  f"相似度={r['similarity']:.4f} | {r['text_preview'][:60]}")
            if r["nodeBinding"] == test["expected_node"] and not hit:
                hit = True
                correct += 1

        status = "✅ 命中" if hit else "❌ 未命中"
        print(f"  结果: {status} (期望: {test['expected_node']})")

    print(f"\n{'=' * 60}")
    print(f"测试结果: {correct}/{total} 命中 ({correct/total*100:.0f}%)")
    print(f"{'=' * 60}")


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="追光健雄 RAG知识库向量化存储",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 阿里云 dashscope（推荐国内用户）
  python rag_vector_store.py --provider dashscope --api-key sk-xxx --test

  # 阿里云 OpenAI 兼容模式
  python rag_vector_store.py --provider openai_compatible --api-key sk-xxx --test

  # OpenAI 官方
  python rag_vector_store.py --provider openai --api-key sk-xxx --test

  # 无API Key测试
  python rag_vector_store.py --test

  # 检索查询
  python rag_vector_store.py --search-only "吴健雄是如何发现宇称不守恒的？"
        """
    )
    parser.add_argument("--provider", type=str, default=DEFAULT_PROVIDER,
                        choices=list(PROVIDER_CONFIGS.keys()),
                        help=f"Embedding 服务商（默认: {DEFAULT_PROVIDER}）")
    parser.add_argument("--api-key", type=str, default=None,
                        help="API Key（不提供则使用模拟向量化）")
    parser.add_argument("--model", type=str, default=None,
                        help="Embedding 模型名（默认使用 provider 对应的默认模型）")
    parser.add_argument("--dimension", type=int, default=None,
                        help="向量维度（默认: dashscope=1536, openai=1536, openai_compatible=1024）")
    parser.add_argument("--input", type=str, default="/workspace/knowledge_chunks.json",
                        help="知识库JSON文件路径")
    parser.add_argument("--output-dir", type=str, default="/workspace/rag_index",
                        help="索引输出目录")
    parser.add_argument("--test", action="store_true",
                        help="构建完成后运行检索测试")
    parser.add_argument("--search-only", type=str, default=None,
                        help="仅检索模式：直接查询（需已有索引）")
    parser.add_argument("--top-k", type=int, default=TOP_K_DEFAULT,
                        help="检索返回数量")
    args = parser.parse_args()

    # 解析 provider 配置
    config = PROVIDER_CONFIGS[args.provider]
    _model = args.model or config["model"]
    _dimension = args.dimension or config["dimension"]

    # ---- 仅检索模式 ----
    if args.search_only:
        print("📂 加载已有索引...")
        index, chunks = load_index_and_data(args.output_dir)
        print(f"\n🔍 查询: {args.search_only}")
        results = search(args.search_only, index, chunks,
                         args.provider, args.api_key, _model, _dimension, args.top_k)
        for r in results:
            print(f"\n  #{r['rank']} [{r['nodeBinding']}] 相似度={r['similarity']:.4f}")
            print(f"  关键词: {r['spiritKeywords']}")
            if r['containsQuote']:
                print(f"  名言: {r['quoteText']}")
            print(f"  内容: {r['text_preview']}")
        return

    # ---- 构建模式 ----
    print("=" * 60)
    print("追光健雄｜云端数字展馆 - RAG知识库向量化存储")
    print("=" * 60)
    print(f"  Provider: {args.provider} ({config['description']})")
    print(f"  模型: {_model}")
    print(f"  维度: {_dimension}")

    # Step 1: 加载知识片段
    print(f"\n📂 加载知识库: {args.input}")
    with open(args.input, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chunks = data["chunks"]
    stats = data["statistics"]
    print(f"  📊 总片段数: {stats['totalChunks']}")
    print(f"  📊 总字数: {stats['totalChars']}")
    print(f"  📊 节点覆盖: {stats['nodeCoverage']['covered']}/{stats['nodeCoverage']['expected']}")

    # Step 2: 文本预处理
    print(f"\n🧹 文本预处理...")
    chunks = preprocess_chunks(chunks)
    print(f"  ✅ 预处理完成: {len(chunks)} 条有效片段")

    # Step 3: 向量化
    texts = [c["text_clean"] for c in chunks]
    print(f"\n🔢 向量化（{len(texts)} 条文本）...")

    if args.api_key:
        embeddings, actual_dim = get_embeddings(
            texts, args.provider, args.api_key,
            model=_model, dimension=_dimension
        )
    else:
        print("  ⚠️  未提供 API Key，使用模拟向量化")
        embeddings = get_embeddings_mock(texts, _dimension)
        actual_dim = _dimension

    print(f"  ✅ 向量化完成: {len(embeddings)} 个 {actual_dim} 维向量")

    # Step 4: 构建 FAISS 索引
    print(f"\n🏗️  构建 FAISS 索引...")
    index = build_faiss_index(embeddings, dim=actual_dim)

    # Step 5: 保存
    print(f"\n💾 保存索引和元数据...")
    save_index_and_data(index, chunks, args.output_dir)

    # 保存 provider 信息，供后续检索使用
    provider_info = {
        "provider": args.provider,
        "model": _model,
        "dimension": actual_dim
    }
    provider_info_path = os.path.join(args.output_dir, "provider_info.json")
    with open(provider_info_path, 'w', encoding='utf-8') as f:
        json.dump(provider_info, f, ensure_ascii=False, indent=2)

    # Step 6: 检索测试
    if args.test:
        run_search_tests(index, chunks, args.provider, args.api_key, _model, _dimension)

    print(f"\n🎉 全部完成！索引保存在: {args.output_dir}")
    print(f"\n使用方式:")
    print(f"  python rag_vector_store.py --search-only '吴健雄是如何发现宇称不守恒的？'")
    print(f"  python rag_vector_store.py --search-only '做科研最重要的是什么？' --top-k 3")


if __name__ == "__main__":
    main()
