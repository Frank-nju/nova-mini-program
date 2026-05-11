const cloudUtil = require('../../cloudUtil.js');

// 根据页面 section 定义的针对性预设问题
const SECTION_PRESETS = {
  'section-0': {
    welcome: '欢迎来到追光健雄云端数字展馆。我是吴健雄，很高兴能带你走进我的人生旅程。',
    questions: [
      { id: 's0_1', question: '这个展馆有哪些内容？' },
      { id: 's0_2', question: '您是谁？' },
      { id: 's0_3', question: '我想了解您的科学贡献' },
    ]
  },
  'section-1': {
    welcome: '序章讲述了我早年的成长故事。你想了解我的童年还是求学经历？',
    questions: [
      { id: 's1_1', question: '您小时候是什么样的？' },
      { id: 's1_2', question: '为什么选择学物理？' },
      { id: 's1_3', question: '在苏州女子师范的经历是怎样的？' },
    ]
  },
  'section-2': {
    welcome: '这里记录了我的生平履历，从求学到科研的历程。',
    questions: [
      { id: 's2_1', question: '您是怎么去美国的？' },
      { id: 's2_2', question: '在伯克利读书时遇到过什么困难？' },
      { id: 's2_3', question: '您的丈夫袁家骝是怎样的人？' },
    ]
  },
  'section-3': {
    welcome: '治学风骨是我一生的坚持。严谨、求实、创新，这是我对科学的态度。',
    questions: [
      { id: 's3_1', question: '您做实验最注重什么？' },
      { id: 's3_2', question: '怎么看待实验中的失败？' },
      { id: 's3_3', question: '对年轻科研工作者有什么建议？' },
    ]
  },
  'section-4': {
    welcome: '科研丰碑记录了我最重要的科学贡献，特别是宇称不守恒实验。',
    questions: [
      { id: 's4_1', question: '什么是宇称不守恒？' },
      { id: 's4_2', question: '钴-60实验是怎么做的？' },
      { id: 's4_3', question: '为什么这个实验这么重要？' },
    ]
  },
  'section-5': {
    welcome: '尾声讲述了我晚年的故事和对科学传承的思考。',
    questions: [
      { id: 's5_1', question: '您晚年最关注什么？' },
      { id: 's5_2', question: '对中国科学发展有什么期望？' },
      { id: 's5_3', question: '您如何看待自己的一生？' },
    ]
  },
};

