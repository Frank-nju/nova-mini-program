// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // TODO: 后续实现幂等与数据库操作
  const mockBadge = {
    code: 0,
    message: '徽章发放接口已就绪',
    data: {
      openid: wxContext.OPENID,
      badgeId: 'badge-001',
      badgeName: '追光者',
      badgeDesc: '首次进入地图，获得追光者徽章',
      badgeImage: 'https://example.com/badges/zhuiguangzhe.png',
      awardedAt: new Date().toISOString(),
      allBadges: [
        { id: 'badge-001', name: '追光者', unlocked: true },
        { id: 'badge-002', name: '云图探索者', unlocked: false },
        { id: 'badge-003', name: '时光旅人', unlocked: false },
        { id: 'badge-004', name: '智慧守护者', unlocked: false },
        { id: 'badge-005', name: '星辰收集者', unlocked: false },
        { id: 'badge-006', name: '未来筑梦者', unlocked: false },
      ],
    },
  }

  return mockBadge
}