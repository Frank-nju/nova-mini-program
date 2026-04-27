/**
 * 云函数统一响应封装
 * 所有云函数使用此格式返回数据
 */

function success(data, message = 'ok') {
  return {
    code: 0,
    message,
    data,
  };
}

function error(code, message) {
  return {
    code,
    message,
    data: null,
  };
}

module.exports = { success, error };
