// presetManager - 管理预设问题的预存回答和语音
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const PRESET_COLLECTION = 'presetAnswers';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen-plus';
const TTS_MODEL = process.env.TTS_MODEL || 'cosyvoice-v3.5-plus';
const TTS_VOICE = process.env.TTS_VOICE || 'cosyvoice-v3.5-plus-vd-wjxszslow-41e6b9543b174ccfbe0ebae9eb4721c0';

const PRESET_QUESTIONS = [
  { id: "preset_q001", question: "吴先生，您是如何发现宇称不守恒的？" },
  { id: "preset_q002", question: "做科研最重要的是什么？" },
  { id: "preset_q003", question: "您对中国科学发展有什么期望？" },
  { id: "preset_q004", question: "您对年轻人有什么寄语？" },
  { id: "preset_q005", question: "您在求学过程中遇到过什么困难？" },
  { id: "preset_q006", question: "您和费米、奥本海默等科学家有什么交流？" },
  { id: "preset_q007", question: "您如何看待诺贝尔奖？" },
  { id: "preset_q008", question: "您对中国女性科研工作者有什么建议？" },
];

const SYSTEM_PROMPT = `你是吴健雄，核物理学家。用第一人称回答，简洁亲切，不超过80字。`;

exports.main = async (event, context) => {
  const { action, presetId } = event;

  if (action === 'get' && presetId) {
    return getPresetAnswer(presetId);
  }

  if (action === 'list') {
    return listPresets();
  }

  // 生成所有预设（调用LLM + TTS，上传到云存储）
  if (action === 'generate') {
    return generateAllPresets();
  }

  // 生成单个预设
  if (action === 'generateOne' && presetId) {
    const preset = PRESET_QUESTIONS.find(p => p.id === presetId);
    if (!preset) return { code: 1004, message: '未找到预设问题', data: null };
    return generateOnePreset(preset);
  }

  // 上传数字人图片到云存储（从临时文件URL）
  if (action === 'uploadDhImages') {
    return uploadDhImages(event.fileUrls || []);
  }

  // 获取数字人图片的云存储fileID列表
  if (action === 'getDhImageUrls') {
    return getDhImageUrls();
  }

  return { code: 1001, message: '未知action', data: null };
};

// 查询单个预设回答
async function getPresetAnswer(presetId) {
  try {
    const res = await db.collection(PRESET_COLLECTION).doc(presetId).get();
    return { code: 0, message: 'ok', data: res.data };
  } catch (e) {
    return { code: 0, message: 'not found', data: null };
  }
}

// 查询所有预设
async function listPresets() {
  try {
    const res = await db.collection(PRESET_COLLECTION).get();
    const list = res.data.map(item => ({
      id: item._id,
      question: item.question,
      text: item.text,
      hasAudio: !!item.audioUrl,
    }));
    return { code: 0, message: 'ok', data: { list } };
  } catch (e) {
    return { code: 1002, message: e.message, data: null };
  }
}

// 生成所有预设（并行执行，避免超时）
async function generateAllPresets() {
  // 使用 Promise.all 并行处理，但限制并发数为 3
  const concurrency = 3;
  const results = [];

  for (let i = 0; i < PRESET_QUESTIONS.length; i += concurrency) {
    const batch = PRESET_QUESTIONS.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (preset) => {
        try {
          const result = await generateOnePreset(preset);
          return { id: preset.id, status: 'done', text: result.data.text };
        } catch (e) {
          return { id: preset.id, status: 'error', error: e.message };
        }
      })
    );
    results.push(...batchResults);
  }

  return { code: 0, message: 'ok', data: { results } };
}

// 生成单个预设（LLM + TTS + 上传云存储）
async function generateOnePreset(preset) {
  // 1. 调用 LLM 生成文字
  const text = await callLLM(preset.question);
  console.log(`[preset] ${preset.id} 文字: ${text.substring(0, 50)}`);

  // 2. 调用 TTS 生成语音
  let audioUrl = '';
  try {
    const audioBuffer = await callTTS(text);
    // 3. 上传到云存储
    const cloudPath = `preset-audio/${preset.id}.mp3`;
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: audioBuffer,
    });
    audioUrl = uploadRes.fileID;
    console.log(`[preset] ${preset.id} 语音已上传: ${audioUrl}`);
  } catch (e) {
    console.error(`[preset] ${preset.id} 语音生成失败: ${e.message}`);
  }

  // 4. 保存到数据库
  const record = {
    _id: preset.id,
    question: preset.question,
    text: text,
    audioUrl: audioUrl,
    createdAt: db.serverDate(),
    status: 'done'
  };

  try {
    // 先尝试更新，如果不存在则添加
    await db.collection(PRESET_COLLECTION).doc(preset.id).update({
      data: record
    });
  } catch (e) {
    // 记录不存在，添加新记录
    try {
      await db.collection(PRESET_COLLECTION).add({
        data: record
      });
    } catch (e2) {
      console.error(`[preset] ${preset.id} 数据库保存失败:`, e2.message);
    }
  }

  return { code: 0, message: 'ok', data: record };
}

