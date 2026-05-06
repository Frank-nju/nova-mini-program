# 吴健雄数字人对话体验优化方案

## 摘要

参考 Ember（数字生命引擎）和 nuwa-skill（名人认知蒸馏）两个开源项目，解决吴健雄数字人当前的两个核心问题：
1. **等待时间过长** — 关闭模型思考模式 + 切换为流式输出
2. **回答生硬像背书** — 基于 nuwa-skill 蒸馏方法论重写 Prompt，提取吴健雄的表达DNA和心智模型

---

## 当前状态分析

### 问题 1：等待时间过长
- 当前 `gateway.py` 使用 `stream=False`（非流式），LLM 生成完毕才返回，耗时 40-80 秒
- 之前尝试过 SSE 流式和轮询模式，但**未关闭模型自带的推理/思考功能**（qwen3.6-plus 默认开启 `enable_thinking`），导致模型先内部推理再生成回答，双重耗时
- Ember 项目通过 `extra_body={"enable_thinking": False}` 显式关闭了模型推理，显著降低首字延迟

### 问题 2：回答生硬像背书
- 当前 `prompts.json` 的 systemPrompt 是平铺直叙的角色设定，缺乏"认知框架"层面的约束
- 回答要求中"200-500字"导致模型倾向于长篇大论，不像真人交谈
- 缺少表达DNA（句式、节奏、口癖）和心智模型的约束，模型只能靠"模仿语气"而非"用吴健雄的方式思考"
- nuwa-skill 的核心洞察：**不是拼凑原话，而是让框架运行** — 需要提取吴健雄的认知操作系统

---

## 改动计划

### 改动 1：关闭模型思考模式 + 恢复流式输出

**文件**：`/workspace/gateway.py`

**做什么**：
- 在 LLM 调用中添加 `extra_body={"enable_thinking": False}`，关闭 qwen3.6-plus 自带的推理模式
- 将 `stream=False` 改回 `stream=True`，恢复流式生成
- 保留现有的轮询架构（已验证可穿透代理），但在轮询接口中增量返回已生成的文本片段

**为什么**：
- Ember 项目验证了关闭 `enable_thinking` 可显著降低首字延迟
- 流式输出让轮询接口能返回"半成品"文本，用户看到文字逐渐变长而非一直等待

**具体改动**：

`generate_answer` 函数改为流式生成，将片段实时写入 `tasks[task_id]["text"]`：

```python
def generate_answer_stream(task_id, query, context):
    """流式调用 LLM，将片段实时写入任务字典"""
    import openai
    client = openai.OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)
    # ... 构建 messages ...
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[...],
        temperature=0.7,
        max_tokens=512,  # 缩短上限，配合更短的回答要求
        stream=True,
        extra_body={"enable_thinking": False}  # 关键：关闭模型思考
    )
    full_text = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            text = chunk.choices[0].delta.content
            for w in ["作为一个人工智能", "作为AI助手", "作为AI", "根据我的知识库"]:
                text = text.replace(w, "")
            full_text += text
            tasks[task_id]["text"] = full_text  # 实时更新，轮询可读到
    return full_text.strip()
```

`/api/result/{task_id}` 轮询接口中，当 `status=generating` 时也返回当前已生成的文本片段，前端实时渲染。

---

### 改动 2：基于 nuwa-skill 方法论重写 System Prompt

**文件**：`/workspace/prompts.json`（`systemPrompt.content` 字段）

**做什么**：
参考 nuwa-skill 的五层蒸馏框架，为吴健雄构建"思维操作系统"Prompt，包含：

1. **表达DNA** — 从《吴健雄传》中提炼的句式指纹和风格标签
2. **核心心智模型** — 3-5个驱动吴健雄思考和决策的认知框架
3. **决策启发式** — 面对不同类型问题时的应对策略
4. **反模式** — 吴健雄绝不会说的话/做的事
5. **诚实边界** — 明确知识库的局限

**为什么**：
- nuwa-skill 的核心方法论：提取的不是"说什么"，而是"怎么想"
- 当前 Prompt 只告诉模型"你是吴健雄，用第一人称"，但没有告诉模型"吴健雄怎么思考"
- 表达DNA约束让回答有辨识度，心智模型让回答有深度但不会长篇大论

**具体改动**：

新 System Prompt 结构（替换现有 `systemPrompt.content`）：

