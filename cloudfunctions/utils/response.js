// 云函数统一响应工具
// 参考接口文档 v0.1.1 §3.2

function success(data = null, message = 'ok') {
  return { code: 0, message, data };
}

function error(code, message) {
  return { code, message, data: null };
}

module.exports = { success, error };
