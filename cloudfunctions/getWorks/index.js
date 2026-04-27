const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// W1 Mock 数据
const MOCK_WORKS = [
  {
    workId: 'w_001',
    title: '春江花月夜',
    author: '张若虚',
    category: 'literature',
    cover: 'https://example.com/covers/w_001.jpg',
    summary: '孤篇横绝全唐',
    unlockCondition: 'free',
  },
  {
    workId: 'w_002',
    title: '千里江山图',
    author: '王希孟',
    category: 'painting',
    cover: 'https://example.com/covers/w_002.jpg',
    summary: '青绿山水巅峰',
    unlockCondition: 'timeline_n3',
  },
  {
    workId: 'w_003',
    title: '水调歌头',
    author: '苏轼',
    category: 'literature',
    cover: 'https://example.com/covers/w_003.jpg',
    summary: '明月几时有',
    unlockCondition: 'free',
  },
];

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, category } = event;

  try {
    let works = MOCK_WORKS;

    // 按分类筛选
    if (category) {
      works = works.filter(w => w.category === category);
    }

    const total = works.length;
    const start = (page - 1) * pageSize;
    const list = works.slice(start, start + pageSize);
    const hasMore = start + pageSize < total;

    return success({
      list,
      total,
      page,
      pageSize,
      hasMore,
    });
  } catch (e) {
    return error(1003, '数据库操作失败');
  }
};
