const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');
const https = require('https');
const http = require('http');
const url = require('url');

// FastAPI 网关地址（本地开发用，生产环境需要改为实际域名）
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';

/**
 * 发起 HTTP 请求到 FastAPI 网关
 */
function httpPost(host, port, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const client = port === 443 ? https : http;

    const options = {
      hostname: host,
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('解析网关响应失败'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('网关请求超时'));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * 发起 HTTP GET 请求到 FastAPI 网关
 */
function httpGet(host, port, path) {
  return new Promise((resolve, reject) => {
    const client = port === 443 ? https : http;

    const options = {
      hostname: host,
      port,
      path,
      method: 'GET',
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('解析网关响应失败'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('网关请求超时'));
    });
    req.end();
  });
}

exports.main = async (event, context) => {
  const { action, question, taskId, top_k = 3 } = event;

  const parsed = url.parse(GATEWAY_URL);
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol === 'https:' ? 443 : 80);

  try {
    if (action === 'chat' && question) {
      // 提交问题
      const result = await httpPost(host, port, '/api/chat', { question, top_k });
      return success({
        taskId: result.task_id,
        status: result.status,
      });
    }

    if (action === 'result' && taskId) {
      // 轮询结果
      const result = await httpGet(host, port, `/api/result/${taskId}`);
      return success({
        status: result.status,
        text: result.text,
        retrieval: result.retrieval || [],
        error: result.error,
        latencyMs: result.latency_ms || 0,
        audioReady: result.audio_ready || false,
      });
    }

    if (action === 'tts' && taskId) {
      // TTS 音频 URL（云函数无法直接返回音频文件，返回 URL 供前端播放）
      return success({
        audioUrl: `${GATEWAY_URL}/api/tts/${taskId}`,
      });
    }

    if (action === 'presets') {
      // 获取预设问题
      const result = await httpGet(host, port, '/api/presets');
      return success({
        questions: result.questions || [],
      });
    }

    return error(1001, '参数缺失或格式错误');
  } catch (e) {
    console.error('askDigitalHuman 错误:', e);
    return error(9999, '服务端未知错误');
  }
};
