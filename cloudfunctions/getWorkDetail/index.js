const cloud = require('wx-server-sdk');
const { success, error } = require('../utils/response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { workId } = event;

  if (!workId) {
    return error(1001, '参数缺失或格式错误');
  }

  try {
    const result = await db.collection('works')
      .where({ workId })
      .limit(1)
      .get();

    if (result.data.length === 0) {
      return error(2001, '作品不存在');
    }

    const work = result.data[0];

    // 如果有 fileId，转为临时下载链接
    let fileUrl = '';
    if (work.fileId) {
      try {
        const urlResult = await cloud.getTempFileURL({
          fileList: [work.fileId],
        });
        const file = urlResult.fileList[0];
        if (file.tempFileURL) {
          fileUrl = file.tempFileURL;
        }
      } catch (e) {
        console.error('获取文件链接失败:', e);
      }
    }

    return success({
      workId: work.workId,
      title: work.title,
      category: work.category,
      fileId: work.fileId || '',
      fileUrl,
    });
  } catch (e) {
    console.error('getWorkDetail error:', e);
    return error(1003, '数据库操作失败');
  }
};
