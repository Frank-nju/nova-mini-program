const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { type, nodeId, action } = event

    // 1001: 参数缺失或格式错误
    if (!type || !nodeId || !action) {
      return {
        code: 1001,
        message: '参数缺失：type、nodeId、action 为必填项',
        data: null
      }
    }

    const validTypes = ['timeline', 'cloud', 'work']
    const validActions = ['unlock', 'complete']

    if (!validTypes.includes(type)) {
      return { code: 1001, message: '无效的 type 参数，可选值：timeline、cloud、work', data: null }
    }
    if (!validActions.includes(action)) {
      return { code: 1001, message: '无效的 action 参数，可选值：unlock、complete', data: null }
    }

    // 查找或创建用户
    let userRes = await db.collection('users').where({ _openid: openid }).get()
    let userId

    if (userRes.data.length === 0) {
      const addRes = await db.collection('users').add({
        data: {
          nickName: '追光者',
          avatarUrl: '',
          badges: [],
          progress: { timelineNodes: [], cloudNodes: [], readWorks: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
      userId = addRes._id
    } else {
      userId = userRes.data[0]._id
    }

    const user = (userRes.data.length > 0) ? userRes.data[0] : (await db.collection('users').doc(userId).get()).data
    const progress = user.progress || { timelineNodes: [], cloudNodes: [], readWorks: [] }

    // 根据 type 确定要更新的进度字段
    let fieldName
    if (type === 'timeline') fieldName = 'timelineNodes'
    else if (type === 'cloud') fieldName = 'cloudNodes'
    else fieldName = 'readWorks'

    const currentList = progress[fieldName] || []

    // 去重：节点已存在则直接返回当前进度
    if (currentList.includes(nodeId)) {
      return {
        code: 0,
        message: 'ok',
        data: {
          updatedNodeId: nodeId,
          nodeType: type,
          action,
          currentProgress: progress
        }
      }
    }

    // 追加新节点
    const updatedList = [...currentList, nodeId]
    const updatedProgress = { ...progress, [fieldName]: updatedList }

    await db.collection('users').doc(userId).update({
      data: {
        progress: updatedProgress,
        updatedAt: new Date().toISOString()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        updatedNodeId: nodeId,
        nodeType: type,
        action,
        currentProgress: updatedProgress
      }
    }

  } catch (error) {
    console.error('updateProgress 失败：', error)
    return { code: 1003, message: '数据库操作失败', data: null }
  }
}
