const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    title: '',
    author: '',
    pages: [],
    current: 0,
    // 评分
    workId: '',
    userScore: 0,
    userStars: ['empty', 'empty', 'empty', 'empty', 'empty'],
    avgScore: 0,
    avgStars: ['empty', 'empty', 'empty', 'empty', 'empty'],
    displayScore: '0.0',
    ratingCount: 0,
    hasRated: false,
  },

  onLoad(options) {
    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }
    if (options.author) {
      this.setData({ author: decodeURIComponent(options.author) });
    }
    if (options.ratingWorkId) {
      this.setData({ workId: options.ratingWorkId });
    }
    if (options.pages) {
      try {
        const pages = JSON.parse(decodeURIComponent(options.pages));
        this.setData({ pages });
        this.loadPageUrls(pages);
      } catch (e) {
        console.error('解析漫画数据失败:', e);
      }
    }

    // 加载评分数据
    if (this.data.workId) {
      this.loadRatings(this.data.workId);
    }
  },

  loadPageUrls(pageList) {
    const batchSize = 5;
    const loadBatch = (index) => {
      if (index >= pageList.length) return;
      const batch = pageList.slice(index, index + batchSize);
      Promise.all(batch.map(item => {
        if (!item.workId) return Promise.resolve(null);
        return cloudUtil.getWorkDetail({ workId: item.workId })
          .then(res => {
            if (res.code === 0 && res.data.fileUrl) {
              return { workId: item.workId, fileUrl: res.data.fileUrl };
            }
            return null;
          }).catch(() => null);
      })).then(results => {
        const updated = this.data.pages.map(p => {
          const found = results.find(r => r && r.workId === p.workId);
          if (found) return { ...p, fileUrl: found.fileUrl };
          return p;
        });
        this.setData({ pages: updated });
        loadBatch(index + batchSize);
      });
    };
    loadBatch(0);
  },

  onSwiperChange(e) {
    this.setData({ current: e.detail.current });
  },

  // 加载评分数据
  loadRatings(workId) {
    cloudUtil.getWorkRatings({ workIds: [workId] }).then(res => {
      if (res.code === 0 && res.data && res.data.length > 0) {
        const avgScore = res.data[0].avgScore;
        const ratingCount = res.data[0].ratingCount;
        const userScore = res.data[0].userScore || 0;
        if (userScore > 0) {
          this.setData({ userScore, hasRated: true });
        }
        this.updateStarDisplay(avgScore, ratingCount);
      }
    }).catch(() => {});
  },

  updateStarDisplay(avgScore, ratingCount) {
    // 小星星：总平均评分（支持半星）
    const avgStars = [];
    for (let i = 0; i < 5; i++) {
      const starValue = avgScore - i;
      let type = 'empty';
      if (starValue >= 0.75) {
        type = 'full';
      } else if (starValue >= 0.25) {
        type = 'half';
      }
      avgStars.push(type);
    }
    // 大星星：用户自己的评分（只有满星/空星）
    const userStars = [];
    for (let i = 0; i < 5; i++) {
      userStars.push(i < this.data.userScore ? 'full' : 'empty');
    }
    this.setData({
      avgScore,
      ratingCount,
      avgStars,
      userStars,
      displayScore: avgScore > 0 ? avgScore.toFixed(1) : '0.0',
    });
  },

  // 点击星星评分
  onStarTap(e) {
    const score = parseInt(e.currentTarget.dataset.score);
    if (!score || !this.data.workId) return;

    cloudUtil.submitRating({ workId: this.data.workId, score }).then(res => {
      if (res.code === 0 && res.data) {
        const avgScore = res.data.avgScore;
        const ratingCount = res.data.ratingCount;
        const userScore = score;
        const userStars = [];
        for (let i = 0; i < 5; i++) {
          userStars.push(i < userScore ? 'full' : 'empty');
        }
        const wasRated = this.data.hasRated;
        // 更新小星星（总评分）
        this.updateStarDisplay(avgScore, ratingCount);
        // 更新大星星（用户评分）
        this.setData({ userScore, userStars, hasRated: true });
        const tip = wasRated ? '评分已更新' : '评分成功';
        wx.showToast({ title: tip, icon: 'success', duration: 1500 });
      } else {
        wx.showToast({ title: '评分失败', icon: 'none' });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },
});
