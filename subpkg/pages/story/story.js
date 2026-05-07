const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    section: 0,
    story: 0,
    currentStoryIndex: 0,
    totalStories: 0,
    storyTitle: '',
    showCompleteAnimation: false,
    chapterType: '', // biography | timeline | spirit | research | epilogue
    currentStory: {
      title: '',
      content: '',
      year: '',
      event: '',
      image: '',
    },

    // 数字人面板状态
    showDhPanel: false,
    dhPresets: [],
    dhWelcome: '',
    dhMessages: [],
    dhInputValue: '',
    dhChatting: false,
    dhScrollId: '',
    dhMsgCounter: 0,

    // 各章节额外数据
    chapterSubtitles: [
      '远方追光',
      '孤行远方',
      '严谨之光',
      '改变物理学史的发现',
      '永恒的科学精神',
    ],

    // 尾声结尾寄语 - 每个故事对应不同的寄语
    epilogueClosingTexts: [
      '追忆往昔，光辉犹在；她以一生的热爱与坚持，点亮了科学史上最温暖的一束光',
      '打破偏见，她以行动证明了女性在科学领域的无限可能与伟大力量',
      '跨越重洋，心系故土；无论走得多远，初心从未改变',
      '回馈社会，薪火相传；她把爱与希望种在下一代科学家的心中',
      '一息尚存，笔耕不辍；她用生命的最后时光诠释了什么是真正的科学精神',
      '精神不朽，浩气长存；她的一生，就是一部最动人的科学诗篇',
    ],

    // 序章 - 时代背景
    eraContext: [
      { icon: '🏛️', text: '中华民国成立，中国两千多年的帝制走向终结。这是一个新旧交替的时代，传统与现代在碰撞中孕育变革。' },
      { icon: '📚', text: '南京国民政府时期，中国新文化运动蓬勃发展，教育改革和女性解放成为时代议题。越来越多的女性开始走进学堂。' },
      { icon: '🔬', text: '中国近代科学启蒙时期，国立中央大学是当时最高学府。物理学作为一门现代学科刚刚在中国扎根，一批先驱者开始了科学探索之路。' },
      { icon: '🌍', text: '世界正笼罩在二战的阴云之中。而在中国，科学家们仍在艰难地坚守着学术的火种，等待和平的到来。' },
      { icon: '✈️', text: '1930年代中期，中国知识界掀起了留学热潮。无数有志青年远渡重洋，希望在世界学术舞台上寻找真理。' },
      { icon: '🚢', text: '太平洋战争爆发前夕，中国留学生穿越太平洋，踏上了异国他乡的科学征途。大洋彼岸，是一个完全不同的世界。' },
    ],

    // 序章 - 人生年龄标注
    bioAgeText: ['1岁', '16岁', '18岁', '20岁', '22岁', '24岁'],
    bioAgePercent: ['1%', '19%', '21%', '24%', '26%', '28%'],

    // 治学风骨 - 精神关键词
    spiritKeywords: [
      { icon: '🎯', name: '严谨求实', desc: '每一个数据反复验证，绝不容许半点马虎' },
      { icon: '💎', name: '精益求精', desc: '一个数据测量47次，追求极致精度' },
      { icon: '🕯️', name: '执着奉献', desc: '实验室的最后一盏灯，总是她亮着' },
      { icon: '⚖️', name: '学术诚实', desc: '发现小错也坚持撤回论文修正' },
      { icon: '📖', name: '传道授业', desc: '严格推导和计算，培养一代杰出科学家' },
      { icon: '🌏', name: '国际认可', desc: '用精确实验赢得世界物理学界尊重' },
    ],

    // 已完成的故事索引（按章节）
    completedStories: {},

    // 卡片入场动画
    showCardAnimation: false,

    // Canvas 动态标题
    canvasTitle: '实验示意',

    // 时间线滚动目标
    scrollIntoView: '',

    // 序章暗到亮过渡
    chapterOverlayOpacity: 0.9,

    // 尾声背景阶段 (0-5)
    epilogueBgStage: 0,
    epilogueThemes: [
      { bg: 'linear-gradient(135deg, rgba(42, 26, 10, 0.97), rgba(26, 16, 8, 0.95))', particleColor: '#ff8c42', label: '黄昏' },
      { bg: 'linear-gradient(135deg, rgba(26, 21, 32, 0.97), rgba(18, 14, 24, 0.95))', particleColor: '#c97db8', label: '暮色' },
      { bg: 'linear-gradient(135deg, rgba(14, 21, 37, 0.97), rgba(10, 16, 32, 0.95))', particleColor: '#6488c8', label: '夜色' },
      { bg: 'linear-gradient(135deg, rgba(10, 16, 32, 0.97), rgba(8, 12, 24, 0.95))', particleColor: '#64c8ff', label: '深夜' },
      { bg: 'linear-gradient(135deg, rgba(12, 12, 24, 0.97), rgba(10, 10, 18, 0.95))', particleColor: '#8080a0', label: '黎明前' },
      { bg: 'linear-gradient(135deg, rgba(10, 10, 21, 0.97), rgba(5, 5, 16, 0.95))', particleColor: '#ffd700', label: '星空永恒' },
    ],

    // 星空粒子数据（尾声最后一个故事触发）
    starfieldStars: [],

    // Canvas 切换透明度（淡入淡出）
    canvasOpacity: 1,

    // 故事数据库 - 精简版，每章5-6个故事，共30个故事
    storiesData: [
      {
        // 序章 - 6个故事
        section: 1,
        stories: [
          {
            title: '序章·诞生',
            content: '1912年5月31日，吴健雄出生于江苏太仓浏河镇。她的父亲吴仲裔是一位教育家和实业家，母亲樊复华是一位教师。在这样的家庭环境中，年幼的健雄展现出了对知识的渴望和对未来的憧憬。',
            year: '1912',
            event: '出生',
            stamp: '诞',
            stampLabel: '诞生',
            quote: '"科学没有国界，但科学家有祖国。" —— 吴健雄',
          },
          {
            title: '序章·家风',
            content: '当健雄表达想要进入大学学习物理时，她的家人毫不犹豫地支持了她。父亲说："性别不应该成为追求梦想的障碍。"这样的支持给了她无限的勇气和动力，为她的科学梦奠定了基础。',
            year: '1928',
            event: '家庭鼓励',
            stamp: '家',
            stampLabel: '家风',
            quote: '"每一个女孩都是一颗种子，只要给她阳光和土壤，她就能开出花来。" —— 吴健雄',
          },
          {
            title: '序章·入中大',
            content: '1930年，高中毕业的吴健雄面临着人生的重要选择。国立中央大学（今南京大学前身）向她敞开了大门。她最初选择的是数学专业，一年后转入物理系——因为她相信物理能够帮助人类理解这个世界的本质。',
            year: '1930',
            event: '进入中大',
            stamp: '学',
            stampLabel: '求学',
            quote: '"物理学是研究宇宙最基础规律的科学，它让我着迷。" —— 吴健雄',
          },
          {
            title: '序章·遇恩师',
            content: '在中大，吴健雄遇到了她的恩师——居里夫人的学生施士元教授。施教授立即被这位学生的才华和热情所吸引。他指导她完成了毕业论文，并告诉她："要做一个顶尖的物理学家，光有才华是不够的，还需要无比的热情和坚持。"',
            year: '1932',
            event: '恩师指引',
            stamp: '师',
            stampLabel: '恩师',
            quote: '"要做一个顶尖的物理学家，光有才华是不够的，还需要无比的热情和坚持。" —— 施士元',
          },
          {
            title: '序章·立初心',
            content: '在一次与王教授的谈话中，教授问："你为什么想要成为一个科学家？"年轻的健雄回答："因为科学能够帮助人类理解这个世界，理解生命的本质。这是人类最高尚的追求。"这份初心指引了她整个人生。',
            year: '1934',
            event: '初心明确',
            stamp: '志',
            stampLabel: '立志',
            quote: '"科学能够帮助人类理解这个世界，理解生命的本质。这是人类最高尚的追求。" —— 吴健雄',
          },
          {
            title: '序章·赴美',
            content: '1936年8月，吴健雄登上了开往美国的轮船。她获得了中国教育基金会的留学奖学金。在船舱里，她看着渐渐远去的故乡，心里装满了对知识的渴望。她暗下决心：一定要在世界舞台上为中国科学争得一席之地。',
            year: '1936',
            event: '启程美国',
            stamp: '航',
            stampLabel: '远航',
            quote: '"带着祖国的期望出发，带着科学的使命前行。" —— 吴健雄',
          },
        ],
      },
      {
        // 生平履历 - 6个故事
        section: 2,
        stories: [
          {
            title: '生平·初抵美',
            content: '1936年底，吴健雄抵达美国。这是她第一次离开故乡，一切都陌生而新奇。美国的科学教育方式与中国截然不同，但她很快就适应了这里的节奏。加州大学伯克利分校的校园吸引了她所有的注意力。',
            year: '1936',
            event: '初到美国',
            eventColor: '#64c8ff',
            eventIcon: '🚢',
          },
          {
            title: '生平·伯克利',
            content: '在伯克利，吴健雄师从著名的能谱学家劳伦斯（Ernest O. Lawrence）教授。劳伦斯是一个为科学百般着迷的人，他的热情深深感染了年轻的健雄。在他的指导下，她开始接触到世界上最前沿的核物理研究。',
            year: '1937',
            event: '师从劳伦斯',
            eventColor: '#8b7db8',
            eventIcon: '🔭',
          },
          {
            title: '生平·获博士',
            content: '1940年，吴健雄获得了伯克利加州大学的博士学位。她的博士论文关于铀核的中子吸收断面，这项工作为后来的核反应堆设计提供了重要的数据。她已经在物理学界展现出了非凡的实验才能。',
            year: '1940',
            event: '获得博士学位',
            eventColor: '#c9a96e',
            eventIcon: '📜',
          },
          {
            title: '生平·遇费米',
            content: '1944年，吴健雄来到哥伦比亚大学参与曼哈顿计划。在这里，她与意大利物理学家费米共事。费米是一个天才，他的博学和深邃的思想让健雄受益匪浅。她还是第一个实验验证了费米1934年提出的β衰变理论。',
            year: '1944',
            event: '哥伦比亚时代',
            eventColor: '#c9a96e',
            eventIcon: '⚛️',
          },
          {
            title: '生平·遇良缘',
            content: '在伯克利，吴健雄遇到了她的丈夫——著名物理学家袁家骝。袁家骝也是从中国留学来的物理学家，是袁世凯的孙子。他们在对科学的执着中找到了心灵的共鸣，最终走到了一起。1942年，他们在加州举行了婚礼。',
            year: '1942',
            event: '相识爱情',
            eventColor: '#ff69b4',
            eventIcon: '💑',
          },
          {
            title: '生平·稳根基',
            content: '1958年，吴健雄正式成为哥伦比亚大学的正教授。在哥伦比亚大学的十几年里，她不仅在曼哈顿计划中解决了铀浓缩过程的关键问题，还建立了自己独立的研究生涯。1958年，她还当选为美国国家科学院院士——成为首位获此殊荣的华裔女性。',
            year: '1958',
            event: '成为教授',
            eventColor: '#20b2aa',
            eventIcon: '🏛️',
          },
        ],
      },
      {
        // 治学风骨 - 6个故事
        section: 3,
        stories: [
          {
            title: '治学·严谨',
            content: '吴健雄以其严谨的科学态度而著称。她对实验的每一个细节都精益求精，即使是最微小的误差也不放过。她常说："实验必须做到极致，数据必须准确可信。一个失误，可能毁掉多年的工作。"这种态度使她的每一个实验结果都经得起检验。',
            year: '1940',
            event: '严谨态度',
            quote: '"做一个科学家，首先要做一个诚实的人。" —— 吴健雄',
          },
          {
            title: '治学·求极致',
            content: '吴健雄的一个著名故事是，她为了确保一次实验的准确性，一个数据反复测量了47次。她的同事劝她够了，但她坚持说："这关系到最后的结论，不能有丝毫马虎。"最后，这份执着帮助她发现了一个细微但重要的规律。',
            year: '1945',
            event: '细节执着',
            quote: '"这关系到最后的结论，不能有丝毫马虎。" —— 吴健雄',
          },
          {
            title: '治学·长明灯',
            content: '吴健雄经常工作到深夜。她的实验室总是最后一盏灯亮着。有次，一个保安问她："博士，你为什么工作这么久？"她答道："科学不会按时钟下班。一旦进入实验的关键期，我必须守着。"这样的坚持让她的研究总是走在最前沿。',
            year: '1950',
            event: '执着奉献',
            quote: '"科学不会按时钟下班。" —— 吴健雄',
          },
          {
            title: '治学·守诚信',
            content: '有一次，吴健雄在一篇即将发表的论文中发现了一个小的计算错误。虽然这个错误不影响最终结论，但她还是坚持要求撤回论文进行修正。她说："学术诚实是科学家最基本的品质。"这体现了她对科学道德的坚守。',
            year: '1952',
            event: '学术诚实',
            quote: '"学术诚实是科学家最基本的品质。" —— 吴健雄',
          },
          {
            title: '治学·授业',
            content: '吴健雄也是一位严谨的教师。她的课程要求学生进行严格的推导和计算。她常常对学生说："在物理学中，主观的感觉和想象没有用武之地。只有严格的逻辑和精确的计算才是真理。"她的学生后来都成为了杰出的科学家。',
            year: '1954',
            event: '传道授业',
            quote: '"在物理学中，主观的感觉和想象没有用武之地。只有严格的逻辑和精确的计算才是真理。" —— 吴健雄',
          },
          {
            title: '治学·传国际',
            content: '吴健雄经常参加国际学术会议，呈现的实验结果总是经得起同行的严格提问。她的学术报告因为数据精确而在国际物理学界获得高度评价。她用实际行动证明了什么是真正的科研精神。',
            year: '1955',
            event: '国际认可',
            quote: '"真正的科研精神，是追求真理的勇气和坚持。" —— 吴健雄',
          },
        ],
      },
      {
        // 科研丰碑 - 6个故事
        section: 4,
        stories: [
          {
            title: '科研·宇称假说',
            content: '1956年，理论物理学家杨振宁和李政道提出了一个大胆的假设：宇称在弱相互作用中不守恒。这个假设立即引起了物理学界的巨大争议。许多科学家认为这与已有的物理常识相悖。需要一个决定性的实验来验证这个假设。',
            year: '1956',
            event: '理论提出',
            quote: '"科学的价值不在于答案，而在于敢于提出新的问题。" —— 吴健雄',
          },
          {
            title: '科研·受挑战',
            content: '1956年秋，杨振宁亲自拜访了哥伦比亚大学的吴健雄。他详细解释了宇称不守恒的理论，并问："你能做这个实验吗？"吴健雄思考了很久，最后说："这是我职业生涯中最大的挑战，我接受。"',
            year: '1956',
            event: '接受挑战',
            quote: '"这是我职业生涯中最大的挑战，我接受。" —— 吴健雄',
          },
          {
            title: '科研·克难关',
            content: '这个实验极其困难，需要在接近绝对零度的超低温下进行。需要精确的仪器和无比的耐心。许多同事认为吴健雄疯了。但她坚定地说："如果这个实验容易，就不值得做。"她与美国国家标准局的Ambler、Hayward、Hoppes和Hudson等科学家紧密合作，组成了优秀的团队。',
            year: '1956',
            event: '准备阶段',
            quote: '"如果这个实验容易，就不值得做。" —— 吴健雄',
          },
          {
            title: '科研·创技术',
            content: '吴健雄的团队改进了冷却技术，成功地将温度降到了0.01K以下。她选择使用钴-60作为实验的放射源，通过观察β衰变中电子的方向性来验证宇称。这些创新设计为最终的发现奠定了基础。',
            year: '1956',
            event: '技术创新',
            quote: '"创新是推动科学前进的力量。" —— 吴健雄',
          },
          {
            title: '科研·破宇称',
            content: '1956年11月到1957年1月，吴健雄的团队进行了数百次的实验和验证。1957年1月15日，他们最终得到了明确的结果：在弱相互作用中，宇称确实不守恒！电子在β衰变中显示出了明显的方向偏好。这个发现完全改变了物理学对自然对称性的理解。',
            year: '1957',
            event: '重大突破',
            quote: '"实验是检验真理的唯一标准。" —— 吴健雄',
          },
          {
            title: '科研·耀光芒',
            content: '1957年10月，诺贝尔物理学奖授予了杨振宁和李政道。对此，吴健雄的态度很平静。她说："科学研究的目的不是为了获奖。我们所做的就是追求真理。"她的淡然和奉献精神赢得了全世界科学家的尊敬，成为科学史上的永恒纪念。',
            year: '1957',
            event: '精神闪耀',
            quote: '"科学研究的目的不是为了获奖，而是追求真理。" —— 吴健雄',
          },
        ],
      },
      {
        // 尾声 - 6个故事
        section: 5,
        stories: [
          {
            title: '尾声·忆往昔',
            content: '进入晚年后，吴健雄仍然活跃在科学研究中。她虽然已经退休，但仍然每周都会去实验室。她不仅继续做实验，还积极传承自己的知识和经验给下一代科学家。',
            year: '1970',
            event: '继续研究',
            quote: '"只要还能动笔做研究，我就不会停下来。" —— 吴健雄',
          },
          {
            title: '尾声·她力量',
            content: '吴健雄用她的一生证明了女性在科学中可以达到最高峰。许多年轻的女性科学家都以她为榜样。她经常被邀请在教育活动中演讲，鼓励女性投身科学研究。',
            year: '1976',
            event: '女性榜样',
            quote: '"女性拥有无限的智慧和力量，她们在科学中的潜力远超世界的想象。" —— 吴健雄',
          },
          {
            title: '尾声·归故乡',
            content: '1973年9月，吴健雄终于回到了阔别37年的故乡。她和丈夫袁家骝在大陆停留了53天。当她踏上故土时，眼泪流了下来。她访问了多所大学，与教授和学生进行了学术交流。此后，她又多次回到祖国，为中国的科学发展贡献力量。',
            year: '1973',
            event: '回归故乡',
            quote: '"我始终记得自己从哪里来，也知道自己要回到哪里去。" —— 吴健雄',
          },
          {
            title: '尾声·设基金',
            content: '吴健雄和丈夫袁家骝在南京大学设立了"吴健雄袁家骝奖学金"，专门用于支持有才华的学生继续深造。她说："只有培养更多的优秀人才，科学事业才能代代相传。"',
            year: '1982',
            event: '创建奖学金',
            quote: '"只有培养更多的优秀人才，科学事业才能代代相传。" —— 吴健雄',
          },
          {
            title: '尾声·最后坚守',
            content: '吴健雄在90多岁的时候仍然在进行科学研究。她的最后一些论文涉及核反应的基础理论。她说："只要一息尚存，我就会继续研究。科学是我生命的全部意义。"这份执着让她一直工作到生命的最后一刻。',
            year: '1993',
            event: '最后坚守',
            quote: '"只要一息尚存，我就会继续研究。科学是我生命的全部意义。" —— 吴健雄',
          },
          {
            title: '尾声·永流传',
            content: '1997年2月16日，吴健雄在纽约去世，享年84岁。她留下了100多篇科学论文和永恒的科学精神。她的名字永远铭刻在物理学的历史上。她所倡导的严谨、执着、坚持的精神激励着一代又一代的科学家。她的一生证明了，追求真理的道路上没有终点。',
            year: '1997',
            event: '精神永恒',
            quote: '"追求真理的道路上没有终点。" —— 吴健雄',
          },
        ],
      },
    ],
  },

  onLoad(options) {
    const section = parseInt(options.section) || 1;
    const story = parseInt(options.story) || 0;

    // section 是 1-5 的值，需要转换为数组索引 0-4
    const sectionIndex = section - 1;
    const sectionData = this.data.storiesData[sectionIndex];

    const typeMap = ['biography', 'timeline', 'spirit', 'research', 'epilogue'];

    // 生成星空粒子
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.floor(Math.random() * 100) + '%',
        y: Math.floor(Math.random() * 100) + '%',
        delay: (Math.random() * 3).toFixed(1) + 's',
        dur: (1.5 + Math.random() * 2).toFixed(1) + 's',
        size: Math.random() > 0.7 ? 2 : 1,
      });
    }

    if (sectionData) {
      const stories = sectionData.stories;
      // 初始化已完成状态
      const completedStories = {};
      for (let s = 1; s <= 5; s++) {
        const sData = this.data.storiesData[s - 1];
        completedStories[s] = new Array(sData ? sData.stories.length : 6).fill(false);
      }

      const initData = {
        section,
        story,
        currentStoryIndex: story,
        totalStories: stories.length,
        storyTitle: this.getSectionTitle(section),
        chapterType: typeMap[sectionIndex] || 'biography',
        currentStory: stories[story],
        completedStories,
        canvasTitle: '实验示意',
        starfieldStars: stars,
      };

      // 序章：暗到亮过渡（首故事无覆盖，后续也无）
      if (typeMap[sectionIndex] === 'biography') {
        initData.chapterOverlayOpacity = 0;
      }

      // 尾声：背景阶段
      if (typeMap[sectionIndex] === 'epilogue') {
        initData.epilogueBgStage = story;
      }

      this.setData(initData);

      // 触发卡片入场动画
      this.triggerCardAnimation();

      // 初始化时间线滚动锚点
      this.setData({
        scrollIntoView: 'tl-node-' + story,
      });

      // 科研章节初始化实验 Canvas 动画
      if (typeMap[sectionIndex] === 'research') {
        setTimeout(() => this.initExperimentCanvas(story), 300);
      }
    }
  },

  // 卡片入场动画
  triggerCardAnimation() {
    this.setData({ showCardAnimation: false });
    setTimeout(() => {
      this.setData({ showCardAnimation: true });
    }, 50);
  },

  onUnload() {
    if (this._expAnimFrameId) {
      clearTimeout(this._expAnimFrameId);
      this._expAnimFrameId = null;
    }
  },

  // 时间线节点点击切换
  onTimelineNodeTap(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.currentStoryIndex || index < 0 || index >= this.data.totalStories) return;

    const sectionIndex = this.data.section - 1;
    const stories = this.data.storiesData[sectionIndex].stories;

    const updates = {
      currentStoryIndex: index,
      currentStory: stories[index],
    };

    // 序章：更新暗到亮过渡
    if (this.data.chapterType === 'biography') {
      updates.chapterOverlayOpacity = 0;
    }

    // 尾声：更新背景阶段
    if (this.data.chapterType === 'epilogue') {
      updates.epilogueBgStage = index;
    }

    // 科研：切换可视化
    if (this.data.chapterType === 'research') {
      updates.canvasTitle = this.getCanvasTitle(index);
      updates.canvasOpacity = 0;
      this.setData(updates);
      setTimeout(() => {
        this.switchVisualization(index);
        this.setData({ canvasOpacity: 1 });
      }, 400);
    } else {
      this.setData(updates);
    }

    this.triggerCardAnimation();

    // 时间线滚动到对应节点
    if (this.data.chapterType === 'timeline') {
      this.setData({ scrollIntoView: 'tl-node-' + index });
    }
  },

  getSectionTitle(section) {
    const titles = ['序章', '生平履历', '治学风骨', '科研丰碑', '尾声'];
    // section 是 1-5，需要转换为数组索引 0-4
    return titles[section - 1] || '故事';
  },

  goBack() {
    const cloudId = (this.data.section - 1) * 6 + this.data.currentStoryIndex + 1;
    const nodeId = 'n' + cloudId;

    cloudUtil.updateProgress({
      type: 'timeline',
      nodeId: nodeId,
      action: 'unlock',
    }).catch(err => {
      console.error('上报进度失败:', err);
    });

    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prePage = pages[pages.length - 2];
      if (prePage.unlockEventCloudByStory) {
        prePage.unlockEventCloudByStory(this.data.section, this.data.currentStoryIndex);
      }
    }

    wx.navigateBack({ delta: 1 });
  },

  prevStory() {
    if (this.data.currentStoryIndex > 0) {
      const newIndex = this.data.currentStoryIndex - 1;
      const sectionIndex = this.data.section - 1;
      const stories = this.data.storiesData[sectionIndex].stories;

      const updates = {
        currentStoryIndex: newIndex,
        currentStory: stories[newIndex],
      };

      // 序章：更新暗到亮过渡
      if (this.data.chapterType === 'biography') {
        updates.chapterOverlayOpacity = 0;
      }

      // 尾声：更新背景阶段
      if (this.data.chapterType === 'epilogue') {
        updates.epilogueBgStage = newIndex;
      }

      // 科研：切换可视化
      if (this.data.chapterType === 'research') {
        updates.canvasTitle = this.getCanvasTitle(newIndex);
        updates.canvasOpacity = 0;
        this.setData(updates);
        setTimeout(() => {
          this.switchVisualization(newIndex);
          this.setData({ canvasOpacity: 1 });
        }, 400);
      } else {
        this.setData(updates);
      }

      this.triggerCardAnimation();

      // 时间线滚动到对应节点
      if (this.data.chapterType === 'timeline') {
        this.setData({ scrollIntoView: 'tl-node-' + newIndex });
      }
    }
  },

  nextStory() {
    if (this.data.currentStoryIndex < this.data.totalStories - 1) {
      const newIndex = this.data.currentStoryIndex + 1;
      const sectionIndex = this.data.section - 1;
      const stories = this.data.storiesData[sectionIndex].stories;

      const updates = {
        currentStoryIndex: newIndex,
        currentStory: stories[newIndex],
      };

      // 序章：更新暗到亮过渡
      if (this.data.chapterType === 'biography') {
        updates.chapterOverlayOpacity = 0;
      }

      // 尾声：更新背景阶段
      if (this.data.chapterType === 'epilogue') {
        updates.epilogueBgStage = newIndex;
      }

      // 科研：切换可视化
      if (this.data.chapterType === 'research') {
        updates.canvasTitle = this.getCanvasTitle(newIndex);
        updates.canvasOpacity = 0;
        this.setData(updates);
        setTimeout(() => {
          this.switchVisualization(newIndex);
          this.setData({ canvasOpacity: 1 });
        }, 400);
      } else {
        this.setData(updates);
      }

      this.triggerCardAnimation();

      // 时间线滚动到对应节点
      if (this.data.chapterType === 'timeline') {
        this.setData({ scrollIntoView: 'tl-node-' + newIndex });
      }
    }
  },

  // 获取 Canvas 实验标题
  getCanvasTitle(index) {
    const titles = [
      '理论假说示意',
      '接受挑战',
      '超低温准备',
      '技术创新',
      '宇称不守恒验证',
      '精神闪耀',
    ];
    return titles[index] || '实验示意';
  },

  // 切换实验可视化（清除旧动画，启动新动画）
  switchVisualization(index) {
    if (this._expAnimFrameId) {
      clearTimeout(this._expAnimFrameId);
      this._expAnimFrameId = null;
    }
    this.initExperimentCanvas(index);
  },

  // 科研章节：6 种实验动画
  initExperimentCanvas(storyIndex) {
    const query = wx.createSelectorQuery();
    query.select('#experimentCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return;

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const sys = wx.getSystemInfoSync();
      const rpxToPx = sys.windowWidth / 750;

      const W = 750 * rpxToPx;
      const H = 270 * rpxToPx;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      const drawFuncs = [
        this.drawTheoryHypothesis,
        this.drawAcceptChallenge,
        this.drawUltraColdPrep,
        this.drawTechInnovation,
        this.drawParityViolation,
        this.drawSpiritShine,
      ];

      const drawFunc = drawFuncs[storyIndex] || drawFuncs[0];
      drawFunc.call(this, ctx, W, H, rpxToPx);
    });
  },

  // 动画 0：理论假说 — 左右对称波形 → 逐渐破缺
  drawTheoryHypothesis(ctx, W, H, r) {
    let frame = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, W, H);

      const symmetry = 1 - Math.min(frame / 200, 0.7);
      const cy = H * 0.5;

      // 左侧波（镜像）
      ctx.beginPath();
      ctx.strokeStyle = '#64c8ff';
      ctx.lineWidth = 2;
      for (let x = 0; x < W * 0.45; x++) {
        const y = cy + Math.sin((x + frame * 2) * 0.03) * 40 * Math.sin(x / (W * 0.45) * Math.PI);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 右侧波（逐渐不对称）
      ctx.beginPath();
      ctx.strokeStyle = '#c9a96e';
      ctx.lineWidth = 2;
      for (let x = W * 0.55; x < W; x++) {
        const y = cy + Math.sin((x + frame * 2 * symmetry) * 0.03) * 40 * symmetry * Math.sin((x - W * 0.55) / (W * 0.45) * Math.PI);
        x === W * 0.55 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 中心虚线
      ctx.setLineDash([4 * r, 4 * r]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 20 * r);
      ctx.lineTo(W * 0.5, H - 20 * r);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `bold ${13 * r}px sans-serif`;
      ctx.fillStyle = '#64c8ff';
      ctx.textAlign = 'center';
      ctx.fillText('镜像对称', W * 0.25, H - 10 * r);
      ctx.fillStyle = '#c9a96e';
      ctx.fillText(symmetry < 0.5 ? '对称破缺!' : '镜像对称', W * 0.75, H - 10 * r);

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 动画 1：接受挑战 — 人物对话示意
  drawAcceptChallenge(ctx, W, H, r) {
    let frame = 0;
    let running = true;
    const particles = [];

    const drawPerson = (x, y, color) => {
      // 头
      ctx.beginPath();
      ctx.arc(x, y - 40 * r, 12 * r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // 身体
      ctx.beginPath();
      ctx.moveTo(x, y - 28 * r);
      ctx.lineTo(x, y + 10 * r);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 手臂
      ctx.beginPath();
      ctx.moveTo(x - 15 * r, y - 10 * r);
      ctx.lineTo(x + 15 * r, y - 10 * r);
      ctx.stroke();
    };

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, W, H);

      drawPerson(W * 0.3, H * 0.7, '#64c8ff');
      drawPerson(W * 0.7, H * 0.7, '#c9a96e');

      // 对话框
      const alpha1 = Math.sin(frame * 0.03) * 0.3 + 0.7;
      ctx.font = `${11 * r}px sans-serif`;
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha1})`;
      ctx.textAlign = 'center';
      ctx.fillText('"你能做这个实验吗？"', W * 0.3, H * 0.25);

      const alpha2 = Math.sin(frame * 0.03 + Math.PI) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(201, 169, 110, ${alpha2})`;
      ctx.fillText('"这是我最大的挑战"', W * 0.7, H * 0.25);

      // 连接粒子
      if (frame % 4 === 0) {
        particles.push({ x: W * 0.35, y: H * 0.5, vx: 1.5, vy: (Math.random() - 0.5), life: 1 });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.life})`;
        ctx.fill();
      }

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 动画 2：超低温准备 — 温度计从 300K → 0.01K
  drawUltraColdPrep(ctx, W, H, r) {
    let frame = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, W, H);

      // 温度从 300K 降到 0.01K
      const tempProgress = Math.min(frame / 200, 1);
      const temp = 300 * Math.pow(1 - tempProgress, 2);

      // 温度计管
      const barH = H * 0.5;
      const barW = 20 * r;
      const barX = W * 0.3;
      const barY = H * 0.2;

      // 管外框
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(barX - barW / 2, barY, barW, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - barW / 2, barY, barW, barH);

      // 水银柱（随温度降低而缩短）
      const fillH = barH * (1 - tempProgress * 0.85);
      const grad = ctx.createLinearGradient(0, barY + barH - fillH, 0, barY + barH);
      grad.addColorStop(0, temp < 1 ? '#64c8ff' : '#ff6969');
      grad.addColorStop(1, temp < 1 ? '#4a88c8' : '#cc3333');
      ctx.fillStyle = grad;
      ctx.fillRect(barX - barW / 2 + 3, barY + barH - fillH, barW - 6, fillH);

      // 温度文字
      ctx.font = `bold ${18 * r}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = temp < 1 ? '#64c8ff' : '#ff6969';
      ctx.fillText(temp < 1 ? '0.01 K' : temp.toFixed(0) + ' K', barX, barY - 10 * r);

      // 冷却管线闪烁
      if (frame > 50) {
        const pipeAlpha = Math.sin(frame * 0.1) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(100, 200, 255, ${pipeAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W * 0.4, H * 0.5);
        ctx.lineTo(W * 0.8, H * 0.5);
        ctx.stroke();

        // 管线上的粒子流动
        for (let i = 0; i < 5; i++) {
          const px = W * 0.4 + ((frame * 3 + i * 40) % (W * 0.4));
          ctx.beginPath();
          ctx.arc(px, H * 0.5 + Math.sin(px * 0.05) * 3, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + pipeAlpha * 0.4})`;
          ctx.fill();
        }
      }

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      ctx.font = `${11 * r}px sans-serif`;
      ctx.fillStyle = 'rgba(240, 230, 211, 0.4)';
      ctx.fillText('冷却系统降温中...', W / 2, H - 8 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 动画 3：技术创新 — Co-60 原子结构 + 冷却装置
  drawTechInnovation(ctx, W, H, r) {
    let frame = 0;
    let running = true;

    const drawAtom = (x, y, radius, color) => {
      // 原子核
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((i * Math.PI) / 3 + frame * 0.01);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const angle = frame * 0.03 + i * 2;
        const ex = Math.cos(angle) * radius;
        const ey = Math.sin(angle) * radius * 0.4;
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      }
    };

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, W, H);

      // 左侧 Co-60 原子
      drawAtom(W * 0.3, H * 0.5, 50 * r, '#64c8ff');
      ctx.font = `${11 * r}px sans-serif`;
      ctx.fillStyle = '#64c8ff';
      ctx.textAlign = 'center';
      ctx.fillText('Co-60', W * 0.3, H * 0.85);

      // 右侧冷却装置（圆柱）
      const cylX = W * 0.7;
      const cylR = 35 * r;
      ctx.beginPath();
      ctx.ellipse(cylX, H * 0.5, cylR, cylR * 1.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + Math.sin(frame * 0.05) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 内部螺旋线
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.25)';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 6; a += 0.1) {
        const spiralR = a / (Math.PI * 6) * cylR * 0.8;
        const sx = cylX + Math.cos(a + frame * 0.02) * spiralR;
        const sy = H * 0.5 + Math.sin(a + frame * 0.02) * spiralR * 1.2;
        a === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.font = `${11 * r}px sans-serif`;
      ctx.fillStyle = '#c9a96e';
      ctx.fillText('低温冷却装置', cylX, H * 0.85);

      // 连接箭头
      ctx.beginPath();
      ctx.moveTo(W * 0.4, H * 0.5);
      ctx.lineTo(W * 0.55, H * 0.5);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const arrowAngle = 0;
      ctx.beginPath();
      ctx.moveTo(W * 0.55, H * 0.5);
      ctx.lineTo(W * 0.55 - 8 * r, H * 0.5 - 5 * r);
      ctx.lineTo(W * 0.55 - 8 * r, H * 0.5 + 5 * r);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.fill();

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 动画 4：宇称不守恒验证 — β粒子不对称发射 + 柱状对比
  drawParityViolation(ctx, W, H, r) {
    let frame = 0;
    let running = true;
    const particles = [];
    let upCount = 0;
    let downCount = 0;

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, W, H);

      // 中心源（Co-60）
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.45, 12 * r, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a96e';
      ctx.fill();
      ctx.font = `${10 * r}px sans-serif`;
      ctx.fillStyle = '#f0ede6';
      ctx.textAlign = 'center';
      ctx.fillText('Co-60', W * 0.5, H * 0.45 + 4 * r);

      // 不对称粒子发射（向下多于向上）
      if (frame % 2 === 0) {
        const angleDown = Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const angleUp = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;

        particles.push({ x: W * 0.5, y: H * 0.45, angle: angleDown, dist: 0, speed: 1 + Math.random(), dir: 'down' });
        if (Math.random() > 0.4) {
          particles.push({ x: W * 0.5, y: H * 0.45, angle: angleUp, dist: 0, speed: 0.8 + Math.random(), dir: 'up' });
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.dist += p.speed;
        if (p.dist > 80) { particles.splice(i, 1); continue; }
        const px = p.x + Math.cos(p.angle) * p.dist;
        const py = p.y + Math.sin(p.angle) * p.dist;
        const alpha = 1 - p.dist / 80;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.fill();
      }

      // 底部柱状对比图
      const barW = 30 * r;
      const barMaxH = H * 0.2;
      const barBaseY = H * 0.85;

      // 上方计数
      upCount = Math.floor(frame * 0.3);
      downCount = Math.floor(frame * 0.8);

      ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.fillRect(W * 0.35 - barW / 2, barBaseY - Math.min(upCount, barMaxH) / barMaxH * barMaxH, barW, Math.min(upCount, barMaxH) / barMaxH * barMaxH);

      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.fillRect(W * 0.65 - barW / 2, barBaseY - Math.min(downCount, barMaxH) / barMaxH * barMaxH, barW, Math.min(downCount, barMaxH) / barMaxH * barMaxH);

      ctx.font = `${10 * r}px sans-serif`;
      ctx.fillStyle = '#64c8ff';
      ctx.fillText('↑ 上', W * 0.35, barBaseY + 14 * r);
      ctx.fillStyle = '#ff6464';
      ctx.fillText('↓ 下', W * 0.65, barBaseY + 14 * r);

      // 不等号
      if (frame > 60) {
        ctx.font = `bold ${16 * r}px sans-serif`;
        ctx.fillStyle = '#FFD700';
        ctx.fillText('上 ≠ 下', W / 2, barBaseY + 12 * r);
      }

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      ctx.font = `${10 * r}px sans-serif`;
      ctx.fillStyle = 'rgba(240, 230, 211, 0.4)';
      ctx.fillText('电子发射方向呈现不对称性', W / 2, H - 4 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 动画 5：精神闪耀 — 粒子汇聚成光效
  drawSpiritShine(ctx, W, H, r) {
    let frame = 0;
    let running = true;
    const particles = [];

    const animate = () => {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, W, H);

      // 持续生成粒子（从四边向中心汇聚）
      if (frame % 2 === 0) {
        const side = Math.floor(Math.random() * 4);
        let sx, sy;
        if (side === 0) { sx = Math.random() * W; sy = 0; }
        else if (side === 1) { sx = Math.random() * W; sy = H; }
        else if (side === 2) { sx = 0; sy = Math.random() * H; }
        else { sx = W; sy = Math.random() * H; }

        particles.push({
          x: sx, y: sy,
          tx: W / 2, ty: H * 0.45,
          life: 1,
          color: Math.random() > 0.5 ? '#c9a96e' : '#64c8ff',
          speed: 0.5 + Math.random() * 1,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += (p.tx - p.x) * 0.02 * p.speed;
        p.y += (p.ty - p.y) * 0.02 * p.speed;
        p.life -= 0.008;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#c9a96e'
          ? `rgba(201, 169, 110, ${p.life})`
          : `rgba(100, 200, 255, ${p.life})`;
        ctx.fill();
      }

      // 中心光晕
      const glowR = 30 * r + Math.sin(frame * 0.05) * 10 * r;
      const grad = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, glowR);
      grad.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.45, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.font = `bold ${14 * r}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(this.getCanvasTitle(this.data.currentStoryIndex), W / 2, 20 * r);

      ctx.font = `${11 * r}px sans-serif`;
      ctx.fillStyle = 'rgba(240, 230, 211, 0.4)';
      ctx.fillText('追求真理，永无止境', W / 2, H - 8 * r);

      this._expAnimFrameId = setTimeout(animate, 16);
    };

    animate();
  },

  // 科研章节：初始化入口（兼容 onLoad 调用）
  markStoryComplete() {
    const cloudId = (this.data.section - 1) * 6 + this.data.currentStoryIndex + 1;
    const nodeId = 'n' + cloudId;

    cloudUtil.updateProgress({
      type: 'timeline',
      nodeId: nodeId,
      action: 'unlock',
    }).catch(err => {
      console.error('上报进度失败:', err);
    });

    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prePage = pages[pages.length - 2];
      if (prePage.unlockEventCloudByStory) {
        prePage.unlockEventCloudByStory(this.data.section, this.data.currentStoryIndex);
      }
    }

    // 标记当前故事为已完成
    const completedStories = { ...this.data.completedStories };
    const section = this.data.section;
    if (completedStories[section]) {
      completedStories[section] = [...completedStories[section]];
      completedStories[section][this.data.currentStoryIndex] = true;
    }

    this.setData({
      completedStories,
      showCompleteAnimation: true,
    });

    setTimeout(() => {
      this.setData({
        showCompleteAnimation: false,
      });
    }, 2000);
  },

  // ========== 数字人相关方法 ==========

  // 根据当前故事内容生成针对性预设问题
  generateDhPresets() {
    const story = this.data.currentStory;
    if (!story || !story.content) return [];

    const title = story.title || '';
    const content = story.content || '';
    const section = this.data.section;

    // 基于故事内容关键词生成预设问题
    const presets = [];

    // 通用问题1：关于当前故事的具体细节
    presets.push({
      id: `dh_${section}_${this.data.currentStoryIndex}_1`,
      question: `能多讲讲${title.replace(/^[^·]+·/, '')}的故事吗？`
    });

    // 基于内容关键词生成问题2
    if (content.includes('实验') || content.includes('研究') || content.includes('发现')) {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_2`,
        question: '这个实验过程中遇到过什么困难？'
      });
    } else if (content.includes('老师') || content.includes('教授') || content.includes('恩师')) {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_2`,
        question: '这位老师对您的影响有多大？'
      });
    } else if (content.includes('父亲') || content.includes('母亲') || content.includes('家人') || content.includes('家庭')) {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_2`,
        question: '家人对您的选择有什么看法？'
      });
    } else {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_2`,
        question: '这段经历对您后来有什么影响？'
      });
    }

    // 基于内容关键词生成问题3
    if (content.includes('美国') || content.includes('留学') || content.includes('伯克利')) {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_3`,
        question: '初到美国时适应得怎么样？'
      });
    } else if (content.includes('物理') || content.includes('科学') || content.includes('核')) {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_3`,
        question: '为什么对物理如此着迷？'
      });
    } else {
      presets.push({
        id: `dh_${section}_${this.data.currentStoryIndex}_3`,
        question: '您当时的心情是怎样的？'
      });
    }

    return presets;
  },

  // 切换数字人面板
  toggleDigitalHuman() {
    const show = !this.data.showDhPanel;
    if (show) {
      // 打开时生成针对性预设问题
      const presets = this.generateDhPresets();
      const story = this.data.currentStory;
      this.setData({
        showDhPanel: show,
        dhPresets: presets,
        dhWelcome: `你正在阅读「${story.title}」。关于这段经历，你有什么想问的吗？`,
        dhMessages: [],
        dhChatting: false,
        dhInputValue: '',
        dhMsgCounter: 0,
      });
    } else {
      // 关闭时停止播放
      const dh = this.selectComponent('#digitalHumanStory');
      if (dh) dh.stopSpeaking();
      this.setData({ showDhPanel: false });
    }
  },

  // 输入框
  onDhInput(e) {
    this.setData({ dhInputValue: e.detail.value });
  },

  // 发送自定义消息
  sendDhMessage() {
    const question = this.data.dhInputValue.trim();
    if (!question || this.data.dhChatting) return;

    const msgId = ++this.data.dhMsgCounter;
    this.setData({
      dhMessages: [...this.data.dhMessages, { id: msgId, role: 'user', text: question }],
      dhInputValue: '',
      dhChatting: true,
      dhScrollId: `dh-msg-${msgId}`,
    });

    // 调用数字人组件
    const dh = this.selectComponent('#digitalHumanStory');
    if (dh) {
      dh.ask(question);
    } else {
      // 备用：走云函数
      const loadingId = ++this.data.dhMsgCounter;
      this.setData({
        dhMessages: [...this.data.dhMessages, { id: loadingId, role: 'ai', loading: true }],
      });
      wx.cloud.callFunction({
        name: 'askDigitalHuman',
        data: { action: 'chat', question }
      }).then(res => {
        if (res.result.code === 0) {
          const msgs = this.data.dhMessages.map(m =>
            m.id === loadingId ? { ...m, loading: false, text: res.result.data.text } : m
          );
          this.setData({ dhMessages: msgs, dhChatting: false });
        }
      }).catch(() => {
        const msgs = this.data.dhMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: '抱歉，我现在说不上来。' } : m
        );
        this.setData({ dhMessages: msgs, dhChatting: false });
      });
    }
  },

  // 发送预设问题
  async sendDhPreset(e) {
    const presetId = e.currentTarget.dataset.id;
    const question = e.currentTarget.dataset.question;
    if (!question || this.data.dhChatting) return;

    const msgId = ++this.data.dhMsgCounter;
    this.setData({
      dhMessages: [...this.data.dhMessages, { id: msgId, role: 'user', text: question }],
      dhChatting: true,
      dhScrollId: `dh-msg-${msgId}`,
    });

    // 先尝试预存
    try {
      const res = await wx.cloud.callFunction({
        name: 'presetManager',
        data: { action: 'get', presetId }
      });

      if (res.result.code === 0 && res.result.data && res.result.data.text) {
        const aiMsgId = ++this.data.dhMsgCounter;
        this.setData({
          dhMessages: [...this.data.dhMessages, {
            id: aiMsgId, role: 'ai', text: res.result.data.text,
            audioUrl: res.result.data.audioUrl || null, audioPlaying: false
          }],
          dhChatting: false,
          dhScrollId: `dh-msg-${aiMsgId}`,
        });

        if (res.result.data.audioUrl) {
          this.playDhAudioUrl(res.result.data.audioUrl, aiMsgId);
        }
        return;
      }
    } catch (e) {
      // 预存未找到
    }

    // 走实时生成
    const dh = this.selectComponent('#digitalHumanStory');
    if (dh) {
      dh.ask(question);
    } else {
      const loadingId = ++this.data.dhMsgCounter;
      this.setData({
        dhMessages: [...this.data.dhMessages, { id: loadingId, role: 'ai', loading: true }],
      });
      wx.cloud.callFunction({
        name: 'askDigitalHuman',
        data: { action: 'chat', question }
      }).then(res => {
        if (res.result.code === 0) {
          const msgs = this.data.dhMessages.map(m =>
            m.id === loadingId ? { ...m, loading: false, text: res.result.data.text } : m
          );
          this.setData({ dhMessages: msgs, dhChatting: false });
        }
      }).catch(() => {
        const msgs = this.data.dhMessages.map(m =>
          m.id === loadingId ? { ...m, loading: false, text: '抱歉，我现在说不上来。' } : m
        );
        this.setData({ dhMessages: msgs, dhChatting: false });
      });
    }
  },

  // 数字人组件事件
  onDhMessage(e) {
    const { answer } = e.detail;
    const msgs = this.data.dhMessages.map(m =>
      m.loading ? { ...m, loading: false, text: answer, role: 'ai' } : m
    );
    this.setData({ dhMessages: msgs, dhChatting: false });
  },

  onDhSpeakEnd() {},

  onDhError(e) {
    console.error('[story-dh] 错误:', e.detail);
    this.setData({ dhChatting: false });
  },

  // 播放音频（驱动嘴型）
  playDhAudio(e) {
    const audioUrl = e.currentTarget.dataset.audiourl;
    const msgId = e.currentTarget.dataset.msgid;
    this.playDhAudioUrl(audioUrl, msgId);
  },

  playDhAudioUrl(audioUrl, msgId) {
    const dh = this.selectComponent('#digitalHumanStory');
    if (dh && audioUrl) {
      dh._playAudio(audioUrl);
    }
    const msgs = this.data.dhMessages.map(msg => {
      if (msg.id === msgId) return { ...msg, audioPlaying: true };
      return { ...msg, audioPlaying: false };
    });
    this.setData({ dhMessages: msgs });
  },

  stopDhAudio() {
    const dh = this.selectComponent('#digitalHumanStory');
    if (dh) dh.stopSpeaking();
    const msgs = this.data.dhMessages.map(msg => ({ ...msg, audioPlaying: false }));
    this.setData({ dhMessages: msgs });
  },
});
