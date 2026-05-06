const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { category, page = 1, pageSize = 20 } = event
    const safePageSize = Math.min(pageSize, 100)

    const query = category ? { category } : {}

    const countResult = await db.collection('materials').where(query).count()
    const list = await db.collection('materials')
      .where(query)
      .skip((page - 1) * safePageSize)
      .limit(safePageSize)
      .orderBy('createdAt', 'desc')
      .get()

    return {
      code: 0,
      message: 'ok',
      data: {
        list: list.data,
        total: countResult.total,
        page,
        pageSize: safePageSize
      }
    }

  } catch (error) {
    console.error('getMaterialList 失败：', error)
    return { code: 9999, message: '查询资料列表失败', data: null }
  }
}
