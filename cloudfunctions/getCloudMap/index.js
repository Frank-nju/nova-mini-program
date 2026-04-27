const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');

// W1 Mock 数据
const MOCK_CLOUD_MAP = {
  nodes: [
    {
      nodeId: 'cn_01',
      name: '唐诗',
      type: 'concept',
      positionX: 100,
      positionY: 200,
      icon: 'https://example.com/icons/poem.png',
      description: '唐代诗歌的巅峰',
      relatedWorks: ['w_001', 'w_003'],
    },
    {
      nodeId: 'cn_02',
      name: '张若虚',
      type: 'person',
      positionX: 300,
      positionY: 150,
      icon: 'https://example.com/icons/person.png',
      description: '唐代诗人',
      relatedWorks: ['w_001'],
    },
    {
      nodeId: 'cn_03',
      name: '青绿山水',
      type: 'style',
      positionX: 200,
      positionY: 350,
      icon: 'https://example.com/icons/painting.png',
      description: '中国画技法',
      relatedWorks: ['w_002'],
    },
  ],
  connections: [
    {
      fromNodeId: 'cn_01',
      toNodeId: 'cn_02',
      relationType: '所属',
      label: '代表作品',
    },
    {
      fromNodeId: 'cn_03',
      toNodeId: 'cn_02',
      relationType: '风格关联',
      label: '时代背景',
    },
  ],
};

exports.main = async (event, context) => {
  try {
    if (!MOCK_CLOUD_MAP.nodes || MOCK_CLOUD_MAP.nodes.length === 0) {
      return error(2002, '云图数据异常');
    }

    return success(MOCK_CLOUD_MAP);
  } catch (e) {
    return error(1003, '数据库操作失败');
  }
};
