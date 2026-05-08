const { webviewUrl } = require('../../utils/config.js');
//index.js
Page({
  data: {
    currentPage: 0,
  },

  onPageChange(e) {
    this.setData({ currentPage: e.detail.current });
  },

  skipGuide() {
    this.goExhibit();
  },

  goExhibit() {
    wx.navigateTo({
      url: '/pages/exhibit/exhibit',
    });
  },
});
