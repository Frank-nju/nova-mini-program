const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')
const fs = require('fs')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function downloadFile(url, dest, redirectCount = 0) {
  if (redirectCount > 5) {
    return Promise.reject(new Error('重定向次数过多，可能存在环路'))
  }
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close()
        fs.unlinkSync(dest)
        return downloadFile(response.headers.location, dest, redirectCount + 1).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`下载失败，状态码：${response.statusCode}`))
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close(resolve)
      })
    }).on('error', (err) => {
      file.close()
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      reject(err)
    })
  })
}

exports.main = async (event, context) => {
  try {
    const { zipUrl } = event

    if (!zipUrl) {
      return { code: 1001, message: '参数缺失：zipUrl 为必填项', data: null }
    }

    // 下载 ZIP 到临时目录
    const tmpPath = `/tmp/materials_${Date.now()}.zip`
    await downloadFile(zipUrl, tmpPath)

    // 上传 ZIP 到云存储
    const uploadRes = await cloud.uploadFile({
      cloudPath: `temp/archive_${Date.now()}.zip`,
      fileContent: fs.readFileSync(tmpPath)
    })

    // 清理临时文件
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

    // 调用 unzipAndUpload 云函数
    const result = await cloud.callFunction({
      name: 'unzipAndUpload',
      data: { zipFileID: uploadRes.fileID }
    })

    return result.result

  } catch (error) {
    console.error('triggerProcess 失败：', error)
    return { code: 9999, message: `同步失败：${error.message}`, data: null }
  }
}
