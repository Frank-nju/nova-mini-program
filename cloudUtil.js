// 前端调用云函数的统一封装
// 所有调用带超时控制，失败时返回兜底数据，不阻塞页面

function isCloudAvailable() {
  return typeof wx.cloud !== 'undefined' && typeof wx.cloud.callFunction === 'function';
}

function call(name, data) {
  return new Promise((resolve, reject) => {
    if (!isCloudAvailable()) {
      return reject(new Error('云环境未初始化'));
    }

    const timer = setTimeout(() => {
      reject(new Error('云函数超时: ' + name));
    }, 3000);

    wx.cloud.callFunction({ name, data })
      .then(res => {
        clearTimeout(timer);
        resolve(res.result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getUser() {
  return call('getUser').catch(err => {
    console.warn('getUser 失败:', err.message);
    return { code: 1, message: err.message, data: { progress: { timelineNodes: [], cloudMapNodes: [] }, badges: [] } };
  });
}

function updateProgress(params) {
  return call('updateProgress', params).catch(err => {
    console.warn('updateProgress 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function grantBadge(params) {
  return call('grantBadge', params).catch(err => {
    console.warn('grantBadge 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

module.exports = { call, getUser, updateProgress, grantBadge, isCloudAvailable };
