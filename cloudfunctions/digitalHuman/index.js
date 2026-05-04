// 追光健雄 - 数字人对话云函数
// 基于 RAG + LLM（通义千问），以吴健雄第一人称口吻回答

const cloud = require('wx-server-sdk')
const http = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// ============================================================
// 知识库数据（内嵌 62 chunks）
// ============================================================

const KNOWLEDGE_CHUNKS = [
  { id: "node_1912_birth_01", nodeBinding: "node_1912_birth", theme: "生平履历", text: "一九一二年十月，吴健雄出生于江苏太仓浏河镇。这是一个江南水乡，水路交通便利，文化积淀深厚。" },
  { id: "node_1912_birth_02", nodeBinding: "node_1912_birth", theme: "生平履历", text: "吴健雄的父亲吴仲裔是一个思想开明的知识分子。他反对女子无才便是德的旧观念，认为女孩子也应该读书识字，接受教育。" },
  { id: "node_1912_birth_03", nodeBinding: "node_1912_birth", theme: "生平履历", text: "吴健雄从小就表现出聪慧和好学。父亲在家中为她营造了一个良好的读书环境，使她能够接触到新思想和新知识。" },
  { id: "node_1912_birth_04", nodeBinding: "node_1912_birth", theme: "生平履历", text: "浏河镇虽然不大，但文化氛围浓厚。吴健雄在这里度过了童年的美好时光，对世界充满了好奇。" },
  { id: "node_1912_birth_05", nodeBinding: "node_1912_birth", theme: "生平履历", text: "父亲吴仲裔经常给年幼的吴健雄讲述外面的世界，告诉她有许多值得学习的人和事。这些故事在她心中种下了求知的种子。" },
  { id: "node_1912_birth_06", nodeBinding: "node_1912_birth", theme: "生平履历", text: "在那个年代，多数女孩的命运是早早嫁人、操持家务。但吴健雄的父亲不同，他鼓励女儿追求知识和独立。" },
  { id: "node_1924_school_01", nodeBinding: "node_1924_school", theme: "生平履历", text: "一九二四年，十二岁的吴健雄离开家乡浏河镇，到苏州去求学。这在当时是一个非常勇敢的决定。" },
  { id: "node_1924_school_02", nodeBinding: "node_1924_school", theme: "生平履历", text: "吴健雄考入苏州女子师范学校。这是一所培养女性师资力量的学校，在当时具有很高的声誉。" },
  { id: "node_1924_school_03", nodeBinding: "node_1924_school", theme: "生平履历", text: "在苏州女师，吴健雄成绩优异，尤其对数学和自然科学表现出浓厚的兴趣。她的才华开始崭露头角。" },
  { id: "node_1924_school_04", nodeBinding: "node_1924_school", theme: "生平履历", text: "毕业后，吴健雄在苏州一所小学教书。但她并没有满足于这份安稳的工作，而是继续追求更高的学术目标。" },
  { id: "node_1924_school_05", nodeBinding: "node_1924_school", theme: "生平履历", text: "一九三〇年，吴健雄以优异的成绩考入中央大学数学系。一年后，她发现物理更适合自己的志趣，便转入物理系。" },
  { id: "node_1924_school_06", nodeBinding: "node_1924_school", theme: "生平履历", text: "胡适当年去苏州女师演讲，给了吴健雄很高的评价。后来他在推荐吴健雄赴美留学时，给出了满分两百分的推荐分数。" },
  { id: "node_1924_school_07", nodeBinding: "node_1924_school", theme: "生平履历", text: "吴健雄在大学期间刻苦钻研，打下了扎实的物理学基础。她不仅学习课本知识，还积极参与实验研究。" },
  { id: "node_1936_usa_01", nodeBinding: "node_1936_usa", theme: "生平履历", text: "一九三六年，吴健雄怀着对科学的热忱，远渡重洋来到美国。她进入加州大学伯克利分校攻读物理学博士学位。" },
  { id: "node_1936_usa_02", nodeBinding: "node_1936_usa", theme: "生平履历", text: "在伯克利，吴健雄的博士论文工作是研究beta衰变理论，她对费米提出的弱相互作用理论进行了实验验证。" },
  { id: "node_1936_usa_03", nodeBinding: "node_1936_usa", theme: "生平履历", text: "费米是当时最伟大的物理学家之一。他对吴健雄的实验工作非常重视，亲自到实验室指导，两人建立了深厚的师生友谊。" },
  { id: "node_1936_usa_04", nodeBinding: "node_1936_usa", theme: "生平履历", text: "在伯克利求学期间，吴健雄遇到了后来成为她丈夫的袁家骝。袁家骝也是物理学家，两人志同道合。" },
  { id: "node_1936_usa_05", nodeBinding: "node_1936_usa", theme: "生平履历", text: "吴健雄在美国求学并非一帆风顺。作为一个来自中国的年轻女性，她面临着种族和性别的双重歧视。但她以优异的成绩证明了自己。" },
  { id: "node_1956_return_01", nodeBinding: "node_1956_return", theme: "生平履历", text: "一九五六年，吴健雄第一次回到阔别二十年的祖国。周恩来总理在中南海亲切接见了她。" },
  { id: "node_1956_return_02", nodeBinding: "node_1956_return", theme: "生平履历", text: "周总理对她说：\"中国人不比别人笨，只要给条件，一样能做出世界一流的成果。\"这番话深深打动了吴健雄。" },
  { id: "node_1956_return_03", nodeBinding: "node_1956_return", theme: "生平履历", text: "吴健雄始终心系祖国的科学事业。她多次回国讲学，培养年轻一代的物理学家，为中国核物理和粒子物理的发展做出了重要贡献。" },
  { id: "node_1997_pass_01", nodeBinding: "node_1997_pass", theme: "生平履历", text: "一九九七年二月十六日，吴健雄在纽约逝世，享年八十四岁。她的一生是为科学事业奋斗的一生。" },
  { id: "node_1997_pass_02", nodeBinding: "node_1997_pass", theme: "生平履历", text: "按照吴健雄的遗愿，她的骨灰被安葬在故乡江苏太仓浏河镇。墓碑上刻着她生前选定的铭文：\"一个永远的中国人\"。" },
  { id: "node_1997_pass_03", nodeBinding: "node_1997_pass", theme: "生平履历", text: "吴健雄的离去是科学界的重大损失。但她留下的科学精神和人格力量，将永远激励后人。" },
  { id: "node_1956_parity_01", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "一九五六年，杨振宁和李政道提出了一个大胆的想法：在弱相互作用中，宇称可能不守恒。但这一理论需要实验验证。" },
  { id: "node_1956_parity_02", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "吴健雄设计并领导了著名的钴-60（Co-60）实验。这个实验需要在极低温条件下进行，技术难度极高。" },
  { id: "node_1956_parity_03", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "实验在美国国家标准局的低温实验室进行。吴健雄和她的团队克服了一个又一个技术难题。" },
  { id: "node_1956_parity_04", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "一九五七年一月九日深夜，实验结果出来了——宇称在弱相互作用中确实不守恒。这是一个震惊物理学界的发现。" },
  { id: "node_1956_parity_05", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "一九五七年，杨振宁和李政道获得了诺贝尔物理学奖。吴健雄作为实验验证的关键人物却没有获奖，这成为科学史上最大的遗憾之一。" },
  { id: "node_1956_parity_06", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "尽管没有获得诺贝尔奖，吴健雄的实验贡献得到了科学界的广泛认可。她被誉为\"核物理女王\"，成为中国最伟大实验物理学家的代表。" },
  { id: "node_beta_decay_01", nodeBinding: "node_beta_decay", theme: "科研丰碑", text: "吴健雄的博士论文工作是验证费米的beta衰变理论。这项工作奠定了她作为实验物理学家的基础。" },
  { id: "node_beta_decay_02", nodeBinding: "node_beta_decay", theme: "科研丰碑", text: "费米亲自指导了吴健雄的研究。他对吴健雄的实验能力给予了极高的评价，认为她的数据永远可以相信。" },
  { id: "node_beta_decay_03", nodeBinding: "node_beta_decay", theme: "科研丰碑", text: "在曼哈顿计划期间，吴健雄也参与了重要的研究工作。她帮助解决了铀浓缩过程中的一些关键问题。" },
  { id: "node_other_exp_01", nodeBinding: "node_other_exp", theme: "科研丰碑", text: "吴健雄一生发表了大量学术论文，其中许多具有里程碑意义。她的研究领域涵盖beta衰变、宇称不守恒、穆斯堡尔效应等多个方面。" },
  { id: "node_other_exp_02", nodeBinding: "node_other_exp", theme: "科研丰碑", text: "吴健雄是第一位担任美国物理学会会长的女性，也是第一位获得沃尔夫物理学奖的华人女性科学家。" },
  { id: "node_other_exp_03", nodeBinding: "node_other_exp", theme: "科研丰碑", text: "她始终关注女性在科学领域的地位问题，致力于推动女性科学家获得更多机会和认可。" },
  { id: "node_spirit_quote_01", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "吴健雄有五条人生信条：把忠心交给国家，把孝心奉给父母，把爱心献给事业，把真诚送给朋友，把信心留给自己。" },
  { id: "node_spirit_quote_02", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "她常常对学生说：\"做科学研究，第一要勤奋，第二要坚持，第三要诚实。\"这三点贯穿了她的一生。" },
  { id: "node_spirit_quote_03", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "吴健雄认为，年轻人最重要的是保持好奇心。\"不要怕弄脏手，\"她说，\"好的实验都是在反复动手中做出来的。\"" },
  { id: "node_spirit_quote_04", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "她告诫学生，基础要宽厚，不能太早钻进一个窄领域。\"你们现在打基础，就像盖房子，地基打不牢，房子是建不高的。\"" },
  { id: "node_spirit_quote_05", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "吴健雄对女性科研工作者的寄语是：不要自我设限。\"女性的智力并不比男性差，关键是你要相信自己。\"" },
  { id: "node_spirit_quote_06", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "她常说：\"这很有意思。\"这是她面对新发现、新问题时的习惯性表达。她对世界始终保持着孩童般的好奇。" },
  { id: "node_spirit_quote_07", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "吴健雄有一句朴素的话：\"其实，做实验也没有什么秘诀，就是不停地做，一直做下去，总会做出结果来。\"" },
  { id: "node_spirit_quote_08", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "她对学生非常温和，但要求极其严格。\"她对学生说：\"你知道吗，一个实验要经得起别人重复，这才是真正的可靠性。\"" },
  { id: "node_spirit_method_01", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "吴健雄的治学方法可以概括为：无捷径哲学——勤奋加恒心加机遇。她认为科学研究没有捷径可走，必须一步一个脚印。" },
  { id: "node_spirit_method_02", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "\"最后一分钟精神\"是吴健雄科研精神的精髓。很多实验的成功，往往在于最后关头不放弃，坚持到最后一刻。" },
  { id: "node_spirit_method_03", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "吴健雄的实验以严谨著称。她的数据精确度极高，同事们都说\"吴健雄的实验数据，永远可以相信\"。" },
  { id: "node_spirit_principle_01", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "吴健雄坚守的原则是：科学无国界，科学家有祖国。她在美国做研究，但始终心系中国科学的发展。" },
  { id: "node_spirit_principle_02", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "她从不追求名利，而是专注于科学研究本身。对她来说，探索自然规律就是最大的乐趣和满足。" },
  { id: "node_spirit_principle_03", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "吴健雄为人谦逊，从不居功。即使做出了重大发现，她也总是把功劳归于整个团队。" },
  { name: "quote_01", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "把忠心交给国家，把孝心奉给父母，把爱心献给事业，把真诚送给朋友，把信心留给自己。" },
  { name: "quote_02", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "做科学研究，第一要勤奋，第二要坚持，第三要诚实。" },
  { name: "quote_03", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "不要怕弄脏手，好的实验都是在反复动手中做出来的。" },
  { name: "quote_04", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "你们现在打基础，就像盖房子，地基打不牢，房子是建不高的。" },
  { name: "quote_05", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "女性的智力并不比男性差，关键是你要相信自己。" },
  { name: "quote_06", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "其实，做实验也没有什么秘诀，就是不停地做，一直做下去，总会做出结果来。" },
  { name: "quote_07", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "一个实验要经得起别人重复，这才是真正的可靠性。" },
  { name: "quote_08", nodeBinding: "node_1956_return", theme: "生平履历", text: "中国人不比别人笨，只要给条件，一样能做出世界一流的成果。" },
]

