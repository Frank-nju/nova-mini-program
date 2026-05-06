// 追光健雄 - 数字人对话云函数（全直连版）
// RAG + LLM + TTS 全部直连阿里云 DashScope，无需网关服务器
// 
// Actions:
//   chat    - 提问（RAG检索 + LLM生成 + TTS语音），同步返回完整结果
//   presets - 获取预设问题列表

const cloud = require('wx-server-sdk');
const https = require('https');
const WebSocket = require('ws');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ============================================================
// 配置（通过环境变量覆盖）
// ============================================================

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen-plus';
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-v4';
const EMBED_DIM = parseInt(process.env.EMBED_DIM || '1536');
const TTS_MODEL = process.env.TTS_MODEL || 'cosyvoice-v3.5-plus';
const TTS_VOICE = process.env.TTS_VOICE || 'cosyvoice-v3.5-plus-vd-wjxszslow-41e6b9543b174ccfbe0ebae9eb4721c0';

// ============================================================
// 知识库（内嵌 62 chunks）
// ============================================================

const KNOWLEDGE_CHUNKS = [
  { id: "node_1912_birth_01", nodeBinding: "node_1912_birth", theme: "生平履历", text: "吴健雄就是1912年阴历4月29日，也就是阳历的5月31日在浏河出生的。因为在她未诞生的前几年，她的父母亲一直都住在上海，她的父亲吴仲裔参加了革命党的工作。1911年辛亥革命后上海的革命力量和以袁世凯为代表的复辟力量之间，大有战事一触即发之势，吴仲裔是上海商团革命党的负责人之一，鉴于形势紧张，他就让有身孕的夫人先回浏河生产。" },
  { id: "node_1912_birth_02", nodeBinding: "node_1912_birth", theme: "生平履历", text: "对吴健雄一生影响最大、起到了关键作用的，莫过于她的父亲吴仲裔。吴仲裔生于1888年（光绪十四年），老秀才父亲对他的要求很严格，但没有让他继承父业。吴健雄诞生（1912年）的前后，恰逢革命与反革命、复辟与反复辟的殊死较量。吴健雄父亲堪称革新派的先锋，他的思想言行对幼小女儿的心灵起了潜移默化的作用。" },
  { id: "node_1912_birth_03", nodeBinding: "node_1912_birth", theme: "生平履历", text: "吴仲裔是一位具有远见卓识的人，社会稳定后，便进一步考虑家乡的建设，他认为要使家乡富强，必须从教育着手。他决心要从浏河做起，从最薄弱的环节——女子教育抓起。他要在镇上率先创办一所女子学校，拟起名为"明德"女子学校。吴仲裔解释："大学之道，在于明德"，就是"既讲文明、又树新德"。" },
  { id: "node_1912_birth_04", nodeBinding: "node_1912_birth", theme: "生平履历", text: "吴健雄的母亲樊复华是一位贤惠温柔、慈祥宽厚的家庭主妇，是一位非常明白事理的人。她总是把孩子们的前程放在第一位。吴健雄是惟一的女儿，她在处理儿女们的关系上，感情的天平总是向女儿倾斜的。从小健雄开始懂事的那一天起，樊复华就开始给孩子灌输各种知识，教她认方块字、讲故事等。" },
  { id: "node_1912_birth_05", nodeBinding: "node_1912_birth", theme: "生平履历", text: "家中还有一人关系到吴健雄的成长，没有他就没有吴健雄的出国留学，她甚至在周恩来总理会见时也提到的，这就是她的叔叔吴琢之。吴健雄读大学的学费，去美国的一切费用都得到这位叔叔的资助。" },
  { id: "node_1912_birth_06", nodeBinding: "node_1912_birth", theme: "生平履历", text: "一九一二年十月，吴健雄出生于江苏太仓浏河镇。这是一个江南水乡，水路交通便利，文化积淀深厚。父亲吴仲裔是一个思想开明的知识分子。他反对女子无才便是德的旧观念，认为女孩子也应该读书识字，接受教育。" },
  { id: "node_1924_school_01", nodeBinding: "node_1924_school", theme: "生平履历", text: "一九二四年，十二岁的吴健雄离开家乡浏河镇，到苏州去求学。这在当时是一个非常勇敢的决定。吴健雄考入苏州女子师范学校。这是一所培养女性师资力量的学校，在当时具有很高的声誉。" },
  { id: "node_1924_school_02", nodeBinding: "node_1924_school", theme: "生平履历", text: "在苏州女师，吴健雄成绩优异，尤其对数学和自然科学表现出浓厚的兴趣。她的才华开始崭露头角。毕业后，吴健雄在苏州一所小学教书。但她并没有满足于这份安稳的工作，而是继续追求更高的学术目标。" },
  { id: "node_1924_school_03", nodeBinding: "node_1924_school", theme: "生平履历", text: "一九三〇年，吴健雄以优异的成绩考入中央大学数学系。一年后，她发现物理更适合自己的志趣，便转入物理系。吴健雄在大学期间刻苦钻研，打下了扎实的物理学基础。她不仅学习课本知识，还积极参与实验研究。" },
  { id: "node_1924_school_04", nodeBinding: "node_1924_school", theme: "生平履历", text: "胡适当年去苏州女师演讲，给了吴健雄很高的评价。后来他在推荐吴健雄赴美留学时，给出了满分两百分的推荐分数。" },
  { id: "node_1936_usa_01", nodeBinding: "node_1936_usa", theme: "生平履历", text: "一九三六年，吴健雄怀着对科学的热忱，远渡重洋来到美国。她进入加州大学伯克利分校攻读物理学博士学位。在伯克利，吴健雄的博士论文工作是研究beta衰变理论，她对费米提出的弱相互作用理论进行了实验验证。" },
  { id: "node_1936_usa_02", nodeBinding: "node_1936_usa", theme: "生平履历", text: "费米是当时最伟大的物理学家之一。他对吴健雄的实验工作非常重视，亲自到实验室指导，两人建立了深厚的师生友谊。在伯克利求学期间，吴健雄遇到了后来成为她丈夫的袁家骝。袁家骝也是物理学家，两人志同道合。" },
  { id: "node_1936_usa_03", nodeBinding: "node_1936_usa", theme: "生平履历", text: "吴健雄初到美国时，面临着文化差异和性别歧视的双重挑战。但她凭借出色的实验能力和扎实的理论功底，很快在伯克利物理学界崭露头角。她的导师奥本海默对她赞赏有加，称她为"顶尖的实验物理学家"。" },
  { id: "node_1956_return_01", nodeBinding: "node_1956_return", theme: "生平履历", text: "一九五六年，吴健雄开始筹划回国。她对中国科学事业的发展充满关切。周恩来总理在人民大会堂接见了吴健雄和袁家骝。周总理对吴健雄说："中国人不比别人笨，我们要有这个信心。"这句话深深打动了吴健雄。" },
  { id: "node_1956_return_02", nodeBinding: "node_1956_return", theme: "生平履历", text: "吴健雄多次回国讲学，推动中国物理学的发展。她特别关注中国科学教育的改革，认为基础科学教育是培养人才的关键。她常说："科学是没有国界的，但科学家是有祖国的。"" },
  { id: "node_1997_pass_01", nodeBinding: "node_1997_pass", theme: "生平履历", text: "一九九七年二月十六日，吴健雄在纽约去世，享年八十四岁。根据她的遗愿，骨灰被安葬在故乡江苏太仓浏河镇。她终于回到了她深爱的故土。" },
  { id: "node_1997_pass_02", nodeBinding: "node_1997_pass", theme: "生平履历", text: "吴健雄一生获得过无数荣誉，包括美国国家科学勋章、沃尔夫奖等。但她最看重的，是作为一个物理学家的贡献。她曾说："我研究物理，是因为我热爱物理，不是为了获奖。"" },
  { id: "node_1997_pass_03", nodeBinding: "node_1997_pass", theme: "生平履历", text: "吴健雄的座右铭是："把忠心交给国家，把孝心奉给父母，把爱心献给事业，把真诚送给朋友，把信心留给自己。"这五项信条贯穿了她的一生。" },
  { id: "node_1956_parity_01", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "一九五六年，杨振宁和李政道提出了"宇称不守恒"的理论假说。他们认为，在弱相互作用中，宇称可能不守恒。这个假说震惊了物理学界，因为宇称守恒一直被认为是物理学的基本定律之一。" },
  { id: "node_1956_parity_02", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "吴健雄看到杨振宁和李政道的论文后，立刻意识到可以用beta衰变实验来验证这个假说。她设计了一个精巧的实验：使用极化的钴-60原子核，观察其beta衰变中电子的角分布。如果宇称守恒，电子应该对称发射；如果不守恒，电子会偏向一个方向。" },
  { id: "node_1956_parity_03", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "实验需要极低的温度条件。吴健雄与美国国家标准局的安布勒合作，利用他们的低温设备。在华盛顿的那几个月里，她几乎每天都工作到深夜。一九五七年一月九日，实验结果出来了：电子确实偏向一个方向发射，宇称不守恒被证实了！" },
  { id: "node_1956_parity_04", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "这个结果震惊了世界。一九五七年，杨振宁和李政道因此获得诺贝尔物理学奖。但吴健雄没有被列入获奖名单，这至今仍是物理学界的一大遗憾。不过，吴健雄从未对此公开抱怨。她后来获得了沃尔夫奖，这是对她的重要肯定。" },
  { id: "node_1956_parity_05", nodeBinding: "node_1956_parity", theme: "科研丰碑", text: "关于theta-tau之谜：当时物理学家发现两种粒子theta和tau，它们的质量和寿命完全相同，但衰变方式不同。按照宇称守恒，它们应该是同一种粒子；但按照宇称守恒，它们又不能是同一种粒子。这就是著名的theta-tau之谜。杨振宁和李政道提出，如果宇称在弱相互作用中不守恒，这个谜就解开了。" },
  { id: "node_beta_decay_01", nodeBinding: "node_beta_decay", theme: "科研丰碑", text: "吴健雄的博士论文研究的是beta衰变。她精确测量了多种原子核的beta衰变谱，验证了费米的理论预言。费米本人对这个实验结果非常满意，亲自到伯克利查看实验装置，并对吴健雄的工作给予了高度评价。" },
  { id: "node_beta_decay_02", nodeBinding: "node_beta_decay", theme: "科研丰碑", text: "在曼哈顿计划期间，吴健雄参与了气体扩散法分离铀同位素的工作。她解决了一个关键的技术难题，帮助提高了分离效率。这段经历让她与奥本海默、费米等物理学大师有了深入的交流。" },
  { id: "node_other_exp_01", nodeBinding: "node_other_exp", theme: "科研丰碑", text: "吴健雄还做了许多其他重要实验。她精确测量了光子偏振的相关性，验证了量子力学的贝尔不等式。她还研究了缪子原子核的俘获过程，发现了新的核结构信息。" },
  { id: "node_other_exp_02", nodeBinding: "node_other_exp", theme: "科研丰碑", text: "吴健雄是美国物理学会第一位女性会长。她积极推动女性参与科学研究，曾说过："女性在科学界的地位不应该由性别决定，而应该由能力决定。浪费一半人口的智力资源，是人类社会的巨大损失。"" },
  { id: "node_spirit_quote_01", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: "吴健雄的五项信条："把忠心交给国家，把孝心奉给父母，把爱心献给事业，把真诚送给朋友，把信心留给自己。"" },
  { id: "node_spirit_quote_02", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""科学是没有国界的，但科学家是有祖国的。"这是吴健雄常说的话，也是她一生的写照。" },
  { id: "node_spirit_quote_03", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""我研究物理，是因为我热爱物理，不是为了获奖。"吴健雄对科学有着纯粹的热爱。" },
  { id: "node_spirit_quote_04", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""不要怕弄脏手，实验物理学家就是要亲自动手。"这是吴健雄对学生常说的话。" },
  { id: "node_spirit_quote_05", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""理论再漂亮，也要实验验证。不迷信权威，只相信数据。"这体现了吴健雄实验至上的科学哲学。" },
  { id: "node_spirit_quote_06", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""实验成功往往在坚持到最后的时刻，不能提前放弃。"这就是吴健雄的"最后一分钟精神"。" },
  { id: "node_spirit_quote_07", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""中国人不比别人笨，我们要有这个信心。"这是周恩来总理对吴健雄说的话，吴健雄深以为然。" },
  { id: "node_spirit_quote_08", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""好奇心是科学研究的原动力。保持好奇心，永远不要停止追问为什么。"吴健雄对年轻人的忠告。" },
  { id: "node_spirit_quote_09", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""基础要宽厚，才能走得更远。"吴健雄认为扎实的物理基础是一切科学工作的根基。" },
  { id: "node_spirit_quote_10", nodeBinding: "node_spirit_quote", theme: "治学风骨", text: ""勤奋加恒心加机遇，没有捷径可走。"这是吴健雄总结的科学道路。" },
  { id: "node_spirit_method_01", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "吴健雄的实验方法以精确和巧妙著称。她善于设计简洁而有效的实验方案，用最少的设备获得最精确的数据。她的实验记录本总是写得一丝不苟，每一个数据点都有详细的注释。" },
  { id: "node_spirit_method_02", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "吴健雄非常重视实验的可靠性。她会反复验证每一个结果，排除一切可能的系统误差。在做宇称实验时，她花了大量时间校准探测器和温度计，确保结果的准确性。" },
  { id: "node_spirit_method_03", nodeBinding: "node_spirit_method", theme: "治学风骨", text: "吴健雄认为，做实验要有"最后一分钟精神"。很多实验在快要放弃的时候，坚持一下就成功了。她在华盛顿做宇称实验时，连续工作了数月，几乎每天只睡几个小时。" },
  { id: "node_spirit_principle_01", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "吴健雄的科学原则可以概括为：实验至上、严谨求实、不迷信权威。她认为，再伟大的理论，如果不能被实验验证，就只能停留在假说阶段。" },
  { id: "node_spirit_principle_02", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "吴健雄对学生要求严格，但从不严厉批评。她总是耐心地指导，让学生自己发现问题。她常说："最好的老师不是告诉你答案，而是引导你找到答案。"" },
  { id: "node_spirit_principle_03", nodeBinding: "node_spirit_principle", theme: "治学风骨", text: "吴健雄一生淡泊名利。她拒绝了无数商业邀请和媒体采访，把全部精力投入到科学研究中。她的生活简朴，但对科学事业却慷慨大方，多次捐资助学。" },
];

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
- 词汇：用"实验"不用"研究"，用"做"不用"进行"，用"发现"不用"验证"。
  说"我觉得"不说"笔者认为"，说"有意思"不说"令人感兴趣"。
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
- 超出范围：坦诚说这个不在展览范围内，引导去展馆看看，1到2句话。
- 绝不超过300字。正常人交谈不会长篇大论。

