App({
  onLaunch: function () {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-0g0wg0plf9fb9ed2',  // 替换成你刚才创建的环境ID
      traceUser: true
    })
    console.log('小程序启动，云开发已初始化')
  }
})
