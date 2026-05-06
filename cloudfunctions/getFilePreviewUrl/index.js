const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    const { fileID } = event

    if (!fileID) {
      return { code: 1001, message: '参数缺失：fileID 为必填项', data: null }
    }

    const result = await cloud.getTempFileURL({ fileList: [fileID] })

    if (!result.fileList || result.fileList.length === 0) {
      return { code: 9999, message: '获取临时链接失败', data: null }
    }

    const fileInfo = result.fileList[0]

    if (fileInfo.status !== 0) {
      return { code: 9999, message: `获取临时链接失败：${fileInfo.errMsg}`, data: null }
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        fileID: fileInfo.fileID,
        tempFileURL: fileInfo.tempFileURL,
        maxAge: 7200
      }
    }

  } catch (error) {
    console.error('getFilePreviewUrl 失败：', error)
    return { code: 9999, message: '获取预览链接失败', data: null }
  }
}
