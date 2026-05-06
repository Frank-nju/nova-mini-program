const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');
const https = require('https');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// FastAPI 网关地址（用于RAG检索和LLM对话）
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';

// 阿里云DashScope配置（TTS直连）
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const TTS_MODEL = process.env.TTS_MODEL || 'cosyvoice-v3.5-plus';
const TTS_VOICE = process.env.TTS_VOICE || 'cosyvoice-v3.5-plus-vd-wjxszslow-41e6b9543b174ccfbe0ebae9eb4721c0';

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

/**
 * 直连阿里云DashScope生成TTS音频
 * 使用WebSocket协议调用CosyVoice
 */
function generateTTS(text) {
  return new Promise((resolve, reject) => {
    if (!DASHSCOPE_API_KEY) {
      reject(new Error('未配置DASHSCOPE_API_KEY'));
      return;
    }

    const wsUrl = `wss://dashscope.aliyuncs.com/api-ws/v1/inference?api_key=${DASHSCOPE_API_KEY}`;
    const audioChunks = [];
    
    const ws = new WebSocket(wsUrl);
    let isCompleted = false;

    ws.on('open', () => {
      // 发送TTS请求
      const request = {
        header: {
          action: 'run-task',
          task_id: `tts-${Date.now()}`,
        },
        payload: {
          model: TTS_MODEL,
          task_group: 'audio',
          task: 'tts',
          function: 'SpeechSynthesizer',
          input: {
            text: text,
          },
          parameters: {
            voice: TTS_VOICE,
            format: 'mp3',
            sample_rate: 24000,
          },
        },
      };
      ws.send(JSON.stringify(request));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // 处理音频数据
        if (message.payload && message.payload.output) {
          const output = message.payload.output;
          if (output.audio) {
            // Base64音频数据
            const audioBuffer = Buffer.from(output.audio, 'base64');
            audioChunks.push(audioBuffer);
          }
        }

        // 检查是否完成
        if (message.header && message.header.event === 'task-finished') {
          isCompleted = true;
          ws.close();
        }
        
        // 检查错误
        if (message.header && message.header.event === 'error') {
          reject(new Error(message.payload.message || 'TTS生成失败'));
          ws.close();
        }
      } catch (e) {
        // 可能是二进制音频数据
        if (Buffer.isBuffer(data)) {
          audioChunks.push(data);
        }
      }
    });

    ws.on('error', (err) => {
      reject(new Error('WebSocket错误: ' + err.message));
    });

    ws.on('close', () => {
      if (isCompleted || audioChunks.length > 0) {
        const fullAudio = Buffer.concat(audioChunks);
        resolve(fullAudio);
      } else {
        reject(new Error('TTS连接关闭，未收到音频数据'));
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!isCompleted) {
        ws.terminate();
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error('TTS生成超时'));
        }
      }
    }, 30000);
  });
}

/**
 * 上传音频到云存储并返回临时URL
 */
async function uploadAudioAndGetUrl(audioBuffer, taskId) {
  const cloudPath = `tts/${taskId}.mp3`;
  
  // 上传到云存储
  const uploadRes = await cloud.uploadFile({
    cloudPath,
    fileContent: audioBuffer,
  });
  
  // 获取临时链接（有效期1小时）
  const tempRes = await cloud.getTempFileURL({
    fileList: [uploadRes.fileID],
  });
  
  if (tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL) {
    return tempRes.fileList[0].tempFileURL;
  }
  throw new Error('获取音频临时链接失败');
}

exports.main = async (event, context) => {
  const { action, question, taskId, text, top_k = 3 } = event;

  const parsed = url.parse(GATEWAY_URL);
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol === 'https:' ? 443 : 80);

  try {
    if (action === 'chat' && question) {
      // 提交问题 -> 走网关（RAG+LLM）
      const result = await httpPost(host, port, '/api/chat', { question, top_k });
      return success({
        taskId: result.task_id,
        status: result.status,
      });
    }

    if (action === 'result' && taskId) {
      // 轮询结果 -> 走网关
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

    if (action === 'tts') {
      // TTS 音频 -> 直连阿里云（跳过网关）
      // 支持两种方式：1. 通过taskId从网关获取文本 2. 直接传入text
      let ttsText = text;
      
      if (!ttsText && taskId) {
        // 从网关获取任务结果中的文本
        try {
          const result = await httpGet(host, port, `/api/result/${taskId}`);
          if (result.status === 'done' && result.text) {
            ttsText = result.text;
          }
        } catch (e) {
          console.log('从网关获取文本失败:', e);
        }
      }
      
      if (!ttsText) {
        return error(1002, '缺少文本内容，请提供text参数或有效的taskId');
      }

      try {
        console.log('开始生成TTS，文本长度:', ttsText.length);
        const audioBuffer = await generateTTS(ttsText);
        console.log('TTS生成完成，音频大小:', audioBuffer.length, 'bytes');
        
        const audioUrl = await uploadAudioAndGetUrl(audioBuffer, taskId || `tts-${Date.now()}`);
        console.log('音频上传完成，URL:', audioUrl.substring(0, 50) + '...');
        
        return success({
          audioUrl: audioUrl,
          audioSize: audioBuffer.length,
        });
      } catch (e) {
        console.error('TTS生成错误:', e);
        return error(1003, '语音合成失败: ' + e.message);
      }
    }

    if (action === 'presets') {
      // 获取预设问题 -> 走网关
      const result = await httpGet(host, port, '/api/presets');
      return success({
        questions: result.questions || [],
      });
    }

    return error(1001, '参数缺失或格式错误');
  } catch (e) {
    console.error('askDigitalHuman 错误:', e);
    return error(9999, '服务端未知错误: ' + e.message);
  }
};
