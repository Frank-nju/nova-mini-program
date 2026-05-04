App({
  cloudReady: false,

  onLaunch() {
    try {
      wx.cloud.init({
        env: 'cloud1-0g0wg0plf9fb9ed2',
        traceUser: true,
      });
      this.cloudReady = true;
      console.log('[APP] 云环境初始化成功');
    } catch (e) {
      console.error('[APP] 云环境初始化失败:', e);
    }
  },
});
