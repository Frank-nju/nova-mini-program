# 数字人云函数配置说明

## 架构说明

本云函数采用**混合架构**：
- **RAG检索 + LLM对话** → 通过 `GATEWAY_URL` 走 FastAPI 网关
- **TTS语音合成** → 直连阿里云 DashScope CosyVoice（跳过网关，速度更快）

```
小程序 → 云函数 → 网关 (RAG+LLM)
                → 阿里云 DashScope (TTS直连)
                → 云存储 (音频文件)
```

## 环境变量配置

在微信开发者工具中配置云函数环境变量：

1. 打开微信开发者工具
2. 点击「云开发」→「云函数」
3. 找到 `askDigitalHuman` 云函数
4. 点击「版本与配置」→「环境变量」
5. 添加以下变量：

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API Key | `sk-xxxxxxxxxxxxxxxx` |

### 网关配置（RAG+LLM）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `GATEWAY_URL` | FastAPI 网关地址 | `http://localhost:8000` (开发) / `https://your-domain.com` (生产) |

### 可选配置（TTS）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TTS_MODEL` | TTS模型 | `cosyvoice-v3.5-plus` |
| `TTS_VOICE` | 音色ID | `cosyvoice-v3.5-plus-vd-wjxszslow-41e6b9543b174ccfbe0ebae9eb4721c0` |

## 本地开发

### 方式1：只用本地网关（TTS也会走网关）

```bash
# 1. 启动本地 FastAPI 网关
cd modules/digital-human/scripts
python gateway.py

# 2. 配置云函数环境变量
GATEWAY_URL=http://localhost:8000
DASHSCOPE_API_KEY=你的APIKey
```

### 方式2：本地电脑做服务器（内网穿透）

如果你希望手机真机调试：

```bash
# 1. 安装 ngrok
npm install -g ngrok

# 2. 启动内网穿透（将本地8000端口暴露到公网）
ngrok http 8000

# 3. 会得到一个 https://xxxx.ngrok-free.app 的地址
# 4. 配置云函数 GATEWAY_URL=https://xxxx.ngrok-free.app
```

### 方式3：部署到你的云服务器

```bash
# 1. 把 gateway.py 部署到你的云服务器
# 2. 配置域名和 HTTPS
# 3. 配置云函数 GATEWAY_URL=https://your-domain.com
```

## API 说明

### 1. chat - 提交问题
```javascript
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: {
    action: 'chat',
    question: '吴健雄是谁？',
    top_k: 3
  }
})
// 返回: { taskId, status }
```

### 2. result - 轮询结果
```javascript
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: {
    action: 'result',
    taskId: 'xxx'
  }
})
// 返回: { status, text, retrieval, audioReady }
```

### 3. tts - 生成语音（直连阿里云）
```javascript
// 方式1：通过 taskId 获取文本
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: {
    action: 'tts',
    taskId: 'xxx'
  }
})

// 方式2：直接传入文本
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: {
    action: 'tts',
    text: '要合成的文本内容'
  }
})
// 返回: { audioUrl, audioSize }
```

### 4. presets - 获取预设问题
```javascript
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: {
    action: 'presets'
  }
})
// 返回: { questions }
```

## 性能对比

| 方案 | TTS延迟 | 适用场景 |
|------|---------|----------|
| 原方案（网关中转） | 3-5秒 | 网关和TTS在同一服务器 |
| **新方案（直连阿里云）** | **1-2秒** | **推荐，速度更快** |

## 注意事项

1. **DASHSCOPE_API_KEY 必需**：没有配置会导致 TTS 失败
2. **云存储权限**：确保云函数有上传文件到云存储的权限
3. **音频有效期**：临时链接有效期1小时，过期后需要重新生成
4. **网关可选**：如果只做 TTS 测试，可以不配置 GATEWAY_URL
