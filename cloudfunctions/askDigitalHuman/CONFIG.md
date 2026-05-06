# 数字人云函数配置说明（全直连版）

## 架构

```
小程序 → 云函数 askDigitalHuman → 阿里云 DashScope
                                  ├── RAG 检索（关键词匹配，知识库内嵌）
                                  ├── LLM 对话（qwen-plus）
                                  └── TTS 语音（CosyVoice v3.5）
                                  → 云存储（音频文件）
```

**无需网关服务器，无需部署后端！**

## 唯一需要的环境变量

在微信开发者工具中配置：

1. 打开「云开发」→「云函数」→「askDigitalHuman」
2. 点击「版本与配置」→「环境变量」
3. 添加：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API Key | https://dashscope.console.aliyun.com/apiKey |

### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `LLM_MODEL` | 大语言模型 | `qwen-plus` |
| `TTS_MODEL` | TTS模型 | `cosyvoice-v3.5-plus` |
| `TTS_VOICE` | 音色ID | `cosyvoice-v3.5-plus-vd-wjxszslow-...` |

## 部署步骤

### 1. 配置环境变量
在云函数环境变量中设置 `DASHSCOPE_API_KEY`

### 2. 部署云函数
在微信开发者工具中：
- 右键 `cloudfunctions/askDigitalHuman` →「创建并部署：云端安装依赖」
- 等待部署完成（首次约1-2分钟）

### 3. 测试
- 打开小程序 → 进入数字人对话页面
- 输入问题或点击预设问题
- 等待回复（首次约5-10秒，后续3-5秒）
- 回复完成后自动播放语音

## API 说明

### chat - 对话（同步返回）
```javascript
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: { action: 'chat', question: '吴健雄是谁？' }
})
// 返回: { code: 0, data: { text, retrieval, audioUrl, hasRAG } }
```

### presets - 预设问题
```javascript
wx.cloud.callFunction({
  name: 'askDigitalHuman',
  data: { action: 'presets' }
})
// 返回: { code: 0, data: { questions: [...] } }
```

## 注意事项

1. **DASHSCOPE_API_KEY 必需**：没有则对话和语音都无法使用
2. **云函数超时**：默认超时可能不够，建议在云函数配置中设置为 **60秒**
3. **冷启动**：云函数长时间未调用会冷启动，首次响应较慢（5-10秒）
4. **音频有效期**：云存储临时链接有效期1小时
5. **TTS 失败不影响对话**：语音生成失败时仍会返回文本
