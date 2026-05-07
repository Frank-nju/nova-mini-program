// 预生成预设问题的回答和语音
// 运行方式：node scripts/generatePresets.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const LLM_MODEL = 'qwen-plus';

const PRESETS = [
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

async function main() {
  if (!DASHSCOPE_API_KEY) {
    console.error('请设置 DASHSCOPE_API_KEY 环境变量');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, '../preset-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const preset of PRESETS) {
    console.log(`\n处理: ${preset.question}`);
    
    try {
      // 1. 生成文字
      const text = await generateText(preset.question);
      console.log(`  文字: ${text.substring(0, 50)}...`);

      // 2. 生成语音 (使用 dashscope 语音合成 API)
      const audioBase64 = await generateTTS(text);
      console.log(`  语音: ${audioBase64.length} chars (base64)`);
      
      // 3. 保存
      const data = {
        id: preset.id,
        question: preset.question,
        text: text,
        audioBase64: audioBase64,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(outputDir, `${preset.id}.json`),
        JSON.stringify(data, null, 2)
      );
      
      console.log(`  ✓ 已保存到 preset-data/${preset.id}.json`);
    } catch (e) {
      console.error(`  ✗ 失败: ${e.message}`);
      // 文字成功但语音失败时，只保存文字
      if (e.message.includes('语音')) {
        console.log('  ⚠ 仅保存文字，语音需后续补充');
      }
    }
  }

  console.log('\n全部完成！请将 preset-data/ 下的文件上传到云存储。');
}

function generateText(question) {
  return new Promise((resolve, reject) => {
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

// 使用 dashscope 语音合成 API
function generateTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'cosyvoice-v1',
      input: { text },
      voice: 'longxiaochun',
      response_format: 'mp3'
    });

    const req = https.request({
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/audio/speech',
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
          // 先尝试解析 JSON
          const json = JSON.parse(data);
          
          // 检查是否有 audio 字段 (base64)
          if (json.audio) {
            resolve(json.audio);
          } else if (json.output && json.output.audio) {
            resolve(json.output.audio);
          } else if (json.error) {
            reject(new Error(`语音: ${json.error.message}`));
          } else {
            reject(new Error('语音: 未找到音频数据'));
          }
        } catch (e) {
          // 不是 JSON，可能是错误 HTML 页面
          reject(new Error('语音: API 返回格式错误'));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`语音: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

main();
