const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { includeConnections } = event

    const nodesRes = await db.collection('cloud_nodes')
      .orderBy('section', 'asc')
      .orderBy('nodeId', 'asc')
      .get()

    const result = {
      nodes: nodesRes.data
    }

    if (includeConnections) {
      try {
        const connRes = await db.collection('cloud_connections')
          .orderBy('weight', 'desc')
          .get()
        result.connections = connRes.data
      } catch (connError) {
        result.connections = []
      }
    }

    return {
      code: 0,
      message: 'ok',
      data: result
    }

  } catch (error) {
    console.error('getCloudNodes 失败：', error)
    return { code: 2002, message: '云图数据异常', data: null }
  }
}
