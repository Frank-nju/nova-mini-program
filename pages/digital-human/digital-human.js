Page({
  data: {
    messages: [],
    inputValue: '',
    sending: false,
    scrollToView: '',
    presetQuestions: [],
    messageId: 0,
    innerAudioContext: null,
    audioUrl: '',
  },

  onLoad() {
    // 创建音频上下文
    const innerAudioContext = wx.createInnerAudioContext();
    this.setData({ innerAudioContext });

    // 加载预设问题
    this.loadPresets();
  },

  onUnload() {
    // 清理音频
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.stop();
      this.data.innerAudioContext.destroy();
    }
  },

  // 加载预设问题
  async loadPresets() {
    try {
      const res = await this.callFunction('askDigitalHuman', { action: 'presets' });
      if (res.code === 0 && res.data && res.data.questions) {
        this.setData({ presetQuestions: res.data.questions });
      }
    } catch (e) {
      console.log('加载预设问题失败:', e);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 输入处理
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 发送消息
  async sendMessage() {
    const question = this.data.inputValue.trim();
    if (!question || this.data.sending) return;

    // 清空输入框
    this.setData({ inputValue: '', sending: true });

    // 添加用户消息
    const userMsgId = this.data.messageId++;
    this.addMessage('user', question, userMsgId);

    // 添加 AI 加载中的消息
    const aiMsgId = this.data.messageId++;
    this.addMessage('ai', '', aiMsgId, { loading: true, taskId: null });

    try {
      // 通过云函数提交问题
      const submitRes = await this.callFunction('askDigitalHuman', {
        action: 'chat',
        question,
        top_k: 3,
      });

      if (submitRes.code !== 0) {
        throw new Error(submitRes.message);
      }

      const taskId = submitRes.data.taskId;

      // 更新 AI 消息的 taskId
      this.updateMessage(aiMsgId, { taskId });

      // 开始轮询结果
      this.pollResult(taskId, aiMsgId);

    } catch (e) {
      this.updateMessage(aiMsgId, {
        loading: false,
        text: '请求出错，请稍后重试',
        status: 'error',
      });
      this.setData({ sending: false });
    }
  },

  // 发送预设问题
  sendPreset(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputValue: question });
    this.sendMessage();
  },

  // 轮询结果
  pollResult(taskId, msgId) {
    let attempts = 0;
    const maxAttempts = 120; // 最多轮询 4 分钟

    const timer = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        this.updateMessage(msgId, {
          loading: false,
          text: '回答超时，请重新提问',
          status: 'error',
        });
        this.setData({ sending: false });
        return;
      }

      try {
        const res = await this.callFunction('askDigitalHuman', {
          action: 'result',
          taskId,
        });

        if (res.code !== 0) return;

        const data = res.data;

        if (data.status === 'retrieving') {
          // 检索中，保持加载状态
        } else if (data.status === 'generating') {
          // 生成中，显示增量文本
          this.updateMessage(msgId, {
            text: data.text || '',
          });
        } else if (data.status === 'done') {
          // 完成
          clearInterval(timer);
          this.updateMessage(msgId, {
            loading: false,
            text: data.text || '',
            status: 'done',
            retrieval: data.retrieval || [],
            audioReady: false,
          });
          this.setData({ sending: false });

          // 开始轮询音频就绪
          this.pollAudio(taskId, msgId);
        } else if (data.status === 'error') {
          clearInterval(timer);
          this.updateMessage(msgId, {
            loading: false,
            text: data.text || '出了点小问题，请稍后再试',
            status: 'error',
          });
          this.setData({ sending: false });
        }
      } catch (e) {
        // 轮询请求失败，忽略
      }
    }, 2000);
  },

  // 轮询音频就绪
  pollAudio(taskId, msgId) {
    let attempts = 0;
    const maxAttempts = 60; // 最多轮询 2 分钟

    const timer = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        return;
      }

      try {
        const res = await this.callFunction('askDigitalHuman', {
          action: 'result',
          taskId,
        });

        if (res.code !== 0) return;

        if (res.data.audioReady) {
          clearInterval(timer);
          this.updateMessage(msgId, { audioReady: true });
        }
      } catch (e) {}
    }, 2000);
  },

  // 播放语音
  playAudio(e) {
    const taskId = e.currentTarget.dataset.taskid;

    // 先通过云函数获取音频 URL
    this.callFunction('askDigitalHuman', {
      action: 'tts',
      taskId,
    }).then(res => {
      if (res.code === 0 && res.data.audioUrl) {
        const audioUrl = res.data.audioUrl;
        const innerAudioContext = this.data.innerAudioContext;
        innerAudioContext.src = audioUrl;
        innerAudioContext.play();

        // 更新对应消息的播放状态
        const messages = this.data.messages.map(msg => {
          if (msg.taskId === taskId) {
            return { ...msg, audioPlaying: true };
          }
          return msg;
        });
        this.setData({ messages });

        innerAudioContext.onEnded(() => {
          const msgs = this.data.messages.map(msg => {
            if (msg.taskId === taskId) {
              return { ...msg, audioPlaying: false };
            }
            return msg;
          });
          this.setData({ messages });
        });
      }
    });
  },

  // 停止播放
  stopAudio() {
    this.data.innerAudioContext.stop();

    const messages = this.data.messages.map(msg => ({
      ...msg,
      audioPlaying: false,
    }));
    this.setData({ messages });
  },

  // 添加消息
  addMessage(type, text, id, extra = {}) {
    const msg = {
      id,
      type,
      text,
      loading: false,
      status: 'done',
      retrieval: [],
      taskId: null,
      audioPlaying: false,
      ...extra,
    };
    const messages = [...this.data.messages, msg];
    this.setData({
      messages,
      scrollToView: `msg-${id}`,
    });
  },

  // 更新消息
  updateMessage(id, updates) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, ...updates };
      }
      return msg;
    });
    this.setData({
      messages,
      scrollToView: `msg-${id}`,
    });
  },

  // 封装云函数调用
  callFunction(name, data) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name,
        data,
        success(res) {
          resolve(res.result);
        },
        fail(err) {
          reject(err);
        },
      });
    });
  },
});
