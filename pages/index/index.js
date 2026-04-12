const { webviewUrl } = require('../../utils/config.js');

Page({
  data: {
    hasWebview: false,
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
