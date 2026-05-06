const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'pages', 'image');
const backupDir = path.join(__dirname, 'pages', 'image', '_original');

// Create backup of originals
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function compressImage(file) {
  const inputPath = path.join(imageDir, file);
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file, ext);

  // Backup original
  const backupPath = path.join(backupDir, file);
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
  }

  if (ext === '.png') {
    // PNG: compress
    await sharp(inputPath)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 70, compressionLevel: 9 })
      .toFile(inputPath + '.tmp');
  } else {
    // JPEG: compress with quality 60
    await sharp(inputPath)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 60, progressive: true, mozjpeg: true })
      .toFile(inputPath + '.tmp');
  }

  // Replace original with compressed
  fs.renameSync(inputPath + '.tmp', inputPath);

  const stats = fs.statSync(inputPath);
  const origStats = fs.statSync(backupPath);
  const saved = ((1 - stats.size / origStats.size) * 100).toFixed(1);
  console.log(`  ${file}: ${(origStats.size / 1024).toFixed(0)}KB → ${(stats.size / 1024).toFixed(0)}KB (省 ${saved}%)`);
}

async function main() {
  const files = fs.readdirSync(imageDir).filter(f =>
    /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('_')
  );

  console.log(`压缩 ${files.length} 张图片...\n`);

  let totalBefore = 0;
  for (const file of files) {
    const inputPath = path.join(imageDir, file);
    totalBefore += fs.statSync(inputPath).size;
    await compressImage(file);
  }

  console.log(`\n压缩前总计: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
