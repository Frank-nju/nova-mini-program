// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  try {
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    if (userRes.data.length > 0) {
      return {
        code: 0,
        message: '用户已存在',
        data: userRes.data[0]
      }
    }
    
    // 用户不存在，创建新用户（不要手动写 _openid）
    const newUser = {
      nickName: '追光者',
      avatarUrl: '',
      badges: [],
      progress: {
        timelineNodes: [],
        cloudMapNodes: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 插入数据库，系统会自动为该记录添加 _openid 字段
    const addRes = await db.collection('users').add({
      data: newUser
    })

    // 如果想返回完整的用户信息，建议再查一次，或者将 newUser 与返回的 _id 拼起来
    return {
      code: 0,
      message: '用户创建成功',
      data: {
        ...newUser,
        _id: addRes._id,
        _openid: wxContext.OPENID // 前端如果需要，手动返回一下也无妨
      }
    }

  } catch (error) {
    console.error('用户操作失败：', error) // 建议保留日志，方便排查
    return {
      code: 5001,
      message: '查询或创建用户信息失败',
      data: null
    }
  }
}