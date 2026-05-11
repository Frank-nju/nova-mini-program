const cloud = require('wx-server-sdk');
const { success, error } = require('./response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { workId, score } = event;

  if (!workId || !score || score < 1 || score > 5 || !Number.isInteger(score)) {
    return error(1001, '参数错误：workId 必填，score 为 1-5 的整数');
  }

  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 查询是否已有评分
    const existing = await db.collection('work_ratings')
      .where({ _openid: openid, workId })
      .get();

    if (existing.data.length > 0) {
      // 更新评分
      await db.collection('work_ratings').doc(existing.data[0]._id).update({
        data: { score, updatedAt: new Date().toISOString() },
      });
    } else {
      // 新增评分
      await db.collection('work_ratings').add({
        data: { _openid: openid, workId, score, createdAt: new Date().toISOString() },
      });
    }

    // 计算该作品的平均分和人数
    const allRatings = await db.collection('work_ratings')
      .where({ workId })
      .get();

    const ratingCount = allRatings.data.length;
    const avgScore = ratingCount > 0
      ? Math.round(allRatings.data.reduce((sum, r) => sum + r.score, 0) / ratingCount * 10) / 10
      : 0;

    return success({ avgScore, ratingCount });
  } catch (e) {
    console.error('submitRating error:', e);
    return error(1003, '数据库操作失败');
  }
};
