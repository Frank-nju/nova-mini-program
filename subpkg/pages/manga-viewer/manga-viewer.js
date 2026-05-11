const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    title: '',
    author: '',
    pages: [],
    current: 0,
  },

  onLoad(options) {
    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }
    if (options.author) {
      this.setData({ author: decodeURIComponent(options.author) });
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

  goBack() {
    wx.navigateBack();
  },
});
