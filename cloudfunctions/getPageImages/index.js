const cloud = require('wx-server-sdk');
const { success, error } = require('./response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 页面背景图配置 — 与前端 section 顺序一一对应
const PAGE_IMAGES = [
  { name: '首页', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/首页.png' },
  { name: '序章', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/序章.jpg' },
  { name: '生平履历', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/生平履历.jpg' },
  { name: '治学风骨', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/治学风骨.jpg' },
  { name: '科研丰碑', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/科研丰碑.jpg' },
  { name: '尾声', fileID: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/主页图片/尾声.jpg' },
];

exports.main = async (event, context) => {
  try {
    // 批量获取临时链接（2小时有效）
    const fileList = PAGE_IMAGES.map(img => img.fileID);
    const result = await cloud.getTempFileURL({ fileList });

    const images = PAGE_IMAGES.map((img, i) => {
      const fileInfo = result.fileList[i];
      return {
        name: img.name,
        path: `/主页图片/${img.name}`,
        fileID: img.fileID,
        url: (fileInfo && fileInfo.status === 0) ? fileInfo.tempFileURL : null,
        type: fileInfo && fileInfo.status === 0
          ? (img.fileID.endsWith('.png') ? 'image/png' : 'image/jpeg')
          : null,
      };
    });

    return success({ images });
  } catch (e) {
    console.error('getPageImages error:', e);
    return error(9999, '获取页面图片失败');
  }
};
