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
  }, 10000).then(res => {
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
    const valid = validateResponse('getWorkDetail', res, ['workId', 'title', 'fileUrl']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getWorkDetail 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getFilePreviewUrl(params) {
  if (!params || !params.fileID) {
    return Promise.resolve({ code: 1001, message: '参数 fileID 缺失', data: null });
  }
  return call('getFilePreviewUrl', { fileID: params.fileID }, 8000).then(res => {
    if (!res || res.code !== 0) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return { code: 0, message: 'ok', data: { fileUrl: res.data.tempFileURL } };
  }).catch(err => {
    console.warn('[cloudUtil] getFilePreviewUrl 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getCloudNodes() {
  return call('getCloudNodes', { includeConnections: true }, 8000).then(res => {
    const valid = validateResponse('getCloudNodes', res, ['nodes', 'connections']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: { nodes: [], connections: [] } };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getCloudNodes 失败:', err.message);
    return { code: 1, message: err.message, data: { nodes: [], connections: [] } };
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

function getPageImages() {
  return call('getPageImages', {}, 10000).then(res => {
    const valid = validateResponse('getPageImages', res, ['images']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: { images: [] } };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getPageImages 失败:', err.message);
    return { code: 1, message: err.message, data: { images: [] } };
  });
}

function resetProgress() {
  return call('resetProgress', {}, 5000).then(res => {
    if (!res || res.code !== 0) {
      return res || { code: 9999, message: '响应异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] resetProgress 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function submitTribute(params) {
  if (!params || !params.message || typeof params.message !== 'string' || !params.message.trim()) {
    return Promise.resolve({ code: 1001, message: '参数 message 缺失或为空', data: null });
  }
  const trimmed = params.message.trim();
  if (trimmed.length > 500) {
    return Promise.resolve({ code: 1001, message: 'message 不能超过 500 个字符', data: null });
  }
  return call('submitTribute', { message: trimmed }, 5000).then(res => {
    if (!res || res.code !== 0) {
      return res || { code: 9999, message: '响应异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] submitTribute 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getTributes(params) {
  const opts = params || {};
  return call('getTributes', {
    page: opts.page || 1,
    pageSize: Math.min(opts.pageSize || 20, 50),
  }, 8000).then(res => {
    const valid = validateResponse('getTributes', res, ['list', 'total', 'page', 'pageSize', 'hasMore']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: { list: [], total: 0, page: 1, pageSize: 20, hasMore: false } };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getTributes 失败:', err.message);
    return { code: 1, message: err.message, data: { list: [], total: 0, page: 1, pageSize: 20, hasMore: false } };
  });
}

function deleteTribute(params) {
  if (!params || !params.tributeId) {
    return Promise.resolve({ code: 1001, message: '参数缺失：tributeId 必填', data: null });
  }
  return call('deleteTribute', { tributeId: params.tributeId }, 5000).then(res => {
    if (!res || res.code !== 0) {
      return res || { code: 9999, message: '响应异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] deleteTribute 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function submitRating(params) {
  if (!params || !params.workId || !params.score) {
    return Promise.resolve({ code: 1001, message: '参数缺失：workId 和 score 必填', data: null });
  }
  return call('submitRating', { workId: params.workId, score: params.score }, 5000).then(res => {
    const valid = validateResponse('submitRating', res, ['avgScore', 'ratingCount']);
    if (!valid) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: null };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] submitRating 失败:', err.message);
    return { code: 1, message: err.message, data: null };
  });
}

function getWorkRatings(params) {
  if (!params || !params.workIds || params.workIds.length === 0) {
    return Promise.resolve({ code: 1001, message: '参数缺失：workIds 必填', data: null });
  }
  return call('getWorkRatings', { workIds: params.workIds }, 8000).then(res => {
    if (!res || res.code !== 0 || !Array.isArray(res.data)) {
      return { code: res && res.code ? res.code : 9999, message: res && res.message || '数据异常', data: [] };
    }
    return res;
  }).catch(err => {
    console.warn('[cloudUtil] getWorkRatings 失败:', err.message);
    return { code: 1, message: err.message, data: [] };
  });
}

module.exports = {
  call,
  isCloudAvailable,
  // 业务方法
  getUser,
  updateProgress,
  grantBadge,
  getCloudNodes,
  getWorks,
  getWorkDetail,
  getFilePreviewUrl,
  getCloudMap,
  getDigitalHumanScript,
  chatWithDigitalHuman,
  getPresetQuestions,
  getPageImages,
  resetProgress,
  submitTribute,
  getTributes,
  deleteTribute,
  submitRating,
  getWorkRatings,
};
