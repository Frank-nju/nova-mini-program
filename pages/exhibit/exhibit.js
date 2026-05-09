const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    screenHeight: 0,
    currentSection: 'section-0',
    stars: [],
    activeStates: [true, false, false, false, false, false, false, false],
    showBadgePanel: false,
    showAIPanel: false,
    showMaterialsPanel: false,
    materialsList: [],
    materialTab: 'works',
    presetQuestions: cloudUtil.getPresetQuestions(),
    aiMessages: [],
    aiInputValue: '',
    aiChatting: false,
    aiScrollId: '',
    aiMsgCounter: 0,
    _badge07Granted: false,
    newBadges: false,
    badgeNotification: null,
    eventClouds: [],
    badges: [
      { id: 'badge_01', icon: '🌟', name: '序章探索', condition: '阅读完序章的全部6个故事', section: 1, unlocked: false },
      { id: 'badge_02', icon: '📖', name: '生平完成', condition: '阅读完生平履历的全部6个故事', section: 2, unlocked: false },
      { id: 'badge_03', icon: '✍️', name: '治学达人', condition: '阅读完治学风骨的全部6个故事', section: 3, unlocked: false },
      { id: 'badge_04', icon: '🔬', name: '科研专家', condition: '阅读完科研丰碑的全部6个故事', section: 4, unlocked: false },
      { id: 'badge_05', icon: '🕊️', name: '追光行者', condition: '阅读完尾声的全部6个故事', section: 5, unlocked: false },
      { id: 'badge_06', icon: '👑', name: '知识王者', condition: '答题挑战5题全对', section: null, unlocked: false },
      { id: 'badge_07', icon: '🌠', name: '追光终章', condition: '阅读完致敬墙与传承纪念', section: null, unlocked: false },
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

    // 漫画分组数据
    mangaGroups: [],
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
    setTimeout(() => this.loadProgress(), 300);
  },

  onShow() {
    setTimeout(() => this.loadProgress(), 300);
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
    const index = Math.round(scrollTop / screenHeight);

    let newStates = this.data.activeStates.slice();
    let hasChanged = false;

    for (let i = 0; i < 8; i++) {
      const shouldBeActive = (i <= index && i >= Math.max(0, index - 1));
      if (newStates[i] !== shouldBeActive) {
        newStates[i] = shouldBeActive;
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.setData({ activeStates: newStates });
      // 首次滚动到第7部分（致敬墙·传承），自动发放 badge_07
      if (newStates[6] && !this.data._badge07Granted) {
        this.setData({ _badge07Granted: true });
        const badge = this.data.badges.find(b => b.id === 'badge_07');
        if (badge && !badge.unlocked) {
          this.unlockBadgeByBadge(badge);
        }
      }
    }
    this.data.scrollY = scrollTop;
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
    if (cloud.unlocked) return;

    // 乐观更新UI
    const eventClouds = [...this.data.eventClouds];
    eventClouds[cloudIndex] = { ...cloud, unlocked: true };
    this.setData({ eventClouds });
    this.createParticleExplosion(cloud);

    // 立即保存缓存（不等 setData 回调）
    this.saveProgressCache(eventClouds, this.data.badges);

    // 检查是否完成整个章节
    const sectionCloudCount = eventClouds.filter(c => c.section === section).length;
    const unlockedCount = eventClouds.filter(
      c => c.section === section && c.unlocked
    ).length;

    if (unlockedCount === sectionCloudCount) {
      this.unlockBadge(section);
      wx.showToast({ title: `${this.getBadgeName(section)} 已获得！`, icon: 'success', duration: 2000 });
    }

    // 乐观更新已完成，缓存已保存，无需额外云同步（后端云函数开发中）
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

    // 添加 loading 消息
    const loadingId = ++this.data.aiMsgCounter;
    this.setData({
      aiMessages: [...this.data.aiMessages, { id: loadingId, role: 'ai', loading: true }],
      aiScrollId: `ai-msg-${loadingId}`,
    });

    // 调用云函数
    cloudUtil.chatWithDigitalHuman({ question })
      .then(res => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: res.data.text } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
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

  sendPreset(e) {
    const index = e.currentTarget.dataset.index;
    const question = this.data.presetQuestions[index];
    if (!question || this.data.aiChatting) return;

    const msgId = ++this.data.aiMsgCounter;
    const messages = [...this.data.aiMessages, { id: msgId, role: 'user', text: question }];

    this.setData({
      aiMessages: messages,
      aiChatting: true,
      aiScrollId: `ai-msg-${msgId}`,
    });

    const loadingId = ++this.data.aiMsgCounter;
    this.setData({
      aiMessages: [...this.data.aiMessages, { id: loadingId, role: 'ai', loading: true }],
      aiScrollId: `ai-msg-${loadingId}`,
    });

    cloudUtil.chatWithDigitalHuman({ question })
      .then(res => {
        const updated = this.data.aiMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: res.data.text } : m
        );
        this.setData({
          aiMessages: updated,
          aiChatting: false,
          aiScrollId: `ai-msg-${loadingId}`,
        });
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

  // ===== 阅读成果 =====

  loadWorks(isRefresh) {
    if (this.data.worksLoading || (!this.data.worksHasMore && !isRefresh)) return;

    const page = isRefresh ? 1 : this.data.worksPage;
    const category = this.data.worksTab === 'all' ? '' : this.data.worksTab;

    this.setData({ worksLoading: true });

    cloudUtil.getWorks({ page, pageSize: 20, category }).then(res => {
      console.log('[loadWorks] 响应:', JSON.stringify(res));
      if (!res || res.code !== 0) {
        console.error('[loadWorks] 请求失败:', res);
        this.setData({ worksLoading: false });
        return;
      }

      let list = res.data.list || [];
      console.log('[loadWorks] 数据条数:', list.length);

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
      }

      // 预加载有 fileId 的项目（"其他"类别不需要预加载，fileId 就是直链；漫画需要预加载图片URL）
      const needUrlItems = list.filter(item => item.fileId && !item.fileUrl && item.category !== '其他');
      if (needUrlItems.length > 0) {
        this.preloadWorkUrls(needUrlItems, list);
      }

      this.setData({
        worksList: isRefresh ? list : [...this.data.worksList, ...list],
        worksPage: page + 1,
        worksHasMore: res.data.hasMore,
        worksLoading: false,
      });
    }).catch(err => {
      console.error('[loadWorks] 异常:', err);
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
        this.setData({ worksList: updated });

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

  loadMoreWorks() {
    if (!this.data.worksLoading && this.data.worksHasMore) {
      this.loadWorks();
    }
  },

  switchWorksTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ worksTab: tab, worksList: [], worksPage: 1, worksHasMore: true, mangaGroups: [] });
    this.loadWorks(true);
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
    wx.navigateTo({
      url: `/subpkg/pages/manga-viewer/manga-viewer?title=${encodeURIComponent(group.title)}&author=${encodeURIComponent(group.author)}&pages=${encodeURIComponent(JSON.stringify(pagesData))}`,
    });
  },

  previewWork(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    const getPreviewUrl = (workId) => {
      return cloudUtil.getWorkDetail({ workId }).then(res => {
        if (res.code === 0 && res.data.fileUrl) return res.data.fileUrl;
        return null;
      });
    };

    if (item.category === '图片') {
      if (item.fileUrl) {
        wx.previewImage({ urls: [item.fileUrl] });
      } else if (item.workId) {
        wx.showLoading({ title: '获取链接中' });
        getPreviewUrl(item.workId).then(url => {
          wx.hideLoading();
          if (url) {
            wx.previewImage({ urls: [url] });
          } else {
            wx.showToast({ title: '暂无图片文件', icon: 'none' });
          }
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '获取失败', icon: 'error' });
        });
      } else {
        wx.showToast({ title: '暂无图片文件', icon: 'none' });
      }
    } else if (item.category === '视频') {
      if (item.fileUrl) {
        wx.previewMedia({ sources: [{ url: item.fileUrl, type: 'video' }] });
      } else if (item.workId) {
        wx.showLoading({ title: '获取链接中' });
        getPreviewUrl(item.workId).then(url => {
          wx.hideLoading();
          if (url) {
            wx.previewMedia({ sources: [{ url, type: 'video' }] });
          } else {
            wx.showToast({ title: '暂无视频文件', icon: 'none' });
          }
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '获取失败', icon: 'error' });
        });
      } else {
        wx.showToast({ title: '暂无视频文件', icon: 'none' });
      }
    } else {
      // 文档
      const openDoc = (url) => {
        wx.showLoading({ title: '加载中' });
        wx.downloadFile({
          url,
          success: (dlRes) => {
            wx.hideLoading();
            wx.openDocument({
              filePath: dlRes.tempFilePath,
              showMenu: true,
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
    }
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
  },
});
