const cloud = require('wx-server-sdk');
const { success, error } = require('./response');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { workIds } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
    return error(1001, '参数错误：workIds 为必填的非空数组');
  }

  if (!openid) {
    return error(1002, '无法获取用户信息');
  }

  try {
    // 查询所有相关评分记录
    const ratings = await db.collection('work_ratings')
      .where({ workId: db.command.in(workIds) })
      .get();

    // 查询当前用户对这些作品的评分
    const userRatings = await db.collection('work_ratings')
      .where({ _openid: openid, workId: db.command.in(workIds) })
      .get();

    // 构建用户评分映射
    const userRatingMap = {};
    userRatings.data.forEach(r => {
      userRatingMap[r.workId] = r.score;
    });

    // 按 workId 分组统计
    const stats = {};
    ratings.data.forEach(r => {
      if (!stats[r.workId]) {
        stats[r.workId] = { sum: 0, count: 0 };
      }
      stats[r.workId].sum += r.score;
      stats[r.workId].count += 1;
    });

    // 构建返回结果
    const result = workIds.map(workId => {
      const s = stats[workId];
      return {
        workId,
        avgScore: s ? Math.round(s.sum / s.count * 10) / 10 : 0,
        ratingCount: s ? s.count : 0,
        userScore: userRatingMap[workId] || 0,
      };
    });

    return success(result);
  } catch (e) {
    console.error('getWorkRatings error:', e);
    return error(1003, '数据库操作失败');
  }
};
