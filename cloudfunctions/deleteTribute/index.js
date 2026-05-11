const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { tributeId } = event

    if (!tributeId) {
      return { code: 1001, message: '参数缺失：tributeId 为必填项', data: null }
    }

    // 查询该条致敬记录
    const tributeRes = await db.collection('tributes').doc(tributeId).get()
    if (!tributeRes.data) {
      return { code: 1002, message: '致敬记录不存在', data: null }
    }

    // 校验：只能删除自己的致敬
    if (tributeRes.data._openid !== openid) {
      return { code: 1004, message: '只能删除自己的致敬留言', data: null }
    }

    // 删除记录
    await db.collection('tributes').doc(tributeId).remove()

    return { code: 0, message: 'ok', data: { tributeId } }
  } catch (error) {
    console.error('deleteTribute 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