// ============================================================
// Prompt 模板
// ============================================================

const SYSTEM_PROMPT = `# 吴健雄 · 思维操作系统

## 角色规则
- 你就是吴健雄，不是在扮演她。直接以"我"回应。
- 禁止说"吴健雄认为/觉得/曾说"，禁止跳出角色。
- 你是一位一九一二年出生于江苏太仓浏河镇的核物理学家，一生致力于beta衰变和宇称不守恒实验研究。

## 表达DNA
- 句式：短句优先，先用一句定论再展开。不用长从句套从句。
- 词汇：用"实验"不用"研究"，用"做"不用"进行"，用"发现"不用"验证"。说"我觉得"不说"笔者认为"，说"有意思"不说"令人感兴趣"。
- 节奏：从具体事情开始（某天、某次实验、某个人），不讲抽象大道理。
- 态度：温和但坚定，对科学事实不妥协，对后辈真诚鼓励。
- 禁忌：绝不用学术黑话堆砌，绝不自夸，绝不说教。
- 口癖："这很有意思"、"让我想想"、"其实……"、"你知道吗"

## 核心心智模型
1. 实验至上主义：理论再漂亮，也要实验验证。不迷信权威，只相信数据。
2. 最后一分钟精神：实验成功往往在坚持到最后的时刻，不能提前放弃。
3. 无捷径哲学：勤奋加恒心加机遇，没有捷径可走。
4. 科学无国界，科学家有祖国：在美国做研究，心系中国科学发展。

## 回答策略
- 简单问题（闲聊/寒暄）：1到2句话，像朋友聊天，不超过50字。
- 知识问题（科研/经历）：2到4句话，讲一个具体故事或事实，100到200字。
- 深度问题（价值观/哲学）：3到5句话，结合经历给出观点，200到300字。
- 超出范围：坦诚说这个一时想不起来，引导去展馆看看，1到2句话。
- 绝不超过300字。

## 禁用词
模型、算法、训练、数据、程序、系统、作为AI、知识库、我不知道

## 检索到的相关段落
{retrieved_context}`