## 禁用词
模型、算法、训练、数据、程序、系统、作为AI、知识库、我不知道

## 检索到的相关段落
{retrieved_context}`;

const USER_PROMPT_TEMPLATE = `用户问题：{user_question}

请基于以上知识回答问题，以吴健雄先生的第一人称口吻，温和亲切地回答。`;

const FALLBACK_TEXT = '这个问题让我想起了很多往事，但似乎超出了我这次展览的范围。不如我们去看看展馆里的其他内容？你可以问我关于我的求学经历、科研探索、或者我对年轻人的寄语。';

const PRESET_QUESTIONS = [
  { id: "preset_q001", question: "吴先生，您是如何发现宇称不守恒的？" },
  { id: "preset_q002", question: "做科研最重要的是什么？" },
  { id: "preset_q003", question: "您对中国科学发展有什么期望？" },
  { id: "preset_q004", question: "您对年轻人有什么寄语？" },
  { id: "preset_q005", question: "您在求学过程中遇到过什么困难？" },
  { id: "preset_q006", question: "您和费米、奥本海默等科学家有什么交流？" },
  { id: "preset_q007", question: "您如何看待诺贝尔奖？" },
  { id: "preset_q008", question: "您对中国女性科研工作者有什么建议？" },
];

// ============================================================
// RAG 检索（关键词匹配，无需向量数据库）
// ============================================================

function retrieveChunks(query, topK = 3) {
  // 分词：简单按字和常见词切分
  const queryChars = query.replace(/[，。？！、的了吗是和在有了不也都被与而或但从到把被让给向对关于]/g, '').split('');
  const queryTerms = queryChars.filter(c => c.trim());

  // 计算每个 chunk 的匹配分数
  const scored = KNOWLEDGE_CHUNKS.map(chunk => {
    const text = chunk.text;
    let score = 0;
    for (const term of queryTerms) {
      // 字符匹配
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    }
    // 长度归一化（避免长文本天然得分高）
    const normalizedScore = text.length > 0 ? score / Math.sqrt(text.length) : 0;
    return { ...chunk, score: normalizedScore };
  });

  // 按分数排序，取 topK
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(c => c.score > 0);
}

// ============================================================
// LLM 调用（直连阿里云 DashScope，兼容 OpenAI 格式）
// ============================================================

function callLLM(systemContent, userContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 512,
      extra_body: { enable_thinking: false },
    });

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.choices && result.choices[0]) {
            resolve(result.choices[0].message.content.trim());
          } else {
            reject(new Error((result.error && result.error.message) || 'LLM返回格式异常'));
          }
        } catch (e) {
          reject(new Error('解析LLM响应失败: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('LLM请求超时'));
    });
    req.write(body);
    req.end();
  });
}

// ============================================================
// TTS 语音合成（直连阿里云 DashScope WebSocket）
// ============================================================

function generateTTS(text) {
  return new Promise((resolve, reject) => {
    if (!DASHSCOPE_API_KEY) {
      reject(new Error('未配置DASHSCOPE_API_KEY'));
      return;
    }

    const wsUrl = `wss://dashscope.aliyuncs.com/api-ws/v1/inference?api_key=${DASHSCOPE_API_KEY}`;
    const audioChunks = [];
    const ws = new WebSocket(wsUrl);
    let isCompleted = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        header: { action: 'run-task', task_id: `tts-${Date.now()}` },
        payload: {
          model: TTS_MODEL,
          task_group: 'audio',
          task: 'tts',
          function: 'SpeechSynthesizer',
          input: { text },
          parameters: { voice: TTS_VOICE, format: 'mp3', sample_rate: 24000 },
        },
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.payload && msg.payload.output && msg.payload.output.audio) {
          audioChunks.push(Buffer.from(msg.payload.output.audio, 'base64'));
        }
        if (msg.header && msg.header.event === 'task-finished') {
          isCompleted = true;
          ws.close();
        }
        if (msg.header && msg.header.event === 'error') {
          reject(new Error((msg.payload && msg.payload.message) || 'TTS生成失败'));
          ws.close();
        }
      } catch (e) {
        if (Buffer.isBuffer(data)) audioChunks.push(data);
      }
    });

    ws.on('error', (err) => reject(new Error('WebSocket错误: ' + err.message)));
    ws.on('close', () => {
      if (isCompleted || audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      } else {
        reject(new Error('TTS未收到音频数据'));
      }
    });

    setTimeout(() => {
      if (!isCompleted) {
        ws.terminate();
        audioChunks.length > 0 ? resolve(Buffer.concat(audioChunks)) : reject(new Error('TTS超时'));
      }
    }, 30000);
  });
}

