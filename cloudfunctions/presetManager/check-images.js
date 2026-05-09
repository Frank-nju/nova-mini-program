// 检查云存储中数字人图片的实际大小
// 在微信开发者工具 -> cloudfunctions/presetManager -> 右键"在终端中打开"后运行：
// node check-images.js

const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cloud1-0g0wg0plf9fb9ed2',
});

const DH_IMAGE_NAMES = [
  'wu_base.png',
  'wu_mouth_1.png',
  'wu_mouth_2.png',
  'wu_mouth_3.png',
  'wu_mouth_4.png',
];

const ENV_ID = 'cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578';
const https = require('https');

async function downloadAndCheck(fileID) {
  const res = await cloud.getTempFileURL({ fileList: [fileID] });
  const fileRes = res.fileList[0];

  if (!fileRes.tempFileURL) {
    return { fileID, size: 0, error: '获取临时链接失败' };
  }

  return new Promise((resolve) => {
    https.get(fileRes.tempFileURL, (httpRes) => {
      const chunks = [];
      let totalSize = 0;

      httpRes.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      httpRes.on('end', () => {
        const sizeKB = (totalSize / 1024).toFixed(1);
        console.log(`  大小: ${totalSize} bytes (${sizeKB} KB)`);

        if (totalSize < 1000) {
          console.log('  ⚠️ 文件太小，可能上传失败！');
        }

        resolve({ fileID, size: totalSize });
      });
    }).on('error', (err) => {
      console.log(`   下载失败: ${err.message}`);
      resolve({ fileID, size: 0, error: err.message });
    });
  });
}

async function main() {
  console.log('===== 检查云存储数字人图片 =====\n');

  for (const name of DH_IMAGE_NAMES) {
    const fileID = `cloud://${ENV_ID}/digital-human/${name}`;
    console.log(`[${name}]`);
    await downloadAndCheck(fileID);
    console.log('');
  }

  console.log('===== 检查完成 =====');
}

main().catch(console.error);
