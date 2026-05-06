# 数字人云函数配置说明

## 环境变量配置

在微信开发者工具中配置云函数环境变量：

1. 打开微信开发者工具
2. 点击「云开发」→「云函数」
3. 找到 `askDigitalHuman` 云函数
4. 点击「版本与配置」→「环境变量」
5. 添加以下变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `GATEWAY_URL` | FastAPI 网关地址 | `http://localhost:8000` (开发) / `https://your-domain.com` (生产) |

## 本地开发

本地开发时，云函数默认使用 `http://localhost:8000`，需要先在本地启动 FastAPI 网关：

```bash
cd modules/digital-human/scripts
python gateway.py
```

## 生产部署

1. 部署 FastAPI 网关到云服务器
2. 配置域名和 HTTPS
3. 在云函数环境变量中设置 `GATEWAY_URL` 为生产地址
4. 重新部署云函数

## 依赖说明

云函数需要以下权限：
- 云函数调用权限
- 云存储读写权限（用于 TTS 音频文件）