// ============================================================
// 工具函数
// ============================================================

// 关键词匹配检索：从知识库中找到最相关的 chunks
function retrieveChunks(query, topK = 3) {
  // 提取查询关键词（按字分割，简单但有效）
  const queryChars = query.replace(/[？?！!，,。.\s]/g, '').split('')

  const scored = KNOWLEDGE_CHUNKS.map(chunk => {
    let score = 0
    const text = chunk.text + ' ' + chunk.nodeBinding + ' ' + chunk.theme
    for (const char of queryChars) {
      if (text.includes(char)) {
        score++
      }
    }
    // 长度归一化
    score = score / Math.sqrt(text.length)
    return { ...chunk, score }
  })

  return scored
    .filter(c => c.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

// 调用通义千问 API
function callLLM(systemContent, userContent) {
  const LLM_API_KEY = process.env.LLM_API_KEY || ''
  if (!LLM_API_KEY) {
    return Promise.reject(new Error('LLM_API_KEY 未配置'))
  }

  const postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ],
    temperature: 0.7,
    max_tokens: 512,
  })

  return new Promise((resolve, reject) => {
    const data = Buffer.from(postData, 'utf-8')
    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Length': data.length,
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            resolve(parsed.choices[0].message.content.trim())
          } else {
            reject(new Error('LLM 响应格式异常: ' + body.substring(0, 200)))
          }
        } catch (e) {
          reject(new Error('LLM 响应解析失败: ' + e.message))
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => {
      req.destroy(new Error('LLM 请求超时'))
    })
    req.write(data)
    req.end()
  })
}

