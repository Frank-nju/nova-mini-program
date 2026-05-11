const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    title: '',
    author: '',
    category: '',
    mediaUrl: '',
    loading: true,
    imageOrientation: 'landscape',
  },

  onLoad(options) {
    this.setData({
      title: options.title ? decodeURIComponent(options.title) : '',
      author: options.author ? decodeURIComponent(options.author) : '',
      category: options.category || '',
    });

    if (options.fileUrl) {
      this.setData({ mediaUrl: decodeURIComponent(options.fileUrl), loading: false });
    } else if (options.workId) {
      cloudUtil.getWorkDetail({ workId: options.workId }).then(res => {
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
  },

  // 点击图片 → 微信原生全屏预览
  previewImage() {
    if (this.data.mediaUrl) {
      wx.previewImage({ urls: [this.data.mediaUrl] });
    }
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
