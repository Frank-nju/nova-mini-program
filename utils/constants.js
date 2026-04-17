// 吴健雄传小程序 - 前端配置和常量

export const CONFIG = {
  // 应用名称
  appName: '追光健雄',
  appDesc: '云端数字展馆',

  // 颜色主题
  colors: {
    primary: '#64c8ff',      // 主蓝色
    accent: '#c9a96e',       // 金色
    secondary: '#ff69b4',    // 粉红色
    success: '#20b2aa',      // 青色
    warning: '#ffd700',      // 黄金色
    danger: '#ff6347',       // 红色
    dark: '#0a0a0f',         // 深色背景
    text: '#f0ede6',         // 文字颜色
  },

  // 动画时长（毫秒）
  animations: {
    fast: 300,
    normal: 500,
    slow: 1000,
    verySlow: 2000,
  },

  // 六个部分配置
  sections: [
    { id: 0, name: '首页', color: '#0a0a0f' },
    { id: 1, name: '序章', color: 'rgba(10, 20, 40, 0.8)' },
    { id: 2, name: '生平履历', color: 'rgba(40, 20, 10, 0.8)' },
    { id: 3, name: '治学风骨', color: 'rgba(10, 40, 40, 0.8)' },
    { id: 4, name: '科研丰碑', color: 'rgba(40, 10, 30, 0.8)' },
    { id: 5, name: '尾声', color: 'rgba(40, 30, 10, 0.8)' },
  ],

  // 事件云图
  eventClouds: [
    { id: 1, name: '序章开启', color: '#64c8ff' },
    { id: 2, name: '童年往事', color: '#c9a96e' },
    { id: 3, name: '求学之路', color: '#ff69b4' },
    { id: 4, name: '浙大岁月', color: '#ffd700' },
    { id: 5, name: '赴美留学', color: '#00ff00' },
    { id: 6, name: '宇称不守恒', color: '#ff6347' },
    { id: 7, name: '诺贝尔之光', color: '#9370db' },
    { id: 8, name: '伟大遗产', color: '#20b2aa' },
  ],

  // 徽章配置
  badges: [
    { id: 1, icon: '🌟', name: '序章探索', section: 1 },
    { id: 2, icon: '📖', name: '生平完成', section: 2 },
    { id: 3, icon: '✍️', name: '治学达人', section: 3 },
    { id: 4, icon: '🔬', name: '科研专家', section: 4 },
    { id: 5, icon: '👑', name: '知识王者', condition: 'all' },
    { id: 6, icon: '🎖️', name: '尾声见证', section: 5 },
  ],
};

// 本地存储键名
export const STORAGE_KEYS = {
  CLOUDS: 'wu_xianshuang_clouds',       // 事件云图
  BADGES: 'wu_xianshuang_badges',       // 徽章
  PROGRESS: 'wu_xianshuang_progress',   // 阅读进度
};

// 音效配置（预留）
export const SOUNDS = {
  click: '/assets/sounds/click.mp3',
  complete: '/assets/sounds/complete.mp3',
  unlock: '/assets/sounds/unlock.mp3',
};

// 文本配置
export const TEXTS = {
  title: '追光健雄',
  subtitle: '云端数字展馆',
  quote: '「科学没有国界，但科学家有祖国。」',
  description: '核物理学先驱，实验验证宇称不守恒。在此以卷轴与互动展陈，走近她的生平、风骨与科研丰碑。',
  footer: '弘扬科学家精神 · 沉浸式学习体验',
};