// 兜底回答
const FALLBACK_ANSWERS = [
  "这个问题让我想起了很多往事，但似乎一时难以完整回答。不如我们去看看展馆里的其他内容？",
  "嗯，这个问题很有意思。不过我的记忆似乎有些模糊了，不如你去展馆里看看，那里有更详细的资料。",
  "让我想想……嗯，这个问题我一时说不太清楚。你可以去展馆里找找线索，也许会有启发。"
]

exports.main = async (event, context) => {
  const { question } = event

  if (!question || !question.trim()) {
    return {
      code: 1001,
      message: '问题不能为空',
      data: { text: '你好，我是吴健雄。你想问些什么？' }
    }
  }

  try {
    // 1. 检索相关知识
    const relevantChunks = retrieveChunks(question, 3)
    const contextText = relevantChunks
      .map(c => `【${c.nodeBinding}】${c.text}`)
      .join('\n\n') || '暂无相关知识。'

    // 2. 生成回答
    const systemContent = SYSTEM_PROMPT.replace('{retrieved_context}', contextText)
    const userContent = `用户问题：${question}\n\n请基于以上知识，以吴健雄先生的第一人称口吻，温和亲切地回答。`

    let answer
    if (process.env.LLM_API_KEY) {
      answer = await callLLM(systemContent, userContent)
      // 清理禁用词
      for (const w of ['作为一个人工智能', '作为AI助手', '作为AI', '根据我的知识库']) {
        answer = answer.replace(w, '')
      }
    } else {
      // 无 LLM API Key，使用简单兜底
      answer = FALLBACK_ANSWERS[Math.floor(Math.random() * FALLBACK_ANSWERS.length)]
    }

    return {
      code: 0,
      message: 'success',
      data: {
        text: answer,
        retrieval: relevantChunks.slice(0, 3).map(c => ({
          node: c.nodeBinding,
          theme: c.theme,
          preview: c.text.substring(0, 60)
        })),
        hasRAG: relevantChunks.length > 0
      }
    }
  } catch (error) {
    console.error('数字人调用失败:', error)
    return {
      code: 2001,
      message: 'AI 回答失败: ' + error.message,
      data: {
        text: FALLBACK_ANSWERS[Math.floor(Math.random() * FALLBACK_ANSWERS.length)],
        retrieval: [],
        hasRAG: false
      }
    }
  }
}
