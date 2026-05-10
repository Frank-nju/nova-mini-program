const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { message } = event

    if (!message || typeof message !== 'string') {
      return { code: 1001, message: '参数缺失：message 为必填项', data: null }
    }

    const trimmed = message.trim()
    if (trimmed.length < 1) {
      return { code: 1001, message: 'message 不能为空', data: null }
    }
    if (trimmed.length > 500) {
      return { code: 1001, message: 'message 不能超过 500 个字符', data: null }
    }

    let nickname = '追光者'
    let avatarUrl = ''
    try {
      const userRes = await db.collection('users').where({ _openid: openid }).get()
      if (userRes.data.length > 0) {
        const user = userRes.data[0]
        nickname = user.nickName || nickname
        avatarUrl = user.avatarUrl || ''
      }
    } catch (e) {
      console.warn('获取用户昵称失败，使用默认名:', e.message)
    }

    const now = new Date().toISOString()
    const doc = {
      _openid: openid,
      message: trimmed,
      nickname,
      avatarUrl,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    }

    const addRes = await db.collection('tributes').add({ data: doc })

    return {
      code: 0,
      message: 'ok',
      data: {
        tributeId: addRes._id,
        message: trimmed,
        nickname,
        avatarUrl,
        createdAt: now,
      }
    }
  } catch (error) {
    console.error('submitTribute 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
