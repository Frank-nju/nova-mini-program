const { webviewUrl } = require('../../utils/config.js');
//index.js
Page({
  data: {},

  goExhibit() {
    wx.navigateTo({
      url: '/pages/exhibit/exhibit',
    });
  },
});
