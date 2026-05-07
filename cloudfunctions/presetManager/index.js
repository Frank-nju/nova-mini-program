// presetManager - 管理预设问题的预存回答和语音
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const PRESET_COLLECTION = 'presetAnswers';

// 预设问题列表
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

exports.main = async (event, context) => {
  const { action, presetId } = event;

  // 查询单个预设回答
  if (action === 'get' && presetId) {
    return getPresetAnswer(presetId);
  }

  // 查询所有预设
  if (action === 'list') {
    return listPresets();
  }

  // 预生成所有（管理后台用）
  if (action === 'generate') {
    return generateAllPresets();
  }

  return { code: 1001, message: '未知action', data: null };
};

// 查询单个预设回答
async function getPresetAnswer(presetId) {
  try {
    const res = await db.collection(PRESET_COLLECTION).doc(presetId).get();
    return {
      code: 0,
      message: 'ok',
      data: res.data
    };
  } catch (e) {
    // 未找到，返回null让前端走API
    return {
      code: 0,
      message: 'not found',
      data: null
    };
  }
}

// 查询所有预设（仅返回元数据，不含语音）
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

// 预生成所有预设（需要配合askDigitalHuman使用）
async function generateAllPresets() {
  // 注意：这里只是创建空记录，实际生成需要调用askDigitalHuman
  // 或者通过管理后台逐个生成
  const results = [];
  
  for (const preset of PRESET_QUESTIONS) {
    try {
      // 检查是否已存在
      const exist = await db.collection(PRESET_COLLECTION).doc(preset.id).get().catch(() => null);
      if (exist) {
        results.push({ id: preset.id, status: 'exists' });
        continue;
      }

      // 创建占位记录
      await db.collection(PRESET_COLLECTION).add({
        data: {
          _id: preset.id,
          question: preset.question,
          text: '',
          audioUrl: '',
          createdAt: db.serverDate(),
          status: 'pending' // pending/generating/done
        }
      });
      results.push({ id: preset.id, status: 'created' });
    } catch (e) {
      results.push({ id: preset.id, status: 'error', error: e.message });
    }
  }

  return { code: 0, message: 'ok', data: { results } };
}
