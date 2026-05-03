const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    section: 0,
    story: 1,
    currentStoryIndex: 0,
    totalStories: 0,
    storyTitle: '',
    showCompleteAnimation: false,
    currentStory: {
      title: '',
      content: '',
      year: '',
      event: '',
      image: '',
    },

    // 故事数据库 - 精简版，每章5-6个故事，共30个故事
    storiesData: [
      {
        // 序章 - 6个故事
        section: 1,
        stories: [
          {
            title: '一位伟大的科学家诞生',
            content: '1912年5月31日，吴健雄出生于浙江浦江县通济埠吴家村。她的家庭是一个教育世家，父亲吴仲裔是一位教育家和实业家，母亲陈壁清是一位开放思想的女性。在这样的家庭环境中，年幼的健雄展现出了对知识的渴望和对未来的憧憬。',
            year: '1912',
            event: '出生',
          },
          {
            title: '家庭的支持',
            content: '当健雄表达想要进入大学学习物理时，她的家人毫不犹豫地支持了她。父亲说："性别不应该成为追求梦想的障碍。"这样的支持给了她无限的勇气和动力，为她的科学梦奠定了基础。',
            year: '1928',
            event: '家庭鼓励',
          },
          {
            title: '大学的抉择',
            content: '1932年，高中毕业的吴健雄面临着人生的重要选择。许多好的大学对她敞开了大门，但她最终选择了浙江大学物理系——因为她相信这里有能够引导她走向科学之巅的导师。',
            year: '1932',
            event: '进入浙大',
          },
          {
            title: '师生相识',
            content: '在浙大，吴健雄遇到了她的恩师——著名物理学家王淦昌教授。王教授立即被这位学生的才华和热情所吸引。他对健雄说："要做一个顶尖的物理学家，光有才华是不够的，还需要无比的热情和坚持。"',
            year: '1932',
            event: '恩师指引',
          },
          {
            title: '科研初心',
            content: '在一次与王教授的谈话中，教授问："你为什么想要成为一个科学家？"年轻的健雄回答："因为科学能够帮助人类理解这个世界，理解生命的本质。这是人类最高尚的追求。"这份初心指引了她整个人生。',
            year: '1934',
            event: '初心明确',
          },
          {
            title: '赴美留学启程',
            content: '1936年8月，吴健雄登上了开往美国的轮船。她获得了中国教育基金会的留学奖学金。在船舱里，她看着渐渐远去的故乡，心里装满了对知识的渴望。她暗下决心：一定要在世界舞台上为中国科学争得一席之地。',
            year: '1936',
            event: '启程美国',
          },
        ],
      },
      {
        // 生平履历 - 6个故事
        section: 2,
        stories: [
          {
            title: '初到美国',
            content: '1936年底，吴健雄抵达美国。这是她第一次离开故乡，一切都陌生而新奇。美国的科学教育方式与中国截然不同，但她很快就适应了这里的节奏。加州大学伯克利分校的校园吸引了她所有的注意力。',
            year: '1936',
            event: '初到美国',
          },
          {
            title: '伯克利的日子',
            content: '在伯克利，吴健雄师从著名的能谱学家劳伦斯（Ernest O. Lawrence）教授。劳伦斯是一个为科学百般着迷的人，他的热情深深感染了年轻的健雄。在他的指导下，她开始接触到世界上最前沿的核物理研究。',
            year: '1937',
            event: '师从劳伦斯',
          },
          {
            title: '获得博士学位',
            content: '1940年，吴健雄获得了伯克利加州大学的博士学位。她的博士论文关于铀核的中子吸收断面，这项工作为后来的核反应堆设计提供了重要的数据。她已经在物理学界展现出了非凡的实验才能。',
            year: '1940',
            event: '获得博士学位',
          },
          {
            title: '芝加哥与费米',
            content: '1942年，吴健雄从伯克利转移到了芝加哥大学。在这里，她遇到了意大利物理学家费米。费米是一个天才，他的博学和深邃的思想让健雄受益匪浅。在他的实验室里，她参与了关键的核物理实验。',
            year: '1942',
            event: '芝加哥时代',
          },
          {
            title: '异国他乡的爱情',
            content: '在芝加哥，吴健雄遇到了她的丈夫——著名物理学家卢瑞钰。卢瑞钰也是从中国留学来的物理科学家。他们在对科学的执着中找到了心灵的共鸣，最终走到了一起。1945年，他们举行了婚礼。',
            year: '1944',
            event: '相识爱情',
          },
          {
            title: '美国生活的稳定',
            content: '战争结束后，美国的核研究进入了一个新的阶段。吴健雄在哥伦比亚大学获得了一个研究员的职位。虽然不是教授，但这给了她充分的研究自由。在这里，她的科研事业真正起飞了，为即将到来的重大发现做好了准备。',
            year: '1947',
            event: '哥伦比亚职位',
          },
        ],
      },
      {
        // 治学风骨 - 6个故事
        section: 3,
        stories: [
          {
            title: '严谨的科学态度',
            content: '吴健雄以其严谨的科学态度而著称。她对实验的每一个细节都精益求精，即使是最微小的误差也不放过。她常说："实验必须做到极致，数据必须准确可信。一个失误，可能毁掉多年的工作。"这种态度使她的每一个实验结果都经得起检验。',
            year: '1940',
            event: '严谨态度',
          },
          {
            title: '对细节的执着',
            content: '吴健雄的一个著名故事是，她为了确保一次实验的准确性，一个数据反复测量了47次。她的同事劝她够了，但她坚持说："这关系到最后的结论，不能有丝毫马虎。"最后，这份执着帮助她发现了一个细微但重要的规律。',
            year: '1945',
            event: '细节执着',
          },
          {
            title: '实验室的长夜',
            content: '吴健雄经常工作到深夜。她的实验室总是最后一盏灯亮着。有次，一个保安问她："博士，你为什么工作这么久？"她答道："科学不会按时钟下班。一旦进入实验的关键期，我必须守着。"这样的坚持让她的研究总是走在最前沿。',
            year: '1950',
            event: '执着奉献',
          },
          {
            title: '学术诚实',
            content: '有一次，吴健雄在一篇即将发表的论文中发现了一个小的计算错误。虽然这个错误不影响最终结论，但她还是坚持要求撤回论文进行修正。她说："学术诚实是科学家最基本的品质。"这体现了她对科学道德的坚守。',
            year: '1952',
            event: '学术诚实',
          },
          {
            title: '教学与传承',
            content: '吴健雄也是一位严谨的教师。她的课程要求学生进行严格的推导和计算。她常常对学生说："在物理学中，主观的感觉和想象没有用武之地。只有严格的逻辑和精确的计算才是真理。"她的学生后来都成为了杰出的科学家。',
            year: '1954',
            event: '传道授业',
          },
          {
            title: '国际学术交流',
            content: '吴健雄经常参加国际学术会议，呈现的实验结果总是经得起同行的严格提问。她的学术报告因为数据精确而在国际物理学界获得高度评价。她用实际行动证明了什么是真正的科研精神。',
            year: '1955',
            event: '国际认可',
          },
        ],
      },
      {
        // 科研丰碑 - 6个故事
        section: 4,
        stories: [
          {
            title: '宇称不守恒的理论提出',
            content: '1956年，理论物理学家杨振宁和李政道提出了一个大胆的假设：宇称在弱相互作用中不守恒。这个假设立即引起了物理学界的巨大争议。许多科学家认为这与已有的物理常识相悖。需要一个决定性的实验来验证这个假设。',
            year: '1956',
            event: '理论提出',
          },
          {
            title: '吴健雄接受挑战',
            content: '1956年秋，杨振宁亲自拜访了哥伦比亚大学的吴健雄。他详细解释了宇称不守恒的理论，并问："你能做这个实验吗？"吴健雄思考了很久，最后说："这是我职业生涯中最大的挑战，我接受。"',
            year: '1956',
            event: '接受挑战',
          },
          {
            title: '极端实验的准备',
            content: '这个实验极其困难，需要在接近绝对零度的超低温下进行。需要精确的仪器和无比的耐心。许多同事认为吴健雄疯了。但她坚定地说："如果这个实验容易，就不值得做。"她聚集了包括徐建铭、何作光等在内的优秀团队。',
            year: '1956',
            event: '准备阶段',
          },
          {
            title: '技术突破与实验设计',
            content: '吴健雄的团队改进了冷却技术，成功地将温度降到了0.01K以下。她选择使用钴-60作为实验的放射源，通过观察β衰变中电子的方向性来验证宇称。这些创新设计为最终的发现奠定了基础。',
            year: '1956',
            event: '技术创新',
          },
          {
            title: '历史性的实验',
            content: '1956年11月到1957年1月，吴健雄的团队进行了数百次的实验和验证。1957年1月15日，他们最终得到了明确的结果：在弱相互作用中，宇称确实不守恒！电子在β衰变中显示出了明显的方向偏好。这个发现完全改变了物理学对自然对称性的理解。',
            year: '1957',
            event: '重大突破',
          },
          {
            title: '科学精神的闪耀',
            content: '1957年10月，诺贝尔物理学奖授予了杨振宁和李政道。对此，吴健雄的态度很平静。她说："科学研究的目的不是为了获奖。我们所做的就是追求真理。"她的淡然和奉献精神赢得了全世界科学家的尊敬，成为科学史上的永恒纪念。',
            year: '1957',
            event: '精神闪耀',
          },
        ],
      },
      {
        // 尾声 - 6个故事
        section: 5,
        stories: [
          {
            title: '晚年的回顾',
            content: '进入晚年后，吴健雄仍然活跃在科学研究中。她虽然已经退休，但仍然每周都会去实验室。她不仅继续做实验，还积极传承自己的知识和经验给下一代科学家。',
            year: '1970',
            event: '继续研究',
          },
          {
            title: '女性科学家的榜样',
            content: '吴健雄用她的一生证明了女性在科学中可以达到最高峰。许多年轻的女性科学家都以她为榜样。她经常被邀请在教育活动中演讲，鼓励女性投身科学研究。',
            year: '1976',
            event: '女性榜样',
          },
          {
            title: '访问中国',
            content: '1980年，吴健雄终于回到了阔别几十年的故乡。当她踏上浙江的土地时，眼泪流了下来。她访问了浙江大学，与教授和学生进行了学术交流。故乡人民隆重欢迎了这位杰出的女儿。',
            year: '1980',
            event: '回归故乡',
          },
          {
            title: '建立奖学金',
            content: '吴健雄在浙江大学建立了以她名字命名的奖学金。这个奖学金专门用于支持有才华的女性学生继续深造。她说："只有培养更多的女性科学家，女性在科学中的贡献才会被世人认可。"',
            year: '1982',
            event: '创建奖学金',
          },
          {
            title: '最后的时光',
            content: '吴健雄在90多岁的时候仍然在进行科学研究。她的最后一些论文涉及核反应的基础理论。她说："只要一息尚存，我就会继续研究。科学是我生命的全部意义。"这份执着让她一直工作到生命的最后一刻。',
            year: '1993',
            event: '最后坚守',
          },
          {
            title: '永恒的遗产',
            content: '1997年1月16日，吴健雄在纽约去世，享年84岁。她留下了300多篇科学论文和永恒的科学精神。她的名字永远铭刻在物理学的历史上。她所倡导的严谨、执着、坚持的精神激励着一代又一代的科学家。她的一生证明了，追求真理的道路上没有终点。',
            year: '1997',
            event: '精神永恒',
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
    
    if (sectionData) {
      const stories = sectionData.stories;
      this.setData({
        section,
        story,
        currentStoryIndex: story,
        totalStories: stories.length,
        storyTitle: this.getSectionTitle(section),
        currentStory: stories[story],
      });
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
      this.setData({
        currentStoryIndex: newIndex,
        currentStory: stories[newIndex],
      });
    }
  },

  nextStory() {
    if (this.data.currentStoryIndex < this.data.totalStories - 1) {
      const newIndex = this.data.currentStoryIndex + 1;
      const sectionIndex = this.data.section - 1;
      const stories = this.data.storiesData[sectionIndex].stories;
      this.setData({
        currentStoryIndex: newIndex,
        currentStory: stories[newIndex],
      });
    }
  },

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

    this.setData({
      showCompleteAnimation: true,
    });

    setTimeout(() => {
      this.setData({
        showCompleteAnimation: false,
      });
    }, 2000);
  },
});
