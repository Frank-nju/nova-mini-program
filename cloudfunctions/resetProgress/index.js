const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get()

    if (userRes.data.length === 0) {
      return { code: 0, message: '用户不存在，无需重置', data: { success: true } }
    }

    const user = userRes.data[0]
    await db.collection('users').doc(user._id).update({
      data: {
        progress: { timelineNodes: [], cloudNodes: [], readWorks: [] },
        badges: [],
        updatedAt: new Date().toISOString()
      }
    })

    return { code: 0, message: '进度已重置', data: { success: true } }
  } catch (error) {
    console.error('resetProgress 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
