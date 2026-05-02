const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const openid = wxContext.OPENID

  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get()

    if (userRes.data.length > 0) {
      return {
        code: 0,
        message: '用户已存在',
        data: userRes.data[0]
      }
    }

    const newUser = {
      nickName: '追光者',
      avatarUrl: '',
      badges: [],
      progress: {
        timelineNodes: [],
        cloudNodes: [],
        readWorks: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const addRes = await db.collection('users').add({ data: newUser })

    // 回查一次，拿到系统自动添加的 _openid 等完整字段，避免手动拼接
    const freshRes = await db.collection('users').doc(addRes._id).get()

    return {
      code: 0,
      message: '用户创建成功',
      data: freshRes.data
    }

  } catch (error) {
    console.error('用户操作失败：', error)
    return { code: 1003, message: '查询或创建用户信息失败', data: null }
  }
}