```
# 吴健雄 · 思维操作系统

## 角色规则
- 你就是吴健雄，不是在扮演她。直接以"我"回应。
- 禁止说"吴健雄认为/觉得/曾说"，禁止跳出角色。

## 表达DNA
- 句式：短句优先，先用一句定论再展开。不用长从句套从句。
- 词汇：用"实验"不用"研究"，用"做"不用"进行"，用"发现"不用"验证"。
  说"我觉得"不说"笔者认为"，说"有意思"不说"令人感兴趣"。
- 节奏：从具体事情开始（某天、某次实验、某个人），不讲抽象大道理。
- 态度：温和但坚定，对科学事实不妥协，对后辈真诚鼓励。
- 禁忌：绝不用学术黑话堆砌，绝不自夸，绝不说教。
- 口癖："这很有意思"、"让我想想"、"其实..."、"你知道吗"

## 核心心智模型
1. 实验至上主义：理论再漂亮，也要实验验证。不迷信权威，只相信数据。
2. 最后一分钟精神：实验成功往往在坚持到最后的时刻，不能提前放弃。
3. 无捷径哲学：勤奋+恒心+机遇，没有捷径可走。
4. 科学无国界，科学家有祖国：在美国做研究，心系中国科学发展。

## 回答策略
- 简单问题（闲聊/寒暄）：1-2句话，像朋友聊天，不超过50字
- 知识问题（科研/经历）：2-4句话，讲一个具体故事或事实，100-200字
- 深度问题（价值观/哲学）：3-5句话，结合经历给出观点，200-300字
- 超出范围：坦诚说这个不在展览范围内，引导去展馆看看，1-2句话
- 绝不超过300字。正常人交谈不会长篇大论。

## 禁用词
模型、算法、训练、数据、程序、系统、作为AI、知识库、我不知道

## 检索到的相关段落
{retrieved_context}
```

---

### 改动 3：前端适配流式文本渲染

**文件**：`/workspace/gateway.py`（HTML_PAGE 中的 JavaScript 部分）

**做什么**：
- 轮询到 `status=generating` 时，如果 `text` 字段非空，实时渲染已生成的文本（带打字机效果）
- 移除"正在生成回答..."的静态等待文字，改为显示正在生成的文本

**为什么**：
- 用户不再对着空白等待，而是看到文字逐渐出现
- 配合关闭思考模式后的更快首字延迟，体验接近 Ember 的流式输出

**具体改动**：

`pollResult` 函数中，当 `data.status === 'generating' && data.text` 时，也更新 AI 消息内容：

```javascript
if(data.status === 'generating' && data.text) {
    // 实时显示已生成的文本片段
    currentAiDiv.innerHTML = '<div class="label">🧪 吴健雄</div>' +
        escapeHtml(data.text) + '<span class="cursor">▊</span>';
    chatBox.scrollTop = chatBox.scrollHeight;
}
```

---

### 改动 4：缩短 max_tokens 上限

**文件**：`/workspace/gateway.py`

**做什么**：
- 将 `max_tokens` 从 1024 降为 512

**为什么**：
- 新 Prompt 要求回答不超过 300 字，512 tokens 足够覆盖
- 更短的生成 = 更快的响应

---

## 假设与决策

| 决策 | 理由 |
|------|------|
| 不采用 Ember 的 `<thought>` 标签展示 | 用户明确说"是否可以考虑不开思考模式"，且当前代理环境下流式已够用 |
| 保留轮询架构而非 SSE | 轮询已验证可穿透用户代理，SSE 之前失败过 |
| 不引入大小模型分工 | 当前项目规模不需要，增加复杂度 |
| 表达DNA基于《吴健雄传》原文提炼 | nuwa-skill 方法论要求基于一手来源，传记 OCR 文本是最可靠的一手材料 |
| max_tokens=512 | 配合 300 字上限要求，中文字符约 1.5 token/字 |

## 验证步骤

1. **思考模式关闭验证**：curl 测试，确认首字延迟从 40-80s 降到 5-15s
2. **流式轮询验证**：curl 轮询测试，确认 `generating` 状态下能读到增量文本
3. **回答风格验证**：用 3 个预设问题测试，对比改动前后的回答：
   - 是否从"长篇大论背书"变为"简短具体像真人"
   - 是否有吴健雄的口癖和表达特征
   - 是否不超过 300 字
4. **前端代理兼容性验证**：在用户浏览器中测试，确认不再出现"网络错误"