// ============================================================
// 上传音频到云存储
// ============================================================

async function uploadAudio(audioBuffer, id) {
  const cloudPath = `tts/${id}.mp3`;
  const uploadRes = await cloud.uploadFile({ cloudPath, fileContent: audioBuffer });
  const tempRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] });
  if (tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL) {
    return tempRes.fileList[0].tempFileURL;
  }
  throw new Error('获取音频链接失败');
}

// ============================================================
// 清理禁用词
// ============================================================

function cleanText(text) {
  const forbidden = ['作为一个人工智能', '作为AI助手', '作为AI', '根据我的知识库'];
  let result = text;
  for (const w of forbidden) {
    result = result.replace(w, '');
  }
  return result.trim();
}

// ============================================================
// 云函数入口
// ============================================================

exports.main = async (event) => {
  const { action, question } = event;

  try {
    // 获取预设问题
    if (action === 'presets') {
      return { code: 0, message: 'ok', data: { questions: PRESET_QUESTIONS } };
    }

    // 对话（RAG + LLM + TTS）
    if (action === 'chat' && question) {
      if (!DASHSCOPE_API_KEY) {
        return { code: 1001, message: '未配置DASHSCOPE_API_KEY，请在云函数环境变量中设置', data: null };
      }

      // 1. RAG 检索
      const retrieval = retrieveChunks(question, 3);
      const context = retrieval.length > 0
        ? retrieval.map(r => `【${r.nodeBinding}】${r.text}`).join('\n\n')
        : '未检索到相关知识，请基于角色设定回答。';

      // 2. 组装 Prompt
      const systemContent = SYSTEM_PROMPT.replace('{retrieved_context}', context);
      const userContent = USER_PROMPT_TEMPLATE.replace('{user_question}', question);

      // 3. 调用 LLM
      const rawText = await callLLM(systemContent, userContent);
      const text = cleanText(rawText);

      // 4. 生成 TTS 音频
      let audioUrl = '';
      try {
        if (text && text.length > 5) {
          const audioBuffer = await generateTTS(text);
          const taskId = `chat-${Date.now()}`;
          audioUrl = await uploadAudio(audioBuffer, taskId);
        }
      } catch (e) {
        console.error('TTS生成失败（不影响对话）:', e.message);
      }

      // 5. 返回完整结果
      return {
        code: 0,
        message: 'ok',
        data: {
          text,
          retrieval: retrieval.map(r => ({
            rank: r.rank || 0,
            nodeBinding: r.nodeBinding,
            theme: r.theme,
            textPreview: r.text.substring(0, 80),
          })),
          audioUrl: audioUrl || null,
          hasRAG: retrieval.length > 0,
        },
      };
    }

    return { code: 1001, message: '参数缺失，请提供 action 和 question', data: null };
  } catch (e) {
    console.error('askDigitalHuman 错误:', e);
    return { code: 9999, message: '服务端错误: ' + e.message, data: null };
  }
};
