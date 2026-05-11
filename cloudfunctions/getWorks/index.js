const cloud = require('wx-server-sdk');
const { success, error } = require('./response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, category, keyword } = event;

  try {
    const where = {};

    if (category) {
      where.category = category;
    }

    if (keyword) {
      where.title = db.RegExp({
        regexp: keyword,
        options: 'i',
      });
    }

    const baseQuery = db.collection('works').where(where);

    const countResult = await baseQuery.count();
    const total = countResult.total;

    const result = await baseQuery
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .field({ workId: true, title: true, category: true, fileId: true })
      .get();

    let list = result.data;

    // 视频类：批量查询 mov_cover 封面图，通过 workId 关联
    const videoItems = list.filter(item => item.category === '视频');
    if (videoItems.length > 0) {
      const workIds = videoItems.map(item => item.workId);
      const coverRes = await db.collection('mov_cover')
        .where({ workId: db.command.in(workIds) })
        .get();

      // workId → fileId 映射
      const coverMap = {};
      coverRes.data.forEach(c => { coverMap[c.workId] = c.fileId; });

      // 把封面 fileId 注入到视频项
      list = list.map(item => {
        if (item.category === '视频' && coverMap[item.workId]) {
          return { ...item, coverFileId: coverMap[item.workId] };
        }
        return item;
      });
    }

    const hasMore = (page - 1) * pageSize + list.length < total;

    return success({ list, total, page, pageSize, hasMore });
  } catch (e) {
    console.error('getWorks error:', e);
    return error(1003, '数据库操作失败');
  }
};
