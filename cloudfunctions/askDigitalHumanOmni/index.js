// askDigitalHumanOmni - 使用 qwen-omni 同步输出文本+音频
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';

// 模型选择
const OMNI_MODEL = 'qwen3.5-omni-flash'; // 或 'qwen3.5-omni-flash-realtime'

// 系统 Prompt
const SYSTEM_PROMPT = `你是吴健雄，核物理学家。用第一人称回答，简洁亲切，不超过100字。`;

// 主入口
exports.main = async (event, context) => {
  const { question } = event;
  if (!question) {
    return { code: 1001, message: '缺少问题', data: null };
  }

  if (!DASHSCOPE_API_KEY) {
    return { code: 1002, message: '未配置 API Key', data: null };
  }

  try {
    console.log('[Omni] 开始调用，问题:', question.substring(0, 30));
    const startTime = Date.now();

    const result = await callOmni(question);
    
    console.log('[Omni] 完成，耗时:', Date.now() - startTime, 'ms');
    
    return {
      code: 0,
      message: 'ok',
      data: {
        text: result.text,
        audioBase64: result.audioBase64,
        audioFormat: result.audioFormat,
      },
    };
  } catch (e) {
    console.error('[Omni] 错误:', e.message);
    return { code: 1003, message: e.message, data: null };
  }
};

// 调用 qwen-omni API
function callOmni(question) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    
    const body = JSON.stringify({
      model: OMNI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      modalities: ['text', 'audio'],
      audio: { voice: 'Tina', format: 'mp3' },
      stream: false, // 非流式，一次性返回
    });

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          
          const choice = json.choices?.[0];
          const text = choice?.message?.content || '';
          const audioBase64 = choice?.message?.audio?.data || '';
          
          resolve({
            text,
            audioBase64,
            audioFormat: 'mp3',
          });
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}
