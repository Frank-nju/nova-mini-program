// 前端调用云函数的统一封装
// 所有调用带超时控制，失败时返回兜底数据，不阻塞页面

const DEFAULT_TIMEOUT = 5000;

function isCloudAvailable() {
  return typeof wx.cloud !== 'undefined' && typeof wx.cloud.callFunction === 'function';
}

function call(name, data, timeout) {
  const ms = timeout || DEFAULT_TIMEOUT;
  return new Promise((resolve, reject) => {
    if (!isCloudAvailable()) {
      return reject(new Error('云环境未初始化'));
    }

    const timer = setTimeout(() => {
      reject(new Error('云函数超时: ' + name));
    }, ms);

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

// 统一响应校验：检查 code、data 和必填字段
function validateResponse(name, res, requiredFields) {
  if (!res || typeof res !== 'object') {
    console.error(`[cloudUtil][${name}] 响应格式异常:`, res);
    return false;
  }
  if (res.code !== 0) {
    console.warn(`[cloudUtil][${name}] 业务错误 code=${res.code}: ${res.message}`);
    return false;
  }
  if (!res.data || typeof res.data !== 'object') {
    console.error(`[cloudUtil][${name}] data 字段缺失或格式异常`);
    return false;
  }
  if (requiredFields) {
    for (const field of requiredFields) {
      if (!(field in res.data)) {
        console.warn(`[cloudUtil][${name}] data.${field} 缺失`);
        return false;
      }
    }
  }
  return true;
}

// ─── 7 个云函数封装 ───

function getUser() {
  return call('getUser').then(res => {
    const valid = validateResponse('getUser', res, ['progress', 'badges']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getUser 失败:', err.message);
    return { code: 1, message: err.message, data: { progress: { timelineNodes: [], cloudNodes: [], readWorks: [] }, badges: [] } };
  });
}

function updateProgress(params) {
  const required = ['type', 'nodeId', 'action'];
  for (const key of required) {
    if (!params[key]) {
      return Promise.resolve({ code: 1001, message: `参数 ${key} 缺失`, data: null });
    }
  }
  return call('updateProgress', params).then(res => {
    if (!res || res.code !== 0) {
      return res || { code: 9999, message: '响应异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] updateProgress 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function grantBadge(params) {
  if (!params || !params.badgeId) {
    return Promise.resolve({ code: 1001, message: '参数 badgeId 缺失', data: null });
  }
  return call('grantBadge', params).then(res => {
    if (!res || res.code !== 0) {
      return res || { code: 9999, message: '响应异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] grantBadge 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getWorks(params) {
  const opts = params || {};
  return call('getWorks', {
    page: opts.page || 1,
    pageSize: opts.pageSize || 10,
    category: opts.category || '',
  }).then(res => {
    const valid = validateResponse('getWorks', res, ['list', 'total', 'page', 'pageSize', 'hasMore']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: { list: [], total: 0, page: 1, pageSize: 10, hasMore: false } };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getWorks 失败:', err.message);
    return { code: 1, message: err.message, data: { list: [], total: 0, page: 1, pageSize: 10, hasMore: false } };
  });
}

function getWorkDetail(params) {
  if (!params || !params.workId) {
    return Promise.resolve({ code: 1001, message: '参数 workId 缺失', data: null });
  }
  return call('getWorkDetail', { workId: params.workId }).then(res => {
    const valid = validateResponse('getWorkDetail', res, ['workId', 'title', 'content']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getWorkDetail 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getCloudMap() {
  return call('getCloudMap', {}, 8000).then(res => {
    const valid = validateResponse('getCloudMap', res, ['nodes', 'connections']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: { nodes: [], connections: [] } };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getCloudMap 失败:', err.message);
    return { code: 1, message: err.message, data: { nodes: [], connections: [] } };
  });
}

function getDigitalHumanScript(params) {
  if (!params || !params.scene) {
    return Promise.resolve({ code: 1001, message: '参数 scene 缺失', data: null });
  }
  return call('getDigitalHumanScript', { scene: params.scene }).then(res => {
    const valid = validateResponse('getDigitalHumanScript', res, ['scene', 'text']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getDigitalHumanScript 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function chatWithDigitalHuman(params) {
  if (!params || !params.question) {
    return Promise.resolve({ code: 1001, message: '参数 question 缺失', data: null });
  }
  return call('digitalHuman', params, 30000).then(res => {
    if (!res || res.code !== 0) {
      // 即使业务报错，只要有 text 就显示
      if (res && res.data && res.data.text) {
        return res;
      }
      return { code: res && res.code ? res.code : 9999, message: res && res.message || 'AI 回答异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] chatWithDigitalHuman 失败:', err.message);
    return {
      code: 1,
      message: err.message,
      data: {
        text: '网络似乎不太好，等会儿再试试？',
        retrieval: [],
        hasRAG: false
      }
    };
  });
}

function getPresetQuestions() {
  return [
    '您是如何发现宇称不守恒的？',
    '做科研最重要的是什么？',
    '您对中国科学发展有什么期望？',
    '您对年轻人有什么寄语？',
    '您在求学过程中遇到过什么困难？',
    '您如何看待诺贝尔奖？',
  ];
}

module.exports = {
  call,
  isCloudAvailable,
  // 业务方法
  getUser,
  updateProgress,
  grantBadge,
  getWorks,
  getWorkDetail,
  getCloudMap,
  getDigitalHumanScript,
  chatWithDigitalHuman,
  getPresetQuestions,
};