Page({
  data: {
    screenHeight: 0,
    currentSection: 'section-0',
    pageImages: {
      '首页': '',
      '序章': '',
      '生平履历': '',
      '治学风骨': '',
      '科研丰碑': '',
      '尾声': '',
    },
    stars: [],
    activeStates: [true, false, false, false, false, false, false, false],
    storyCompleteNotification: null,
    showBadgePanel: false,
    showAIPanel: false,
    showMaterialsPanel: false,
    materialsList: [],
    materialTab: 'works',
    presetQuestions: [],
    welcomeMessage: '',
    aiMessages: [],
    aiInputValue: '',
    aiChatting: false,
    aiScrollId: '',
    aiMsgCounter: 0,
    innerAudioContext: null,
    currentAiMsgId: null,
    newBadges: false,
    badgeNotification: null,
    eventClouds: [],
    badges: [
      { id: 'badge_01', icon: '🌟', name: '序章探索', condition: '阅读完序章的全部6个故事', section: 1, unlocked: false },
      { id: 'badge_02', icon: '📖', name: '履迹寻光', condition: '阅读完生平履历的全部6个故事', section: 2, unlocked: false },
      { id: 'badge_03', icon: '✍️', name: '治学达人', condition: '阅读完治学风骨的全部6个故事', section: 3, unlocked: false },
      { id: 'badge_04', icon: '🔬', name: '科研专家', condition: '阅读完科研丰碑的全部6个故事', section: 4, unlocked: false },
      { id: 'badge_05', icon: '🕊️', name: '追光行者', condition: '阅读完尾声的全部6个故事', section: 5, unlocked: false },
      { id: 'badge_06', icon: '👑', name: '知识王者', condition: '答题挑战5题全对', section: null, unlocked: false },
      { id: 'badge_08', icon: '⚛️', name: '实验探索者', condition: '完成吴健雄的镜像实验室实验', section: null, unlocked: false },
      { id: 'badge_09', icon: '💌', name: '致敬传声', condition: '在致敬墙留下第一次留言', section: null, unlocked: false },
      { id: 'badge_10', icon: '💬', name: '对话健雄', condition: '向数字人提出第一个问题', section: null, unlocked: false },
    ],
    selectedBadge: null,

    // 答题区题库（50题：30道四选一选择题 + 20道判断题）
    quizBank: [
      { type: 'choice', question: '吴健雄出生于哪一年？', options: ['1905年', '1912年', '1918年', '1920年'], answer: 1 },
      { type: 'choice', question: '吴健雄出生于中国的哪个省份？', options: ['江苏省', '浙江省', '广东省', '山东省'], answer: 0 },
      { type: 'choice', question: '吴健雄的大学专业是什么？', options: ['化学', '数学', '物理学', '生物学'], answer: 2 },
      { type: 'choice', question: '吴健雄在哪所大学获得博士学位？', options: ['芝加哥大学', '哥伦比亚大学', '加州大学伯克利分校', '哈佛大学'], answer: 2 },
      { type: 'choice', question: '吴健雄最著名的实验成果是什么？', options: ['发现中子', '验证宇称不守恒', '合成新元素', '发现核裂变'], answer: 1 },
      { type: 'choice', question: '谁提出了宇称不守恒的理论假设？', options: ['费米和劳伦斯', '杨振宁和李政道', '爱因斯坦和玻尔', '泡利和狄拉克'], answer: 1 },
      { type: 'choice', question: '吴健雄使用哪种放射性同位素进行宇称不守恒实验？', options: ['铀-235', '钚-239', '钴-60', '镭-226'], answer: 2 },
      { type: 'choice', question: '吴健雄在哪个城市进行了她最重要的实验？', options: ['北京', '上海', '纽约', '芝加哥'], answer: 2 },
      { type: 'choice', question: '吴健雄的丈夫是什么职业？', options: ['医生', '律师', '物理学家', '工程师'], answer: 2 },
      { type: 'choice', question: '吴健雄在哪所大学任教超过30年？', options: ['哈佛大学', '芝加哥大学', '哥伦比亚大学', '斯坦福大学'], answer: 2 },
      { type: 'choice', question: '吴健雄获得过以下哪个奖项？', options: ['诺贝尔物理学奖', '沃尔夫物理学奖', '菲尔兹奖', '图灵奖'], answer: 1 },
      { type: 'choice', question: '吴健雄的博士生导师是谁？', options: ['恩里科·费米', '欧内斯特·劳伦斯', '理查德·费曼', '尼尔斯·玻尔'], answer: 1 },
      { type: 'choice', question: '宇称不守恒实验在哪种条件下进行？', options: ['超高温度', '超低温接近绝对零度', '超高气压', '真空环境'], answer: 1 },
      { type: 'choice', question: '吴健雄被称为什么称号？', options: ['东方居里夫人', '核物理女王', '居里夫人第二', '量子之母'], answer: 0 },
      { type: 'choice', question: '吴健雄在实验中观测的是哪种衰变？', options: ['α衰变', 'β衰变', 'γ衰变', '中子衰变'], answer: 1 },
      { type: 'choice', question: '吴健雄的父亲从事什么职业？', options: ['农民', '商人和教育家', '军人', '医生'], answer: 1 },
      { type: 'choice', question: '吴健雄在美国的第一所大学是哪所？', options: ['哥伦比亚大学', '芝加哥大学', '加州大学伯克利分校', '麻省理工学院'], answer: 2 },
      { type: 'choice', question: '以下哪个不是吴健雄的研究领域？', options: ['β衰变', 'μ子物理', '弦理论', '核物理'], answer: 2 },
      { type: 'choice', question: '吴健雄去世后骨灰安葬在哪个国家？', options: ['美国', '中国', '英国', '德国'], answer: 1 },
      { type: 'choice', question: '吴健雄在哪一年去世？', options: ['1990年', '1995年', '1997年', '2000年'], answer: 2 },
      { type: 'judge', question: '吴健雄获得了诺贝尔物理学奖。', answer: 0 },
      { type: 'judge', question: '吴健雄的宇称不守恒实验证实了杨振宁和李政道的理论。', answer: 1 },
      { type: 'judge', question: '吴健雄出生于书香门第，父亲是教育家。', answer: 1 },
      { type: 'judge', question: '吴健雄是中国第一位女性物理学教授。', answer: 0 },
      { type: 'judge', question: '吴健雄参与了曼哈顿计划。', answer: 1 },
      { type: 'judge', question: '吴健雄的实验证明宇称在强相互作用中不守恒。', answer: 0 },
      { type: 'judge', question: '吴健雄曾在哥伦比亚大学任教。', answer: 1 },
      { type: 'judge', question: '吴健雄的丈夫名叫袁家骝。', answer: 1 },
      { type: 'judge', question: '吴健雄出生于1920年。', answer: 0 },
      { type: 'judge', question: '吴健雄是美国国家科学院院士。', answer: 1 },
      { type: 'judge', question: '吴健雄的实验使用了钴-60同位素。', answer: 1 },
      { type: 'judge', question: '吴健雄在浙江大学建立了以自己名字命名的奖学金。', answer: 0 },
      { type: 'judge', question: '吴健雄是第一位当选美国国家科学院院士的华人女性。', answer: 1 },
      { type: 'judge', question: '吴健雄在曼哈顿计划中解决了铀浓缩过程的中子吸收问题。', answer: 1 },
      { type: 'judge', question: '吴健雄的母校是南京大学的前身——中央大学。', answer: 1 },
      { type: 'judge', question: '吴健雄出生于上海。', answer: 0 },
      { type: 'judge', question: '吴健雄在实验物理学领域有重要贡献。', answer: 1 },
      { type: 'judge', question: '吴健雄的父亲不支持她学习物理。', answer: 0 },
      { type: 'judge', question: '吴健雄于1936年赴美国留学。', answer: 1 },
      { type: 'judge', question: '吴健雄享年84岁。', answer: 1 },
      { type: 'judge', question: '吴健雄的博士论文关于铀核的中子吸收断面。', answer: 1 },
      { type: 'judge', question: '宇称不守恒的发现改变了物理学对对称性的理解。', answer: 1 },
      { type: 'judge', question: '吴健雄的实验结果证明了电子在β衰变中有方向偏好。', answer: 1 },
      { type: 'judge', question: '吴健雄在物理学界获得了很高的国际认可。', answer: 1 },
      { type: 'judge', question: '吴健雄于1997年在纽约去世。', answer: 1 },
      { type: 'judge', question: '吴健雄的严谨态度使她的实验结果经得起检验。', answer: 1 },
      { type: 'judge', question: '吴健雄曾为了确保实验准确性将一个数据测量47次。', answer: 1 },
      { type: 'judge', question: '吴健雄经常工作到深夜，实验室总是最后一盏灯亮着。', answer: 1 },
      { type: 'judge', question: '吴健雄在90多岁仍坚持科学研究。', answer: 1 },
      { type: 'judge', question: '吴健雄一生留下了100多篇科学论文。', answer: 1 },
    ],

    // 致敬墙 - 名人评价
    tributeQuotes: [
      { quote: '吴健雄的实验技术无与伦比。她的数据，你永远可以相信。', author: '理查德·费曼', role: '诺贝尔物理学奖得主', icon: '🔬' },
      { quote: '大部分物理学家都觉得这个实验不值得做，但是吴健雄有更深入的战略性眼光。', author: '杨振宁', role: '诺贝尔物理学奖得主', icon: '⭐' },
      { quote: '我记得清楚极了，那是圣诞节前夜。我在半夜里接到健雄打来的电话，她说实验结果已经出来了，宇称确实不守恒。', author: '李政道', role: '诺贝尔物理学奖得主', icon: '🌟' },
      { quote: '当一位伟人走到她生命的尽头，我们不要仅仅回忆她的工作成果，更要发扬她的品格力量——她的坚强意志、她的纯洁、她的严于律己、她的客观公正和毫不妥协的判断力。', author: '爱因斯坦', role: '评价居里夫人之语，李政道借以悼念吴健雄', icon: '💎' },
      { quote: '她的意志力和对工作的献身，使人联想到居里夫人，但她更加入世、优雅和智慧。', author: '科学界评价', role: '广泛认可', icon: '🏆' },
    ],

    // 传承纪念时间线
    legacyTimeline: [
      { year: '1997', title: '小行星2752吴', desc: '国际天文学联合会将编号2752的小行星正式命名为"吴健雄星"，永恒闪耀于宇宙之中。' },
      { year: '2001', title: '美国物理学会奖项', desc: '美国物理学会设立"吴健雄杰出女物理学家奖"，表彰在物理领域做出杰出贡献的女性科学家。' },
      { year: '2011', title: '美国纪念邮票', desc: '美国邮政总署发行吴健雄纪念邮票，她是少数获此殊荣的华裔科学家之一。' },
      { year: '2013', title: '吴健雄纪念馆', desc: '南京大学吴健雄纪念馆正式开馆，展示她一生的科学成就与精神风貌。' },
      { year: '2014', title: '故乡陵园', desc: '江苏太仓吴健雄墓园成为爱国主义教育基地，墓碑刻有她亲手选定的铭文："一个永远的中国人"。' },
      { year: '至今', title: '薪火相传', desc: '东南大学、南京大学等多所高校设有"吴健雄学院"与"吴健雄奖学金"，持续培养新一代科学人才。' },
    ],

    // 用户致敬留言
    userTributes: [],
    tributeLoading: false,
    tributeHasMore: true,
    tributePage: 1,
    tributeInputValue: '',
    tributeSubmitting: false,
    tributeInputFocused: false,

    // 答题区状态
    showQuizPanel: false,
    quizQuestions: [],
    quizCurrentIndex: 0,
    quizScore: 0,
    quizCompleted: false,
    quizScrollId: '',

    // 错题回顾
    quizWrongAnswers: [],
    showWrongReview: false,

    particleExplosions: [],
    animationFrameId: null,

    // 阅读成果
    worksList: [],
    worksLoading: false,
    worksHasMore: true,
    worksPage: 1,
    worksTab: 'all',
    worksSort: 'default', // 排序方式: default | rating | score

    // 漫画分组数据
    mangaGroups: [],

    // 评分弹窗
    showRatingModal: false,
    ratingItem: {},
    modalUserStars: ['empty', 'empty', 'empty', 'empty', 'empty'],
    modalUserScore: 0,
    modalHasRated: false,

    // 致敬墙面板
    showTributePanel: false,
    tributePreviewList: [],

    // 镜像实验室
    showLabPanel: false,
    labStep: 0,          // 0=介绍, 1=认识, 2=冷却, 3=磁场, 4=观察, 5=镜像, 6=揭示, 7=完成
    labTemperature: 300, // 当前温度(K)
    labFieldStrength: 0, // 磁场强度(%)
    labDragging: false,  // 是否在拖动滑块
    labCanvasReady: false,
    labCompleted: false,
    labParticles: [],
    labCanvasWidth: 0,
    labCanvasHeight: 0,
    labCanvasNode: null,
    labCtx: null,
    labAnimFrameId: null,
    _labBadgeGranted: false,
    labCanAdvance: false, // 当前步骤是否可进入下一步
    _tributeBadgeGranted: false,
    _digitalHumanBadgeGranted: false,
  },

  onLoad() {
    this.setData({ screenHeight: 812 });
    wx.getWindowInfo({
      success: (res) => {
        this.setData({ screenHeight: res.windowHeight || 812 });
      },
    });
    this.generateStars();
    this.initializeEventClouds();
    // 云调用在渲染后异步执行，不阻塞页面
    this.loadPageImages();
    setTimeout(() => this.loadProgress(), 300);
    setTimeout(() => this.loadTributes(true), 600);
    // 初始化预设问题
    this.updateSectionPresets('section-0');
  },

  onShow() {
    setTimeout(() => this.loadProgress(), 300);
    setTimeout(() => this.loadTributes(true), 600);
  },

  initializeEventClouds() {
    const clouds = [];
    const colors = ['#64c8ff', '#c9a96e', '#ff69b4', '#ffd700', '#00ff00', '#20b2aa'];
    const sectionNames = ['序章', '生平', '治学', '科研', '尾声', '永恒'];
    let cloudId = 1;

    for (let section = 1; section <= 5; section++) {
      for (let storyIndex = 0; storyIndex < 6; storyIndex++) {
        const row = Math.floor((cloudId - 1) / 6);
        const col = (cloudId - 1) % 6;
        const x = 0.15 + (col * 0.13) + (Math.random() - 0.5) * 0.08;
        const y = 0.2 + (row * 0.15) + (Math.random() - 0.5) * 0.06;

        clouds.push({
          id: cloudId,
          name: `${sectionNames[section - 1]} · 故事${storyIndex + 1}`,
          color: colors[section - 1],
          x: Math.max(0.1, Math.min(0.9, x)),
          y: Math.max(0.1, Math.min(0.9, y)),
          unlocked: false,
          section: section,
          storyIndex: storyIndex,
          particles: [],
        });
        cloudId++;
      }
    }

    this.setData({ eventClouds: clouds });
  },

  // 保存进度到本地缓存（与已有缓存合并，只增不删）
  saveProgressCache(clouds, badges) {
    try {
      const cloudList = clouds || this.data.eventClouds;
      const badgeList = badges || this.data.badges;

      const unlockedClouds = cloudList
        .filter(c => c.unlocked)
        .map(c => 'n' + c.id);

      const unlockedBadges = badgeList
        .filter(b => b.unlocked)
        .map(b => b.id);

      // 与已有缓存合并，避免覆盖 story.js 单独写入的进度
      const existing = wx.getStorageSync('exhibitProgress') || {};
      const existingTl = existing.timelineNodes || [];
      const existingBadges = existing.badges || [];

      for (var i = 0; i < unlockedClouds.length; i++) {
        if (existingTl.indexOf(unlockedClouds[i]) < 0) {
          existingTl.push(unlockedClouds[i]);
        }
      }
      for (var j = 0; j < unlockedBadges.length; j++) {
        if (existingBadges.indexOf(unlockedBadges[j]) < 0) {
          existingBadges.push(unlockedBadges[j]);
        }
      }

      const data = {
        timelineNodes: existingTl,
        badges: existingBadges,
      };
      console.log('[exhibit] 保存缓存:', JSON.stringify(data));
      wx.setStorageSync('exhibitProgress', data);
    } catch (e) {
      console.error('保存缓存失败:', e);
    }
  },

  // 从云端加载页面背景图临时链接
  loadPageImages() {
    cloudUtil.getPageImages().then(res => {
      if (res.code !== 0 || !res.data || !res.data.images) return;
      const pageImages = {};
      res.data.images.forEach(img => {
        if (img.url) {
          pageImages[img.name] = img.url;
        }
      });
      this.setData({ pageImages });
    }).catch(err => {
      console.warn('loadPageImages 失败，使用本地图片:', err.message);
    });
  },

  // 从云端加载进度（替代本地存储）
  loadProgress() {
    // 先从本地缓存读取（立即可用）
    try {
      const cache = wx.getStorageSync('exhibitProgress') || {};
      const timelineNodes = cache.timelineNodes || [];
      const badgeIds = cache.badges || [];

      const eventClouds = this.data.eventClouds.map(cloud => {
        const nodeId = 'n' + cloud.id;
        const unlocked = timelineNodes.includes(nodeId);
        return { ...cloud, unlocked };
      });

      const badges = this.data.badges.map(badge => ({
        ...badge,
        unlocked: badgeIds.includes(badge.id),
      }));

      this.setData({ eventClouds, badges });
    } catch (e) {
      console.warn('读取缓存失败:', e);
    }

    // 再异步从云端同步（只有云端有数据时才覆盖，否则保留本地缓存）
    cloudUtil.getUser().then(res => {
      if (res.code !== 0) return;
      const data = res.data || {};
      const progress = data.progress || {};
      const badgeIds = data.badges || [];

      // 云端数据为空时不覆盖本地缓存（云函数可能还没处理完 grantBadge）
      if (badgeIds.length === 0 && (!progress.timelineNodes || progress.timelineNodes.length === 0)) return;

      const eventClouds = this.data.eventClouds.map(cloud => {
        const nodeId = 'n' + cloud.id;
        const unlocked = progress.timelineNodes && progress.timelineNodes.includes(nodeId);
        return { ...cloud, unlocked };
      });

      const badges = this.data.badges.map(badge => ({
        ...badge,
        unlocked: badgeIds.includes(badge.id),
      }));

      this.setData({ eventClouds, badges });
    }).catch(err => {
      console.warn('loadProgress 失败，保留本地缓存:', err.message);
    });
  },

  generateStars() {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push(Math.random() * 100);
    }
    this.setData({ stars });
  },

  onScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const screenHeight = this.data.screenHeight || 812;
    const sectionHeight = screenHeight;
    // 计算当前主要可见的 section 索引（0-based）
    const index = Math.floor(scrollTop / sectionHeight);

    // 节流：300ms 内不重复计算
    if (this._scrollTimer) return;
    this._scrollTimer = setTimeout(() => { this._scrollTimer = null; }, 300);

    // 活跃规则：当前屏 + 上一屏 + 下一屏保持激活
    // 已经激活的 section 不会因为轻微回弹而失活
    const prevIndex = Math.max(0, index - 1);
    const nextIndex = Math.min(7, index + 1);

    let newStates = this.data.activeStates.slice();
    let hasChanged = false;

    for (let i = 0; i < 8; i++) {
      const shouldBeActive = (i >= prevIndex && i <= nextIndex);
      if (newStates[i] !== shouldBeActive) {
        newStates[i] = shouldBeActive;
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.setData({ activeStates: newStates });
      // 更新当前 section 和预设问题
      const sectionId = `section-${Math.min(index, 5)}`;
      if (this.data.currentSection !== sectionId) {
        this.updateSectionPresets(sectionId);
      }
    }
    this.data.scrollY = scrollTop;
  },

  // 根据当前 section 更新预设问题
  updateSectionPresets(sectionId) {
    const presets = SECTION_PRESETS[sectionId] || SECTION_PRESETS['section-0'];
    this.setData({
      currentSection: sectionId,
      presetQuestions: presets.questions,
      welcomeMessage: presets.welcome,
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  enterStory(e) {
    const section = e.currentTarget.dataset.section;
    const story = e.currentTarget.dataset.story || 0;

    wx.showLoading({ title: '故事加载中...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/subpkg/pages/story/story?section=${section}&story=${story}`,
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'error', duration: 2000 });
        }
      });
    }, 800);
  },

  // 从故事页返回时，解锁对应节点（story.js 已上报进度，这里只刷新云端数据）
  unlockEventCloudByStory(section, storyIndex) {
    const cloudIndex = this.data.eventClouds.findIndex(
      c => c.section === section && c.storyIndex === storyIndex
    );
    if (cloudIndex === -1) return;

    const cloud = this.data.eventClouds[cloudIndex];
    if (!cloud.unlocked) {
      // 显示故事完成通知
      const sectionNames = ['序章', '生平履历', '治学风骨', '科研丰碑', '尾声'];
      const sectionName = sectionNames[section - 1] || '';
      this.setData({
        storyCompleteNotification: {
          title: sectionName + ' · 故事' + (storyIndex + 1),
          text: '已读完成',
        },
      });
      setTimeout(() => {
        this.setData({ storyCompleteNotification: null });
      }, 2000);

      // 乐观更新UI
      const eventClouds = [...this.data.eventClouds];
      eventClouds[cloudIndex] = { ...cloud, unlocked: true };
      this.setData({ eventClouds });
      this.createParticleExplosion(cloud);

      // 立即保存缓存
      this.saveProgressCache(eventClouds, this.data.badges);
    }

    // 乐观更新已完成，缓存已保存，无需额外云同步（后端云函数开发中）
  },

  // 检查某章节是否全部解锁，是则发放徽章（仅由最后一个故事的"完成"按钮调用）
  checkAndGrantBadge(section) {
    const eventClouds = this.data.eventClouds;
    const sectionCloudCount = eventClouds.filter(c => c.section === section).length;
    const unlockedCount = eventClouds.filter(
      c => c.section === section && c.unlocked
    ).length;

    if (unlockedCount === sectionCloudCount) {
      const badge = this.data.badges.find(b => b.section === section);
      if (badge && !badge.unlocked) {
        this.unlockBadge(section);
        wx.showToast({ title: this.getBadgeName(section) + ' 已获得！', icon: 'success', duration: 2000 });
      }
    }
  },

  getBadgeName(section) {
    const badge = this.data.badges.find(b => b.section === section);
    return badge ? badge.name : '';
  },

  unlockEventCloud(cloudId) {
    const eventClouds = this.data.eventClouds.map(item => {
      if (item.id === cloudId && !item.unlocked) {
        this.createParticleExplosion(item);
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({ eventClouds });

    if (!this.data.animationFrameId && this.data.showCloudPanel) {
      this.startAnimationLoop();
    }
  },

  createParticleExplosion(cloud) {
    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: cloud.color,
      });
    }

    const explosions = [...this.data.particleExplosions, {
      cloudId: cloud.id,
      particles: particles,
      age: 0,
      duration: 1500,
    }];

    this.setData({ particleExplosions: explosions });
  },

  startAnimationLoop() {
    const animate = () => {
      const explosions = this.data.particleExplosions.map(exp => {
        exp.age += 16;
        exp.particles = exp.particles.map(p => {
          return {
            ...p,
            x: p.x + p.vx * 0.1,
            y: p.y + p.vy * 0.1,
            vy: p.vy + 0.05,
            life: 1 - (exp.age / exp.duration),
          };
        }).filter(p => p.life > 0);
        return exp;
      }).filter(exp => exp.age < exp.duration);

      this.setData({ particleExplosions: explosions });

      if (explosions.length > 0) {
        this.data.animationFrameId = setTimeout(animate, 16);
      } else {
        this.data.animationFrameId = null;
      }
    };

    this.data.animationFrameId = setTimeout(animate, 16);
  },

  // 发放徽章（调用 grantBadge 云函数）
  unlockBadge(sectionId) {
    const badge = this.data.badges.find(b => b.section === sectionId);
    if (!badge || badge.unlocked) return;

    // 乐观更新UI
    const badges = this.data.badges.map(item => {
      if (item.section === sectionId && !item.unlocked) {
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({
      badges,
      newBadges: true,
      badgeNotification: badge,
    });

    this.saveProgressCache(this.data.eventClouds, badges);

    if (this._badgeNotificationTimer) {
      clearTimeout(this._badgeNotificationTimer);
    }
    this._badgeNotificationTimer = setTimeout(() => {
      this.setData({ badgeNotification: null });
    }, 3000);

    // 上报到云端
    cloudUtil.grantBadge({ badgeId: badge.id }).then(res => {
      if (res.code === 0) {
        console.log('徽章发放成功:', res.data);
      } else if (res.code === 1004) {
        console.log('徽章已存在（幂等）');
      }
    }).catch(err => {
      console.error('徽章发放失败:', err);
    });
  },

  unlockBadgeByBadge(badge) {
    const badges = this.data.badges.map(item => {
      if (item.id === badge.id && !item.unlocked) {
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({
      badges,
      newBadges: true,
      badgeNotification: badge,
    });

    this.saveProgressCache(this.data.eventClouds, badges);

    if (this._badgeNotificationTimer) {
      clearTimeout(this._badgeNotificationTimer);
    }
    this._badgeNotificationTimer = setTimeout(() => {
      this.setData({ badgeNotification: null });
    }, 3000);

    cloudUtil.grantBadge({ badgeId: badge.id }).then(res => {
      if (res.code === 0) {
        console.log('徽章发放成功:', res.data);
      }
    }).catch(err => {
      console.error('徽章发放失败:', err);
    });
  },

  // 通过 badgeId 和标记字段发放徽章（用于致敬、数字人、评分等新徽章）
  _unlockBadgeById(badgeId, flagKey) {
    if (this.data[flagKey]) return;
    const badge = this.data.badges.find(b => b.id === badgeId);
    if (!badge || badge.unlocked) {
      this.setData({ [flagKey]: true });
      return;
    }
    this.setData({ [flagKey]: true });
    const badges = this.data.badges.map(item => {
      if (item.id === badgeId) return { ...item, unlocked: true };
      return item;
    });
    this.setData({ badges, newBadges: true, badgeNotification: badge });
    this.saveProgressCache(this.data.eventClouds, badges);

    if (this._badgeNotificationTimer) {
      clearTimeout(this._badgeNotificationTimer);
    }
    this._badgeNotificationTimer = setTimeout(() => {
      this.setData({ badgeNotification: null });
    }, 3000);

    cloudUtil.grantBadge({ badgeId }).catch(() => {});
  },

  toggleClouds() {
    wx.navigateTo({
      url: '/subpkg/pages/cloud/cloud',
      fail: (err) => {
        console.error('导航到云图失败:', err);
        wx.showToast({ title: '页面加载失败', icon: 'error' });
      },
    });
  },

  toggleBadge() {
    this.setData({
      showBadgePanel: !this.data.showBadgePanel,
      showAIPanel: false,
      showQuizPanel: false,
      newBadges: false,
    });
  },

  toggleAI() {
    const willShow = !this.data.showAIPanel;
    this.setData({
      showAIPanel: willShow,
      showBadgePanel: false,
      showQuizPanel: false,
    });
    if (willShow && this.data.aiMessages.length === 0) {
      // 首次打开，初始化欢迎语
    }
  },

  // 数字人聊天
  onAiInput(e) {
    this.setData({ aiInputValue: e.detail.value });
  },

  sendAiMessage() {
    const question = this.data.aiInputValue.trim();
    if (!question || this.data.aiChatting) return;

    const msgId = ++this.data.aiMsgCounter;
    const messages = [...this.data.aiMessages, { id: msgId, role: 'user', text: question }];

    this.setData({
      aiMessages: messages,
      aiInputValue: '',
      aiChatting: true,
      aiScrollId: `ai-msg-${msgId}`,
    });

    // 首次提问发放徽章
    this._unlockBadgeById('badge_10', '_digitalHumanBadgeGranted');

    // 添加 loading 消息
    const loadingId = ++this.data.aiMsgCounter;
    this.setData({
      aiMessages: [...this.data.aiMessages, { id: loadingId, role: 'ai', loading: true, audioUrl: null, audioPlaying: false }],
      aiScrollId: `ai-msg-${loadingId}`,
    });

    // 触发数字人组件（它会处理 LLM + TTS + 播放）
    const dhComponent = this.selectComponent('#digitalHumanExhibit');
    if (dhComponent) {
      dhComponent.ask(question);
      return; // 不再调用页面的 LLM
    }

    // 如果没有组件，才走页面的流程
    cloudUtil.chatWithDigitalHuman({ question })
      .then(res => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? {
            ...m,
            loading: false,
            text: res.data.text,
            audioUrl: null,
            audioPlaying: false,
          } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
        // 文字显示后，异步请求TTS
        if (res.data.text && res.data.text.length > 5) {
          this.requestTTS(res.data.text, loadingId);
        }
      })
      .catch(() => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: '抱歉，我现在说不上来。不如去展馆里找找答案？' } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
      });
  },

  // 发送预设问题（支持预存语音或实时生成）
  async sendPreset(e) {
    const presetId = e.currentTarget.dataset.id;
    const question = e.currentTarget.dataset.question;
    if (!question || this.data.aiChatting) return;

    const msgId = ++this.data.aiMsgCounter;

    this.setData({
      aiMessages: [...this.data.aiMessages, { id: msgId, role: 'user', text: question }],
      aiChatting: true,
      aiScrollId: `ai-msg-${msgId}`,
    });

    // 首次提问发放徽章
    this._unlockBadgeById('badge_10', '_digitalHumanBadgeGranted');

    const loadingId = ++this.data.aiMsgCounter;
    this.setData({
      aiMessages: [...this.data.aiMessages, { id: loadingId, role: 'ai', loading: true, audioUrl: null, audioPlaying: false }],
      aiScrollId: `ai-msg-${loadingId}`,
    });

    // 先尝试获取预存回答
    try {
      const res = await wx.cloud.callFunction({
        name: 'presetManager',
        data: { action: 'get', presetId }
      });

      if (res.result.code === 0 && res.result.data && res.result.data.text) {
        // 有预存，直接显示
        const aiMsgId = ++this.data.aiMsgCounter;
        this.setData({
          aiMessages: [...this.data.aiMessages, {
            id: aiMsgId,
            role: 'ai',
            text: res.result.data.text,
            audioUrl: res.result.data.audioUrl || null,
            audioPlaying: false
          }],
          aiChatting: false,
          aiScrollId: `ai-msg-${aiMsgId}`,
        });

        // 如果有预存语音，播放并驱动嘴型
        if (res.result.data.audioUrl) {
          this.playAudioUrl(res.result.data.audioUrl, aiMsgId);
        }
        return;
      }
    } catch (e) {
      console.log('预存未找到，走API:', e.message);
    }

    // 没有预存，走正常流程
    // 触发数字人组件
    const dhComponent = this.selectComponent('#digitalHumanExhibit');
    if (dhComponent) {
      dhComponent.ask(question);
      return;
    }

    // 没有组件，走页面的流程
    cloudUtil.chatWithDigitalHuman({ question })
      .then(res => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? {
            ...m,
            loading: false,
            text: res.data.text,
            audioUrl: null,
            audioPlaying: false,
          } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
        if (res.data.text && res.data.text.length > 5) {
          this.requestTTS(res.data.text, loadingId);
        }
      })
      .catch(() => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: '抱歉，我现在说不上来。不如去展馆里找找答案？' } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
      });
  },

  toggleMaterials() {
    const willShow = !this.data.showMaterialsPanel;
    this.setData({
      showMaterialsPanel: willShow,
      showAIPanel: false,
      showBadgePanel: false,
      showQuizPanel: false,
    });
    if (willShow && this.data.worksList.length === 0) {
      this.loadWorks();
    }
  },

  toggleMore() {
    this.toggleQuiz();
  },

  // 答题区
  toggleQuiz() {
    const willShow = !this.data.showQuizPanel;
    this.setData({
      showQuizPanel: willShow,
      showBadgePanel: false,
      showAIPanel: false,
      quizCompleted: false,
    });
    if (willShow) {
      this.initQuiz();
    }
  },

  initQuiz() {
    // 随机抽取5道题
    const shuffled = [...this.data.quizBank].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, 5).map((q, i) => ({
      ...q,
      index: i,
      selected: null,
      correct: null,
    }));

    this.setData({
      quizQuestions: questions,
      quizCurrentIndex: 0,
      quizScore: 0,
      quizCompleted: false,
      quizScrollId: 'quiz-q-0',
      quizWrongAnswers: [],
      showWrongReview: false,
    });
  },

  selectQuizAnswer(e) {
    const { qIndex, optionIndex } = e.currentTarget.dataset;
    const qIdx = Number(qIndex);
    const optIdx = Number(optionIndex);
    const questions = [...this.data.quizQuestions];
    const q = questions[qIdx];

    if (q.selected !== null) return;

    const isCorrect = optIdx === q.answer;
    q.selected = optIdx;
    q.correct = isCorrect;
    questions[qIdx] = q;

    let score = this.data.quizScore + (isCorrect ? 1 : 0);
    let completed = false;

    // 收集错题
    let wrongAnswers = [...this.data.quizWrongAnswers];
    if (!isCorrect) {
      wrongAnswers.push({
        question: q.question,
        options: q.options,
        selected: optIdx,
        answer: q.answer,
        type: q.type,
      });
    }

    if (qIdx === this.data.quizQuestions.length - 1) {
      completed = true;
      if (score === 5) {
        this.unlockQuizBadge();
      }
      // 有错题时自动显示回顾
      if (wrongAnswers.length > 0) {
        this.setData({ showWrongReview: true });
      }
    }

    this.setData({
      quizQuestions: questions,
      quizScore: score,
      quizCompleted: completed,
      quizWrongAnswers: wrongAnswers,
    });

    if (qIdx < this.data.quizQuestions.length - 1) {
      setTimeout(() => {
        this.setData({
          quizScrollId: 'quiz-q-' + (qIdx + 1),
          quizCurrentIndex: qIdx + 1,
        });
      }, 800);
    }
  },

  unlockQuizBadge() {
    const badge = this.data.badges.find(b => b.id === 'badge_06');
    if (!badge || badge.unlocked) return;

    const badges = this.data.badges.map(item => {
      if (item.id === 'badge_06') return { ...item, unlocked: true };
      return item;
    });

    this.setData({
      badges,
      newBadges: true,
      badgeNotification: badge,
    });

    this.saveProgressCache(this.data.eventClouds, badges);

    cloudUtil.grantBadge({ badgeId: 'badge_06' }).catch(() => {});
  },

  // 只重答错题
  retryWrongAnswers() {
    const wrongQuestions = this.data.quizWrongAnswers.map((q, i) => ({
      ...q,
      index: i,
      selected: null,
      correct: null,
    }));

    if (wrongQuestions.length === 0) {
      wx.showToast({ title: '没有错题需要重答', icon: 'none' });
      return;
    }

    this.setData({
      quizQuestions: wrongQuestions,
      quizCurrentIndex: 0,
      quizScore: 0,
      quizCompleted: false,
      quizScrollId: 'quiz-q-0',
      showWrongReview: false,
    });
  },

  toggleWrongReview() {
    this.setData({ showWrongReview: !this.data.showWrongReview });
  },

  onBadgeTap(e) {
    const index = e.currentTarget.dataset.index;
    const badge = this.data.badges[index];
    wx.showModal({
      title: badge.name,
      content: badge.condition,
      showCancel: false,
      confirmText: '知道了',
    });
  },

  // 只重置徽章（不影响云图/故事进度）
  resetBadges() {
    const self = this;
    wx.showModal({
      title: '重置徽章',
      content: '将清除所有徽章进度，故事和云图进度不受影响。确定继续？',
      success: function (modalRes) {
        if (!modalRes.confirm) return;

        // 只清除本地缓存中的徽章数据，不调用 resetProgress（避免误删 timelineNodes）
        try {
          const existing = wx.getStorageSync('exhibitProgress') || {};
          existing.badges = [];
          wx.setStorageSync('exhibitProgress', existing);
        } catch (e) {
          console.warn('清除本地徽章缓存失败:', e);
        }

        // 重置本地 UI 徽章状态
        const badges = self.data.badges.map(b => ({ ...b, unlocked: false }));
        self.setData({
          badges,
          badgeNotification: null,
        });

        wx.showToast({ title: '徽章已重置', icon: 'success', duration: 1500 });
      },
    });
  },

  // ===== 阅读成果 =====

  loadWorks(isRefresh) {
    if (this.data.worksLoading || (!this.data.worksHasMore && !isRefresh)) return;

    const page = isRefresh ? 1 : this.data.worksPage;
    const category = this.data.worksTab === 'all' ? '' : this.data.worksTab;

    this.setData({ worksLoading: true });

    cloudUtil.getWorks({ page, pageSize: 20, category }).then(res => {
      if (!res || res.code !== 0) {
        this.setData({ worksLoading: false });
        return;
      }

      let list = res.data.list || [];

      // "其他" tab 严格过滤：只有 category 为 "其他" 的才能显示
      if (this.data.worksTab === '其他') {
        list = list.filter(item => item.category === '其他');
      }

      // 全部 tab 下图片排前面，视频/文档排后面，"其他"和"漫画"不展示在全部中
      if (this.data.worksTab === 'all') {
        list = list.filter(item => item.category !== '其他' && item.category !== '漫画');
        list.sort((a, b) => {
          const order = { '图片': 0, '视频': 1, '文档': 2 };
          return (order[a.category] || 9) - (order[b.category] || 9);
        });
      }

      // 解析 title，拆分为 displayName 和 displayAuthor
      list = list.map(item => {
        const parsed = this.parseWorkTitle(item.title);
        return { ...item, displayName: parsed.title, displayAuthor: parsed.author };
      });

      // 漫画类别需要分组
      if (this.data.worksTab === '漫画') {
        const mangaGroups = this.groupMangaByTitle(list);
        this.setData({ mangaGroups });

        // 给每个漫画分组设置评分默认值
        const mangaGroupsInit = mangaGroups.map(g => ({ ...g, avgScore: 0, ratingCount: 0, avgStars: [], displayScore: '0.0', hasRated: false }));
        this.setData({ mangaGroups: mangaGroupsInit });

        // 加载漫画评分数据
        const mangaWorkIds = list.map(item => item.workId).filter(Boolean);
        if (mangaWorkIds.length > 0) {
          this.preloadMangaRatings(mangaWorkIds);
        }
      }

      // 预加载有 fileId 的项目（"其他"类别不需要预加载，fileId 就是直链；漫画和视频需要预加载封面URL）
      const needUrlItems = list.filter(item => item.fileId && !item.fileUrl && item.category !== '其他');
      if (needUrlItems.length > 0) {
        this.preloadWorkUrls(needUrlItems, list);
      }

      // 视频封面：预加载 coverFileId 为临时 URL
      const videoWithCover = list.filter(item => item.category === '视频' && item.coverFileId && !item.coverUrl);
      if (videoWithCover.length > 0) {
        this.preloadVideoCovers(videoWithCover, list);
      }

      // 加载评分数据
      const workIds = list.map(item => item.workId).filter(Boolean);
      if (workIds.length > 0) {
        this.preloadWorkRatings(workIds, list);
      }

      // 给每个作品设置评分默认值
      list = list.map(item => ({ ...item, avgScore: 0, ratingCount: 0, avgStars: [], displayScore: '0.0', hasRated: false }));

      const finalList = isRefresh ? list : [...this.data.worksList, ...list];
      this.setData({
        worksList: this._applySortToList(finalList),
        worksPage: page + 1,
        worksHasMore: res.data.hasMore,
        worksLoading: false,
      });
    }).catch(err => {
      wx.showToast({ title: '加载失败', icon: 'error' });
      this.setData({ worksLoading: false });
    });
  },

  // 预加载文件临时链接（批量）
  preloadWorkUrls(needUrlItems, fullList) {
    const batchSize = 5;
    for (let i = 0; i < needUrlItems.length; i += batchSize) {
      const batch = needUrlItems.slice(i, i + batchSize);
      Promise.all(batch.map(item =>
        cloudUtil.getWorkDetail({ workId: item.workId })
          .then(res => {
            if (res.code === 0 && res.data.fileUrl) {
              return { workId: item.workId, fileUrl: res.data.fileUrl };
            }
            return null;
          })
          .catch(() => null)
      )).then(results => {
        // 更新 worksList
        const updated = this.data.worksList.map(w => {
          const found = results.find(r => r && r.workId === w.workId);
          if (found) return { ...w, fileUrl: found.fileUrl };
          return w;
        });
        this.setData({ worksList: this._applySortToList(updated) });

        // 同时更新 mangaGroups（如果在漫画 tab）
        if (this.data.worksTab === '漫画' && this.data.mangaGroups.length > 0) {
          const updatedGroups = this.data.mangaGroups.map(g => {
            const updatedPages = g.pages.map(p => {
              const found = results.find(r => r && r.workId === p.workId);
              if (found) return { ...p, fileUrl: found.fileUrl };
              return p;
            });
            return { ...g, pages: updatedPages };
          });
          this.setData({ mangaGroups: updatedGroups });
        }
      });
    }
  },

  // 预加载视频封面临时链接
  preloadVideoCovers(videoItems, fullList) {
    const batchSize = 5;
    for (let i = 0; i < videoItems.length; i += batchSize) {
      const batch = videoItems.slice(i, i + batchSize);
      Promise.all(batch.map(item =>
        cloudUtil.getFilePreviewUrl({ fileID: item.coverFileId })
          .then(res => {
            if (res.code === 0 && res.data && res.data.fileUrl) {
              return { workId: item.workId, coverUrl: res.data.fileUrl };
            }
            return null;
          })
          .catch(() => null)
      )).then(results => {
        const updated = this.data.worksList.map(w => {
          const found = results.find(r => r && r.workId === w.workId);
          if (found) return { ...w, coverUrl: found.coverUrl };
          return w;
        });
        this.setData({ worksList: this._applySortToList(updated) });
      });
    }
  },

  // 预加载作品评分数据
  preloadWorkRatings(workIds, list) {
    cloudUtil.getWorkRatings({ workIds }).then(res => {
      if (res.code !== 0 || !Array.isArray(res.data)) return;
      const ratingMap = {};
      res.data.forEach(r => { ratingMap[r.workId] = r; });
      const updated = this.data.worksList.map(w => {
        const rating = ratingMap[w.workId];
        if (rating && rating.ratingCount > 0) {
          return {
            ...w,
            avgScore: rating.avgScore,
            ratingCount: rating.ratingCount,
            avgStars: this.calcStars(rating.avgScore),
            displayScore: rating.avgScore.toFixed(1),
            hasRated: rating.userScore > 0,
          };
        }
        return w;
      });
      this.setData({ worksList: this._applySortToList(updated) });
    });
  },

  // 预加载漫画作品评分数据（聚合所有页面的评分）
  preloadMangaRatings(workIds) {
    cloudUtil.getWorkRatings({ workIds }).then(res => {
      if (res.code !== 0 || !Array.isArray(res.data)) return;
      // 更新漫画分组的评分
      const updated = this.data.mangaGroups.map(g => {
        // 找到该分组所有页面对应的评分记录
        let totalSum = 0;
        let totalCount = 0;
        g.pages.forEach(page => {
          const found = res.data.find(r => r.workId === page.workId);
          if (found && found.ratingCount > 0) {
            totalSum += found.avgScore * found.ratingCount;
            totalCount += found.ratingCount;
          }
        });
        if (totalCount > 0) {
          const avgScore = Math.round(totalSum / totalCount * 10) / 10;
          return {
            ...g,
            avgScore,
            ratingCount: totalCount,
            avgStars: this.calcStars(avgScore),
            displayScore: avgScore.toFixed(1),
          };
        }
        return g;
      });
      this.setData({ mangaGroups: updated });
    });
  },

  calcStars(avgScore) {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const val = avgScore - i;
      if (val >= 0.75) stars.push('full');
      else if (val >= 0.25) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  },

  loadMoreWorks() {
    if (!this.data.worksLoading && this.data.worksHasMore) {
      this.loadWorks();
    }
  },

  switchWorksTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ worksTab: tab, worksList: [], worksPage: 1, worksHasMore: true, mangaGroups: [], worksSort: 'default' });
    this.loadWorks(true);
  },

  // 切换排序
  switchWorksSort(e) {
    const sort = e.currentTarget.dataset.sort;
    if (!sort || sort === this.data.worksSort) return;
    this.setData({ worksSort: sort });
    // 对当前已加载的列表重新排序
    this._applySort();
  },

  _applySort() {
    const sort = this.data.worksSort;
    if (sort === 'default') {
      // 恢复默认：全部 tab 下图片排前面
      this.loadWorks(true);
      return;
    }

    const sortFn = sort === 'score'
      ? (a, b) => (b.avgScore || 0) - (a.avgScore || 0)
      : (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);

    const updated = this.data.worksList.slice().sort(sortFn);
    this.setData({ worksList: updated });
  },

  // 加载数据时自动应用当前排序
  _applySortToList(list) {
    const sort = this.data.worksSort;
    if (sort === 'default') return list;
    const sortFn = sort === 'score'
      ? (a, b) => (b.avgScore || 0) - (a.avgScore || 0)
      : (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);
    return list.slice().sort(sortFn);
  },

  // 解析作品标题 "作品名-by: 作者" 或 "作品名_XX-by: 作者"
  // 支持全角/半角冒号："作品名-by: 作者" 或 "作品名-by：作者"
  // 返回 { title, author }，如果没有 "-by" 则 author 为空
  parseWorkTitle(fullTitle) {
    if (!fullTitle) return { title: '', author: '' };
    // 匹配 "-by:" 或 "-by："（全角或半角冒号）
    const byIndex = fullTitle.indexOf('-by:');
    const byIndex2 = fullTitle.indexOf('-by：');
    let splitIndex = -1;
    if (byIndex !== -1 && byIndex2 !== -1) {
      splitIndex = Math.min(byIndex, byIndex2);
    } else if (byIndex !== -1) {
      splitIndex = byIndex;
    } else if (byIndex2 !== -1) {
      splitIndex = byIndex2;
    }
    if (splitIndex === -1) {
      return { title: fullTitle, author: '' };
    }
    let title = fullTitle.substring(0, splitIndex).trim();
    const author = fullTitle.substring(splitIndex + 4).trim();
    // 去掉标题末尾的章节编号如 "_01", "_02"
    title = title.replace(/_\d+$/, '');
    return { title, author };
  },

  // 漫画分组：将 "作品名_XX-by: 作者" 的条目按作品名+作者合并
  groupMangaByTitle(list) {
    const groups = {};
    list.forEach(item => {
      const parsed = this.parseWorkTitle(item.title);
      const key = parsed.title + '__' + parsed.author;
      if (!groups[key]) {
        groups[key] = {
          groupId: key,
          title: parsed.title,
          author: parsed.author,
          pages: [],
        };
      }
      groups[key].pages.push(item);
    });

    // 对每组内的页面按章节编号排序
    const result = Object.values(groups).map(group => {
      group.pages.sort((a, b) => {
        const numA = this.extractMangaChapter(a.title);
        const numB = this.extractMangaChapter(b.title);
        return numA - numB;
      });
      return group;
    });

    return result;
  },

  // 从 "作品名_XX-by: 作者" 中提取章节编号
  extractMangaChapter(fullTitle) {
    const match = fullTitle.match(/_(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  },

  // 打开漫画阅读器（跳转到新页面）
  openMangaViewer(e) {
    const group = e.currentTarget.dataset.group;
    const pagesData = group.pages.map(p => ({ workId: p.workId, fileId: p.fileId, title: p.title }));
    const ratingWorkId = group.pages[0] ? group.pages[0].workId : '';
    wx.navigateTo({
      url: `/subpkg/pages/manga-viewer/manga-viewer?title=${encodeURIComponent(group.title)}&author=${encodeURIComponent(group.author)}&pages=${encodeURIComponent(JSON.stringify(pagesData))}&ratingWorkId=${ratingWorkId}`,
    });
  },

  // 打开评分弹窗
  openRatingModal(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    this.setData({
      showRatingModal: true,
      ratingItem: item,
      modalUserScore: item.hasRated ? (item.userScore || 0) : 0,
      modalUserStars: this.calcUserStars(item.hasRated ? (item.userScore || 0) : 0),
      modalHasRated: item.hasRated || false,
    });
  },

  closeRatingModal() {
    this.setData({ showRatingModal: false });
  },

  // 打开致敬墙全部面板
  openTributePanel() {
    this.setData({ showTributePanel: true });
  },

  closeTributePanel() {
    this.setData({ showTributePanel: false });
  },

  stopTap() {
    // 阻止弹窗内容区域冒泡
  },

  // 弹窗内点击星星评分
  onModalStarTap(e) {
    const score = parseInt(e.currentTarget.dataset.score);
    if (!score || !this.data.ratingItem.workId) return;
    const item = this.data.ratingItem;

    cloudUtil.submitRating({ workId: item.workId, score }).then(res => {
      if (res.code === 0 && res.data) {
        const avgScore = res.data.avgScore;
        const ratingCount = res.data.ratingCount;
        const userStars = this.calcUserStars(score);
        const wasRated = this.data.modalHasRated;

        this.setData({
          modalUserScore: score,
          modalUserStars: userStars,
          modalHasRated: true,
        });

        // 同步更新列表中该作品的评分显示
        const updated = this.data.worksList.map(w => {
          if (w.workId === item.workId) {
            return {
              ...w,
              avgScore,
              ratingCount,
              avgStars: this.calcStars(avgScore),
              displayScore: avgScore.toFixed(1),
              hasRated: true,
              userScore: score,
            };
          }
          return w;
        });
        this.setData({ worksList: updated });

        const tip = wasRated ? '评分已更新' : '评分成功';
        wx.showToast({ title: tip, icon: 'success', duration: 1500 });
      } else {
        wx.showToast({ title: '评分失败', icon: 'none' });
      }
    });
  },

  calcUserStars(score) {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < score ? 'full' : 'empty');
    }
    return stars;
  },

  previewWork(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    if (item.category === '图片' || item.category === '视频') {
      const params = [
        `title=${encodeURIComponent(item.displayName || '')}`,
        `author=${encodeURIComponent(item.displayAuthor || '')}`,
        `category=${item.category}`,
      ];
      if (item.workId) params.push(`workId=${item.workId}`);
      if (item.fileUrl) params.push(`fileUrl=${encodeURIComponent(item.fileUrl)}`);
      wx.navigateTo({
        url: `/subpkg/pages/work-preview/work-preview?${params.join('&')}`,
      });
      return;
    }

    // 文档 — 在小程序内部预览，不跳转外部编辑器
    const getPreviewUrl = (workId) => {
      return cloudUtil.getWorkDetail({ workId }).then(res => {
        if (res.code === 0 && res.data.fileUrl) return res.data.fileUrl;
        return null;
      });
    };

    const openDoc = (url) => {
      wx.showLoading({ title: '加载中' });
      const ext = this._extractExt(item.fileId || url || '');
      const fileType = this._docType(ext);
      wx.downloadFile({
        url,
        success: (dlRes) => {
          wx.hideLoading();
          wx.openDocument({
            filePath: dlRes.tempFilePath,
            fileType: fileType || undefined,
            showMenu: true,
            useDocViewAnywhere: false,
            fail: () => wx.showToast({ title: '无法打开此文件', icon: 'error' }),
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '文件加载失败', icon: 'error' });
        },
      });
    };

    if (item.fileUrl) {
      openDoc(item.fileUrl);
    } else if (item.workId) {
      wx.showLoading({ title: '获取链接中' });
      getPreviewUrl(item.workId).then(url => {
        wx.hideLoading();
        if (url) {
          openDoc(url);
        } else {
          wx.showToast({ title: '暂无文件内容', icon: 'none' });
        }
      }).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '获取失败', icon: 'error' });
      });
    } else {
      wx.showToast({ title: '暂无文件内容', icon: 'none' });
    }
  },

  // 从路径提取文件扩展名
  _extractExt(path) {
    const idx = path.lastIndexOf('.');
    if (idx === -1) return '';
    return path.substring(idx + 1).split('?')[0].toLowerCase();
  },

  // 扩展名映射为 wx.openDocument fileType 参数
  _docType(ext) {
    const map = {
      pdf: 'pdf', doc: 'doc', docx: 'docx',
      xls: 'xls', xlsx: 'xlsx',
      ppt: 'ppt', pptx: 'pptx',
    };
    return map[ext] || '';
  },

  openLink(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.fileId) {
      wx.showToast({ title: '暂无链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: item.fileId,
      success: () => {
        wx.showToast({ title: '链接已复制到剪贴板', icon: 'success' });
      },
    });
  },

  onCanvasTap(e) {
    const query = wx.createSelectorQuery();
    query.select('#cloudMapCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;

        const width = res[0].width;
        const height = res[0].height;
        const x = e.detail.x;
        const y = e.detail.y;

        let foundCloud = null;

        this.data.eventClouds.forEach((cloud) => {
          const cloudX = cloud.x * width;
          const cloudY = cloud.y * height;
          const dist = Math.sqrt((x - cloudX) ** 2 + (y - cloudY) ** 2);

          if (dist < 30) {
            foundCloud = cloud;
            this.setData({ selectedCloud: cloud });

            if (this._infoTimer) {
              clearTimeout(this._infoTimer);
            }
            this._infoTimer = setTimeout(() => {
              this.setData({ selectedCloud: null });
            }, 3000);
          }
        });
      });
  },

  onUnload() {
    if (this.data.animationFrameId) {
      clearTimeout(this.data.animationFrameId);
    }
    // 清理音频
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.stop();
      this.data.innerAudioContext.destroy();
    }
  },

  // ========== 数字人音频相关 ==========

  // 异步请求TTS
  async requestTTS(text, msgId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'askDigitalHuman',
        data: { action: 'tts', text }
      });
      if (res.result.code === 0 && res.result.data && res.result.data.audioUrl) {
        this.updateAiMessage(msgId, { audioUrl: res.result.data.audioUrl });
        this.playAudioUrl(res.result.data.audioUrl, msgId);
      }
    } catch (e) {
      console.warn('TTS请求失败:', e.message);
    }
  },

  // 播放音频URL
  playAudioUrl(e) {
    // 支持两种调用方式：事件对象或直接传参数
    let audioUrl, msgId;
    if (e && e.currentTarget) {
      audioUrl = e.currentTarget.dataset.audiourl;
      msgId = e.currentTarget.dataset.msgid;
    } else if (typeof e === 'string') {
      audioUrl = e;
      msgId = msgId;
    } else {
      return;
    }
    if (!audioUrl) return;

    // 获取数字人组件，驱动嘴型动画
    const dhComponent = this.selectComponent('#digitalHumanExhibit');
    if (dhComponent) {
      dhComponent._playAudio(audioUrl);
    }

    // 同时用小程序音频播放（备用）
    if (!this.data.innerAudioContext) {
      this.setData({ innerAudioContext: wx.createInnerAudioContext() });
    }
    const innerAudioContext = this.data.innerAudioContext;
    innerAudioContext.src = audioUrl;
    innerAudioContext.play();

    // 更新播放状态
    const messages = this.data.aiMessages.map(msg => {
      if (msg.id === msgId) return { ...msg, audioPlaying: true };
      return { ...msg, audioPlaying: false };
    });
    this.setData({ aiMessages: messages });

    innerAudioContext.onEnded(() => {
      const msgs = this.data.aiMessages.map(msg => {
        if (msg.id === msgId) return { ...msg, audioPlaying: false };
        return msg;
      });
      this.setData({ aiMessages: msgs });
    });
  },

  // 停止播放
  stopAudio() {
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.stop();
    }
    const messages = this.data.aiMessages.map(msg => ({ ...msg, audioPlaying: false }));
    this.setData({ aiMessages: messages });
  },

  // 更新AI消息
  updateAiMessage(id, updates) {
    const messages = this.data.aiMessages.map(msg => {
      if (msg.id === id) return { ...msg, ...updates };
      return msg;
    });
    this.setData({ aiMessages: messages, aiScrollId: `ai-msg-${id}` });
  },

  // 数字人组件事件处理
  onDigitalHumanMessage(e) {
    console.log('[exhibit] onDigitalHumanMessage received:', e.detail);
    const { answer } = e.detail;
    const msgs = this.data.aiMessages.map(m =>
      m.loading ? { ...m, loading: false, text: answer, role: 'ai' } : m
    );
    this.setData({ aiMessages: msgs, aiChatting: false, currentAiMsgId: null });
  },

  onSpeakEnd() {
    console.log('[digital-human] 语音播放结束');
  },

  onDigitalHumanError(e) {
    console.error('[digital-human] 错误:', e.detail.err);
  },

  // ===== 用户致敬留言 =====

  loadTributes(isRefresh) {
    if (this.data.tributeLoading || (!this.data.tributeHasMore && !isRefresh)) return;

    const page = isRefresh ? 1 : this.data.tributePage;
    this.setData({ tributeLoading: true });

    cloudUtil.getTributes({ page, pageSize: 20 }).then(res => {
      if (!res || res.code !== 0) {
        console.error('[loadTributes] 请求失败:', res);
        this.setData({ tributeLoading: false });
        return;
      }
      const list = res.data.list || [];
      const allTributes = isRefresh ? list : this.data.userTributes.concat(list);
      this.setData({
        userTributes: allTributes,
        tributePreviewList: allTributes.slice(0, 3),
        tributePage: page + 1,
        tributeHasMore: res.data.hasMore,
        tributeLoading: false,
      });
    }).catch(err => {
      console.error('[loadTributes] 异常:', err);
      this.setData({ tributeLoading: false });
    });
  },

  onTributeInput(e) {
    this.setData({ tributeInputValue: e.detail.value });
  },

  onTributeFocus() {
    this.setData({ tributeInputFocused: true });
  },

  onTributeBlur() {
    this.setData({ tributeInputFocused: false });
  },

  submitTribute() {
    const message = this.data.tributeInputValue.trim();
    if (!message) {
      wx.showToast({ title: '请输入致敬内容', icon: 'none' });
      return;
    }
    if (message.length > 500) {
      wx.showToast({ title: '内容不能超过500字', icon: 'none' });
      return;
    }
    if (this.data.tributeSubmitting) return;

    this.setData({ tributeSubmitting: true });

    cloudUtil.submitTribute({ message }).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: '致敬已提交', icon: 'success' });
        const newItem = {
          _id: res.data.tributeId,
          message: res.data.message,
          nickname: res.data.nickname,
          avatarUrl: res.data.avatarUrl,
          createdAt: res.data.createdAt,
          isMine: true,
        };
        this.setData({
          tributeInputValue: '',
          tributeSubmitting: false,
          userTributes: [newItem].concat(this.data.userTributes),
          tributePreviewList: [newItem].concat(this.data.userTributes).slice(0, 3),
        });
        // 首次留言发放徽章
        this._unlockBadgeById('badge_09', '_tributeBadgeGranted');
      } else {
        wx.showToast({ title: res.message || '提交失败', icon: 'none' });
        this.setData({ tributeSubmitting: false });
      }
    }).catch(err => {
      console.error('[submitTribute] 异常:', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      this.setData({ tributeSubmitting: false });
    });
  },

  // 删除自己的致敬留言
  deleteTribute(e) {
    const tributeId = e.currentTarget.dataset.tributeid;
    const nickname = e.currentTarget.dataset.nickname;
    if (!tributeId) return;

    const self = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条致敬留言吗？删除后无法恢复。',
      success(res) {
        if (!res.confirm) return;

        cloudUtil.deleteTribute({ tributeId }).then(result => {
          if (result.code === 0) {
            // 从本地列表中移除
            const userTributes = self.data.userTributes.filter(t => t._id !== tributeId);
            self.setData({
              userTributes,
              tributePreviewList: userTributes.slice(0, 3),
            });
            wx.showToast({ title: '已删除', icon: 'success', duration: 1500 });
          } else {
            wx.showToast({ title: result.message || '删除失败', icon: 'none' });
          }
        }).catch(err => {
          console.error('[deleteTribute] 异常:', err);
          wx.showToast({ title: '网络异常', icon: 'none' });
        });
      },
    });
  },

  // ========== 镜像实验室 ==========

  toggleLab() {
    const willShow = !this.data.showLabPanel;
    this.setData({
      showLabPanel: willShow,
      showBadgePanel: false,
      showAIPanel: false,
      showQuizPanel: false,
      showMaterialsPanel: false,
    });
    if (willShow) {
      this._labSliderRect = null;
      setTimeout(() => this._initCanvasAfterDelay(), 300);
    } else {
      this._stopLabAnim();
      // 关闭面板时判定徽章
      this._grantLabBadgeIfNeeded();
    }
  },

  // 开始实验
  _startLab() {
    this._labSliderRect = null;
    this.setData({
      labStep: 1,
      labTemperature: 0,
      labFieldStrength: 0,
      labParticles: [],
      labCanAdvance: true, // 第一步无条件可前进
    });
    this._stopLabAnim();
    setTimeout(() => this._initCanvasAfterDelay(), 300);
  },

  // 下一步（受 labCanAdvance 限制）
  _nextLabStep() {
    if (!this.data.labCanAdvance) return;
    const next = this.data.labStep + 1;
    const isCompleted = next === 7;
    this.setData({
      labStep: next,
      labParticles: [],
      labCanAdvance: this._getCanAdvanceForStep(next),
      labCompleted: isCompleted,
    });
    this._stopLabAnim();
    if (next <= 7) {
      setTimeout(() => this._initCanvasAfterDelay(), 300);
    }
  },

  // 某步骤的初始可前进条件
  _getCanAdvanceForStep(step) {
    if (step === 1) return true;
    if (step === 2) return this.data.labTemperature >= 280; // 接近 300（0K）
    if (step === 3) return this.data.labFieldStrength >= 80;
    // 4/5/6 需要答对，7 是完成页
    return false;
  },

  // 上一步
  _prevLabStep() {
    if (this.data.labStep <= 1) return;
    const prev = this.data.labStep - 1;
    this.setData({ labStep: prev, labParticles: [], labCanAdvance: this._getCanAdvanceForStep(prev) });
    this._stopLabAnim();
    setTimeout(() => this._initCanvasAfterDelay(), 300);
  },

  // 返回展馆（判定徽章）
  backToExhibit() {
    this._grantLabBadgeIfNeeded();
    this.setData({ showLabPanel: false, labStep: 0, labCompleted: false });
    this._stopLabAnim();
  },

  // 按需发放徽章
  _grantLabBadgeIfNeeded() {
    // 进入过第 7 步（完成页）或已标记完成，就发放
    if (this.data._labBadgeGranted) return;
    if (this.data.labStep >= 7 || this.data.labCompleted) {
      this._doGrantBadge();
    }
  },

  _doGrantBadge() {
    if (this.data._labBadgeGranted) return;
    this.setData({ _labBadgeGranted: true, labCompleted: true });
    const badge = this.data.badges.find(b => b.id === 'badge_08');
    if (badge && !badge.unlocked) {
      const badges = this.data.badges.map(item => {
        if (item.id === 'badge_08') return { ...item, unlocked: true };
        return item;
      });
      this.setData({ badges, newBadges: true, badgeNotification: badge });
      this.saveProgressCache(this.data.eventClouds, badges);
      cloudUtil.grantBadge({ badgeId: 'badge_08' }).catch(() => {});
      if (this._badgeNotificationTimer) clearTimeout(this._badgeNotificationTimer);
      this._badgeNotificationTimer = setTimeout(() => {
        this.setData({ badgeNotification: null });
      }, 3000);
    }
  },

  // Canvas 初始化（统一入口，重试机制）
  _initCanvasAfterDelay() {
    const self = this;
    if (this.data.showLabPanel && this.data.labStep > 0) {
      setTimeout(() => self._initCanvas(), 200);
    }
  },

  _initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('.lab-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          console.warn('[lab] Canvas not ready, retry...');
          setTimeout(() => this._initCanvas(), 200);
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        this.setData({
          labCanvasNode: canvas,
          labCtx: ctx,
          labCanvasWidth: res[0].width,
          labCanvasHeight: res[0].height,
          labCanvasReady: true,
          labParticles: [],
        });
        this._drawScene();
      });
  },

  // 绘制场景（根据 labStep 分发）
  _drawScene() {
    const { labCtx, labCanvasWidth, labCanvasHeight, labStep } = this.data;
    if (!labCtx) return;
    const ctx = labCtx;
    const w = labCanvasWidth;
    const h = labCanvasHeight;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.48;

    if (labStep === 1) {
      this._drawNucleusSimple(ctx, cx, cy, 45);
      this._drawLabel(ctx, w, h, '钴-60原子核', '放射性同位素，β衰变中释放电子');
    } else if (labStep === 2) {
      const actualTemp = 300 - this.data.labTemperature;
      this._drawNucleusWithSpins(ctx, cx, cy, 40, actualTemp);
      this._drawLabel(ctx, w, h, '温度: ' + Math.round(actualTemp) + 'K',
        actualTemp < 100 ? '原子核自旋已对齐（极化）！' : '降温使原子核排列整齐');
    } else if (labStep === 3) {
      this._drawNucleusWithField(ctx, cx, cy, 40, this.data.labFieldStrength);
      this._drawLabel(ctx, w, h, '磁场强度: ' + Math.round(this.data.labFieldStrength) + '%',
        '磁场帮助极化原子核，让自旋方向一致');
    } else if (labStep === 4) {
      this._drawNucleusWithSpins(ctx, cx, cy, 30, 0);
      this._spawnElectrons(ctx, w, h, true);
      this._drawLabel(ctx, w, h, '观察电子发射方向', '注意粒子主要从哪边飞出？');
    } else if (labStep === 5) {
      this._drawMirrorScene(ctx, w, h);
    } else if (labStep === 6) {
      this._drawRevealScene(ctx, w, h);
    } else if (labStep === 7) {
      this._drawCompletion(ctx, w, h);
    }

    if (labStep >= 2 && labStep <= 6) {
      this.data.labAnimFrameId = setTimeout(() => this._drawScene(), 50);
    }
  },

  // 钴-60 简单展示
  _drawNucleusSimple(ctx, cx, cy, r) {
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(cx - 8, cy - 8, 0, cx, cy, r);
    g.addColorStop(0, '#5a9ae5');
    g.addColorStop(0.7, '#2a5a8a');
    g.addColorStop(1, '#1a3a5a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f0ede6';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Co-60', cx, cy + 6);
  },

  // 带自旋箭头的原子核
  _drawNucleusWithSpins(ctx, cx, cy, r, temperature) {
    this._drawNucleusSimple(ctx, cx, cy, r);
    const align = 1 - temperature / 300;
    const n = 10;
    for (let i = 0; i < n; i++) {
      let a;
      if (align > 0.7) {
        a = -Math.PI / 2 + (Math.random() - 0.5) * (1 - align) * Math.PI * 1.5;
      } else {
        a = (i / n) * Math.PI * 2;
      }
      const sx = cx + Math.cos(a) * (r + 8);
      const sy = cy + Math.sin(a) * (r + 8);
      const ex = cx + Math.cos(a) * (r + 22);
      const ey = cy + Math.sin(a) * (r + 22);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + align * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + align * 0.6})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 带磁场的原子核
  _drawNucleusWithField(ctx, cx, cy, r, fieldStrength) {
    this._drawNucleusSimple(ctx, cx, cy, r);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const offset = (i - (n - 1) / 2) * 18;
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.15 + fieldStrength / 300 * 0.5})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 80, cy + offset);
      ctx.lineTo(cx + 80, cy + offset);
      ctx.stroke();
      ctx.setLineDash([]);
      const arrowX = cx + 80;
      ctx.fillStyle = `rgba(100, 200, 255, ${0.3 + fieldStrength / 300 * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(arrowX, cy + offset - 5);
      ctx.lineTo(arrowX + 8, cy + offset);
      ctx.lineTo(arrowX, cy + offset + 5);
      ctx.fill();
    }
    const align = fieldStrength / 100;
    const spinN = 8;
    for (let i = 0; i < spinN; i++) {
      let a = -Math.PI / 2 + (Math.random() - 0.5) * (1 - align) * Math.PI * 1.5;
      const sx = cx + Math.cos(a) * (r + 8);
      const sy = cy + Math.sin(a) * (r + 8);
      const ex = cx + Math.cos(a) * (r + 22);
      const ey = cy + Math.sin(a) * (r + 22);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + align * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + align * 0.5})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 电子粒子系统
  _spawnElectrons(ctx, w, h, polarized) {
    let particles = this.data.labParticles || [];
    if (particles.length < 50) {
      const angle = polarized
        ? (-Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.5)
        : Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({
        x: w / 2,
        y: h * 0.48,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 2 + Math.random() * 2.5,
      });
    }
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      if (p.life <= 0) return false;
      return true;
    });
    for (const p of particles) {
      ctx.fillStyle = `rgba(100, 255, 180, ${p.life * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(100, 255, 180, ${p.life * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
      ctx.stroke();
    }
    this.setData({ labParticles: particles });
  },

  // 镜像对比场景
  _drawMirrorScene(ctx, w, h) {
    const midX = w / 2;
    const centerY = h * 0.45;

    ctx.strokeStyle = 'rgba(201, 169, 110, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, h * 0.1);
    ctx.lineTo(midX, h * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('真实实验', w / 4, h * 0.15);
    ctx.fillText('镜像世界', w * 3 / 4, h * 0.15);

    this._drawNucleusSimple(ctx, w / 4, centerY, 30);
    this._drawFixedElectrons(ctx, w / 4, centerY, 'up', w / 4);

    this._drawNucleusSimple(ctx, w * 3 / 4, centerY, 30);
    this._drawFixedElectrons(ctx, w * 3 / 4, centerY, 'down', w / 4);

    ctx.fillStyle = '#ff6347';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('镜像中的电子方向应该反转！', midX, h * 0.76);
  },

  // 固定方向的电子发射
  _drawFixedElectrons(ctx, cx, cy, dir, halfW) {
    const time = Date.now() / 1000;
    const n = 20;
    for (let i = 0; i < n; i++) {
      const seed = (i * 7.3 + time * 2) % 1;
      const progress = seed;
      const spread = (Math.sin(i * 3.7 + time * 3) * 0.4);
      const dist = progress * halfW * 0.8;

      let ex, ey;
      if (dir === 'up') {
        ex = cx + spread * dist * 0.4;
        ey = cy - dist;
      } else {
        ex = cx + spread * dist * 0.4;
        ey = cy + dist;
      }
      const alpha = 1 - progress;
      ctx.fillStyle = `rgba(100, 255, 180, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 揭示结果场景
  _drawRevealScene(ctx, w, h) {
    const midX = w / 2;
    const centerY = h * 0.42;

    ctx.strokeStyle = 'rgba(201, 169, 110, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, h * 0.1);
    ctx.lineTo(midX, h * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('真实', w / 4, h * 0.15);
    ctx.fillText('镜像', w * 3 / 4, h * 0.15);

    this._drawNucleusSimple(ctx, w / 4, centerY, 30);
    this._drawFixedElectrons(ctx, w / 4, centerY, 'up', w / 4);

    this._drawNucleusSimple(ctx, w * 3 / 4, centerY, 30);
    this._drawFixedElectrons(ctx, w * 3 / 4, centerY, 'up', w / 4);

    const pulse = 0.6 + Math.sin(Date.now() / 400) * 0.4;
    ctx.fillStyle = `rgba(255, 99, 71, ${pulse})`;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('两边都向上！这不可能！', midX, h * 0.73);
    ctx.fillStyle = '#c9a96e';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('宇称不守恒被证实！', midX, h * 0.84);
  },

  // 完成页场景
  _drawCompletion(ctx, w, h) {
    const time = Date.now() / 1000;
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + time * 0.5;
      const r = 60 + Math.sin(time * 2 + i * 0.5) * 25;
      const x = w / 2 + Math.cos(angle) * r;
      const y = h / 2 + Math.sin(angle) * r;
      const alpha = 0.3 + Math.sin(time * 3 + i) * 0.2;
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 统一标签绘制
  _drawLabel(ctx, w, h, main, sub) {
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(main, w / 2, h * 0.65);
    ctx.fillText(sub, w / 2, h * 0.85);
  },

  // 停止动画
  _stopLabAnim() {
    if (this.data.labAnimFrameId) {
      clearTimeout(this.data.labAnimFrameId);
      this.data.labAnimFrameId = null;
    }
    this.setData({ labParticles: [] });
  },

  // 温度滑块
  onSliderChanging(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      const canAdvance = value >= 280; // 接近绝对零度（300 = 0K）
      this.setData({ labTemperature: value, labCanAdvance: canAdvance });
    }
  },
  onSliderChange(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      const canAdvance = value >= 280;
      this.setData({ labTemperature: value, labCanAdvance: canAdvance });
    }
  },

  // 磁场滑块
  onFieldChanging(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      const canAdvance = value >= 80;
      this.setData({ labFieldStrength: value, labCanAdvance: canAdvance });
    }
  },
  onFieldChange(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      const canAdvance = value >= 80;
      this.setData({ labFieldStrength: value, labCanAdvance: canAdvance });
    }
  },

  // 选择
  onLabChoice(e) {
    const choice = e.currentTarget.dataset.choice;
    const step = this.data.labStep;

    if (step === 4) {
      if (choice === 'up') {
        this.setData({ labCanAdvance: true });
        wx.showToast({ title: '正确！', icon: 'success', duration: 1500 });
      } else {
        this.setData({ labCanAdvance: false });
        wx.showToast({ title: '再观察一下粒子的方向', icon: 'none', duration: 2000 });
      }
    } else if (step === 5) {
      if (choice === 'different') {
        this.setData({ labCanAdvance: true });
        wx.showToast({ title: '正确！', icon: 'success', duration: 1500 });
      } else {
        this.setData({ labCanAdvance: false });
        wx.showToast({ title: '注意看两边电子的方向是否一致', icon: 'none', duration: 2000 });
      }
    } else if (step === 6) {
      if (choice === 'violation') {
        this.setData({ labCanAdvance: true });
        wx.showToast({ title: '正确！', icon: 'success', duration: 1500 });
      } else {
        this.setData({ labCanAdvance: false });
        wx.showToast({ title: '再想想，两边的结果一样吗？', icon: 'none', duration: 2000 });
      }
    }
  },
});
