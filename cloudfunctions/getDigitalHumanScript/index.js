const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// 从 scripts.json 读取数字人脚本
function loadScripts() {
  try {
    const scriptsPath = path.join(__dirname, '..', 'modules', 'digital-human', 'data', 'scripts.json');
    if (fs.existsSync(scriptsPath)) {
      const raw = fs.readFileSync(scriptsPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('加载脚本失败:', e);
  }
  return null;
}

exports.main = async (event, context) => {
  const { scene, nodeId, badgeName } = event;

  if (!scene) {
    return error(1001, '参数缺失或格式错误');
  }

  try {
    const scriptsData = loadScripts();
    if (!scriptsData || !scriptsData.scripts) {
      return error(2003, '场景脚本未配置');
    }

    const scripts = scriptsData.scripts;

    // 根据场景和绑定条件筛选
    let matched;
    if (scene === 'explain' && nodeId) {
      matched = scripts.find(s => s.scene === 'explain' && s.nodeBinding === nodeId);
    } else if (scene === 'feedback' && badgeName) {
      matched = scripts.find(s => s.scene === 'feedback' && s.badgeName === badgeName);
    } else {
      matched = scripts.find(s => s.scene === scene);
    }

    if (!matched) {
      return error(2003, '场景脚本未配置');
    }

    return success({
      scene: matched.scene,
      text: matched.text,
      emotion: matched.tone || 'friendly',
      voiceUrl: matched.audioPath ? `https://example.com/audio/${matched.audioPath}` : '',
      durationMs: (matched.duration || 0) * 1000,
    });
  } catch (e) {
    return error(9999, '服务端未知错误');
  }
};
