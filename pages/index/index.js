const { webviewUrl } = require('../../utils/config.js');
//index.js
Page({
  data: {
    hasWebview: false,
    skyStars: [],
    reflectionStars: [],
  },

  onLoad() {
    this.setData({
      hasWebview: !!(webviewUrl && String(webviewUrl).trim()),
    });
  },

  goExhibit() {
    wx.navigateTo({
      url: '/pages/exhibit/exhibit',
    });
  },
});
