const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { badgeId } = event

    // 1001: 参数缺失或格式错误
    if (!badgeId) {
      return { code: 1001, message: '参数缺失：badgeId 为必填项', data: null }
    }

    // 查找徽章定义
    let badgeDef
    const badgeRes = await db.collection('badges').where({ badgeId }).get()
    if (badgeRes.data.length === 0) {
      return { code: 1001, message: '徽章不存在：未找到对应的徽章定义', data: null }
    }
    badgeDef = badgeRes.data[0]

    // 查找用户
    const userRes = await db.collection('users').where({ _openid: openid }).get()
    if (userRes.data.length === 0) {
      return { code: 1002, message: '用户不存在', data: null }
    }

    const user = userRes.data[0]
    const ownedBadges = user.badges || []

    // 1004: 徽章已存在（幂等）
    if (ownedBadges.includes(badgeId)) {
      return {
        code: 0,
        message: 'ok',
        data: {
          badgeId: badgeDef.badgeId,
          name: badgeDef.name,
          description: badgeDef.description,
          icon: badgeDef.icon,
          alreadyOwned: true
        }
      }
    }

    // 发放徽章
    const updatedBadges = [...ownedBadges, badgeId]
    await db.collection('users').doc(user._id).update({
      data: {
        badges: updatedBadges,
        updatedAt: new Date().toISOString()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        badgeId: badgeDef.badgeId,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        alreadyOwned: false
      }
    }

  } catch (error) {
    console.error('grantBadge 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
