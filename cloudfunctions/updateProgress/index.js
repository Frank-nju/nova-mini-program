// cloudfunctions/updateProgress/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // TODO: 后续实现数据库查询与更新逻辑
  const mockProgress = {
    code: 0,
    message: '进度更新接口已就绪',
    data: {
      openid: wxContext.OPENID,
      progress: {
        timelineNodes: ['node-001', 'node-002'],
        cloudMapNodes: ['location-001'],
      },
      updatedAt: new Date().toISOString(),
    },
  }

  return mockProgress
}