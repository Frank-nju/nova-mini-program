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

    // 查找用户
    const userRes = await db.collection('users').where({ _openid: openid }).get()

    // 1002: 用户不存在
    if (userRes.data.length === 0) {
      return { code: 1002, message: '用户不存在', data: null }
    }

    const user = userRes.data[0]
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

    await db.collection('users').doc(user._id).update({
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
