const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    title: '',
    author: '',
    category: '',
    workId: '',
    mediaUrl: '',
    loading: true,
    imageOrientation: 'landscape',
    // 评分
    userScore: 0,
    userStars: ['empty', 'empty', 'empty', 'empty', 'empty'],
    avgScore: 0,
    avgStars: ['empty', 'empty', 'empty', 'empty', 'empty'],
    displayScore: '0.0',
    ratingCount: 0,
    hasRated: false,
  },

  onLoad(options) {
    const workId = options.workId || '';
    this.setData({
      title: options.title ? decodeURIComponent(options.title) : '',
      author: options.author ? decodeURIComponent(options.author) : '',
      category: options.category || '',
      workId,
    });

    if (options.fileUrl) {
      this.setData({ mediaUrl: decodeURIComponent(options.fileUrl), loading: false });
    } else if (workId) {
      cloudUtil.getWorkDetail({ workId }).then(res => {
        if (res.code === 0 && res.data.fileUrl) {
          this.setData({ mediaUrl: res.data.fileUrl });
        }
        this.setData({ loading: false });
      }).catch(() => {
        this.setData({ loading: false });
      });
    } else {
      this.setData({ loading: false });
    }

    // 加载评分数据
    if (workId) {
      this.loadRatings(workId);
    }
  },

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

  // 点击图片 → 微信原生全屏预览
  previewImage() {
    if (this.data.mediaUrl) {
      wx.previewImage({ urls: [this.data.mediaUrl] });
    }
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

  onImageError() {
    this.setData({ mediaUrl: '' });
  },

  onImageLoad(e) {
    const { width, height } = e.detail;
    const orientation = width >= height ? 'landscape' : 'portrait';
    this.setData({ imageOrientation: orientation });
  },
});
