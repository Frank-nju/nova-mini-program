const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');

// W1 Mock 数据
const MOCK_WORKS_DETAIL = {
  'w_001': {
    workId: 'w_001',
    title: '春江花月夜',
    author: '张若虚',
    category: 'literature',
    cover: 'https://example.com/covers/w_001.jpg',
    content: '<p>春江潮水连海平，海上明月共潮生。</p><p>滟滟随波千万里，何处春江无月明。</p>',
    images: [
      'https://example.com/details/w_001_1.jpg',
      'https://example.com/details/w_001_2.jpg',
    ],
    relatedNodes: ['cn_01', 'cn_02'],
    unlockCondition: 'free',
  },
  'w_002': {
    workId: 'w_002',
    title: '千里江山图',
    author: '王希孟',
    category: 'painting',
    cover: 'https://example.com/covers/w_002.jpg',
    content: '<p>千里江山图是北宋王希孟创作的绢本设色画。</p>',
    images: [
      'https://example.com/details/w_002_1.jpg',
    ],
    relatedNodes: ['cn_02'],
    unlockCondition: 'timeline_n3',
  },
};

exports.main = async (event, context) => {
  const { workId } = event;

  if (!workId) {
    return error(1001, '参数缺失或格式错误');
  }

  const work = MOCK_WORKS_DETAIL[workId];
  if (!work) {
    return error(2001, '作品不存在');
  }

  return success(work);
};
