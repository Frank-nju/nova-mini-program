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

    const list = result.data;
    const hasMore = (page - 1) * pageSize + list.length < total;

    return success({ list, total, page, pageSize, hasMore });
  } catch (e) {
    console.error('getWorks error:', e);
    return error(1003, '数据库操作失败');
  }
};
