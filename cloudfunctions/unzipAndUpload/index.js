const cloud = require('wx-server-sdk')
const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function getCategory(ext) {
  const map = {
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image',
    '.gif': 'image', '.webp': 'image', '.svg': 'image',
    '.mp4': 'video', '.avi': 'video', '.mov': 'video',
    '.pdf': 'doc', '.doc': 'doc', '.docx': 'doc',
    '.ppt': 'doc', '.pptx': 'doc', '.xls': 'doc', '.xlsx': 'doc',
    '.txt': 'doc', '.csv': 'doc'
  }
  return map[ext] || 'other'
}

exports.main = async (event, context) => {
  try {
    const { zipFileID } = event

    if (!zipFileID) {
      return { code: 1001, message: '参数缺失：zipFileID 为必填项', data: null }
    }

    // 1. 下载 ZIP 到临时目录
    const tmpZip = `/tmp/to_unzip_${Date.now()}.zip`
    const downloadRes = await cloud.downloadFile({ fileID: zipFileID })
    fs.writeFileSync(tmpZip, downloadRes.fileContent)

    // 2. 解压
    const zip = new AdmZip(tmpZip)
    const entries = zip.getEntries()
    const uploadedFiles = []

    // 3. 遍历处理每个文件
    for (const entry of entries) {
      if (entry.isDirectory) continue

      const ext = path.extname(entry.name).toLowerCase()
      const category = getCategory(ext)
      const cloudPath = `materials/${category}/${Date.now()}_${path.basename(entry.name)}`

      const uploadRes = await cloud.uploadFile({
        cloudPath,
        fileContent: entry.getData()
      })

      uploadedFiles.push({
        fileName: entry.entryName,
        fileID: uploadRes.fileID,
        category,
        createdAt: new Date()
      })
    }

    // 4. 批量写入数据库
    for (const file of uploadedFiles) {
      await db.collection('materials').add({ data: file })
    }

    // 5. 清理临时文件
    if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip)

    return {
      code: 0,
      message: `成功处理 ${uploadedFiles.length} 个文件`,
      data: uploadedFiles
    }

  } catch (error) {
    console.error('unzipAndUpload 失败：', error)
    return { code: 9999, message: `解压上传失败：${error.message}`, data: null }
  }
}
