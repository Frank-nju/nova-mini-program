/**
 * web-view 只支持已配置的 https 业务域名（正式版与真机预览均校验）。
 * 静态页在 pages/exhibit/web/（index.html + css/ + js/），与小程序原生页并列，便于维护。
 * 无需后端：把 web 文件夹整份上传到任意静态托管（GitHub Pages、COS、Vercel 等）即可。
 * 1. 部署后得到 https://你的域名/.../index.html
 * 2. 小程序后台 → 开发管理 → 业务域名 → 添加并校验该域名
 * 3. 将下方 WEBVIEW_URL 设为该地址
 */
const WEBVIEW_URL = 'https://cloud1-0g0wg0plf9fb9ed2-1421412578.tcloudbaseapp.com/index.html';

module.exports = {
  webviewUrl: WEBVIEW_URL,
};
