function success(data = null, message = 'ok') {
  return { code: 0, message, data };
}

function error(code, message) {
  return { code, message, data: null };
}

module.exports = { success, error };