// 调用 LLM
function callLLM(question) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 128
    });

    const req = https.request({
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          resolve(json.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 调用 TTS（WebSocket，和 askDigitalHuman 一样）
function callTTS(text) {
  return new Promise((resolve, reject) => {
    const WebSocket = require('ws');
    const wsUrl = `wss://dashscope.aliyuncs.com/api-ws/v1/inference?api_key=${DASHSCOPE_API_KEY}`;
    const audioChunks = [];
    const ws = new WebSocket(wsUrl);
    let isCompleted = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        header: { action: 'run-task', task_id: `preset-tts-${Date.now()}` },
        payload: {
          model: TTS_MODEL,
          task_group: 'audio',
          task: 'tts',
          function: 'SpeechSynthesizer',
          input: { text },
          parameters: { voice: TTS_VOICE, format: 'mp3', sample_rate: 24000 },
        },
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.payload && msg.payload.output && msg.payload.output.audio) {
          audioChunks.push(Buffer.from(msg.payload.output.audio, 'base64'));
        }
        if (msg.header && msg.header.event === 'task-finished') {
          isCompleted = true;
          ws.close();
        }
        if (msg.header && msg.header.event === 'error') {
          reject(new Error((msg.payload && msg.payload.message) || 'TTS生成失败'));
          ws.close();
        }
      } catch (e) {
        if (Buffer.isBuffer(data)) {
          audioChunks.push(data);
        }
      }
    });

    ws.on('error', (err) => reject(new Error('WebSocket错误: ' + err.message)));

    ws.on('close', () => {
      if (isCompleted || audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      } else {
        reject(new Error('TTS未收到音频数据'));
      }
    });

    setTimeout(() => {
      if (!isCompleted) {
        ws.terminate();
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error('TTS超时'));
        }
      }
    }, 30000);
  });
}

// ========== 数字人图片管理 ==========

const DH_IMAGE_NAMES = [
  'wu_base.png',
  'wu_mouth_1.png',
  'wu_mouth_2.png',
  'wu_mouth_3.png',
  'wu_mouth_4.png',
];

// 上传数字人图片到云存储（从小程序端传入临时文件路径）
async function uploadDhImages(fileUrls) {
  if (!fileUrls || fileUrls.length === 0) {
    return { code: 1005, message: '请提供图片临时路径列表', data: null };
  }

  const results = [];
  for (let i = 0; i < Math.min(fileUrls.length, DH_IMAGE_NAMES.length); i++) {
    const fileName = DH_IMAGE_NAMES[i];
    const cloudPath = `digital-human/${fileName}`;
    try {
      const uploadRes = await cloud.uploadFile({
        cloudPath,
        fileContent: fileUrls[i], // 小程序端传来的临时文件路径
      });
      results.push({ fileName, fileID: uploadRes.fileID, status: 'ok' });
      console.log(`[dh-image] ${fileName} 上传成功: ${uploadRes.fileID}`);
    } catch (e) {
      results.push({ fileName, error: e.message, status: 'error' });
      console.error(`[dh-image] ${fileName} 上传失败:`, e.message);
    }
  }

  return { code: 0, message: 'ok', data: { results } };
}

// 获取数字人图片的云存储fileID列表
async function getDhImageUrls() {
  // 从上传结果获取的环境ID
  const ENV_ID = 'cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578';
  try {
    const results = await Promise.all(
      DH_IMAGE_NAMES.map(async (fileName) => {
        const fileID = `cloud://${ENV_ID}/digital-human/${fileName}`;
        try {
          const res = await cloud.getTempFileURL({
            fileList: [fileID],
          });
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            return {
              fileName,
              fileID: res.fileList[0].fileID,
              tempFileURL: res.fileList[0].tempFileURL,
              status: 'ok',
            };
          }
          return { fileName, status: 'not_found' };
        } catch (e) {
          return { fileName, status: 'not_found', error: e.message };
        }
      })
    );
    return { code: 0, message: 'ok', data: { images: results } };
  } catch (e) {
    return { code: 1006, message: e.message, data: null };
  }
}
