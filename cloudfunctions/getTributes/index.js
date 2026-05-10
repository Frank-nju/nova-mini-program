const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

exports.main = async (event, context) => {
  try {
    const page = Math.max(1, parseInt(event.page) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(event.pageSize) || DEFAULT_PAGE_SIZE))

    const countRes = await db.collection('tributes')
      .where({ status: 'approved' })
      .count()

    const total = countRes.total

    const listRes = await db.collection('tributes')
      .where({ status: 'approved' })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .field({
        _id: true,
        message: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
      })
      .get()

    const hasMore = (page * pageSize) < total

    return {
      code: 0,
      message: 'ok',
      data: {
        list: listRes.data,
        total,
        page,
        pageSize,
        hasMore,
      }
    }
  } catch (error) {
    console.error('getTributes 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
