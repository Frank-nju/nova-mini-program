Page({
  data: {
    messages: [],
    inputValue: '',
    sending: false,
    scrollToView: '',
    presetQuestions: [],
    messageId: 0,
    innerAudioContext: null,
  },

  onLoad() {
    const innerAudioContext = wx.createInnerAudioContext();
    this.setData({ innerAudioContext });
    this.loadPresets();
  },

  onUnload() {
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

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 发送消息
  async sendMessage() {
    const question = this.data.inputValue.trim();
    if (!question || this.data.sending) return;

    this.setData({ inputValue: '', sending: true });

    // 添加用户消息
    const userMsgId = this.data.messageId++;
    this.addMessage('user', question, userMsgId);

    // 添加 AI 加载中的消息
    const aiMsgId = this.data.messageId++;
    this.addMessage('ai', '', aiMsgId, { loading: true });

    try {
      // 调用云函数（同步返回完整结果：RAG + LLM + TTS）
      const res = await this.callFunction('askDigitalHuman', {
        action: 'chat',
        question,
      });

      if (res.code !== 0) {
        throw new Error(res.message || '请求失败');
      }

      const data = res.data;

      // 更新 AI 消息（文本 + 检索信息 + 音频）
      this.updateMessage(aiMsgId, {
        loading: false,
        text: data.text || '',
        status: 'done',
        retrieval: data.retrieval || [],
        audioUrl: data.audioUrl || null,
        audioPlaying: false,
      });

      // 如果有音频，自动播放
      if (data.audioUrl) {
        this.playAudioUrl(data.audioUrl, aiMsgId);
      }
    } catch (e) {
      this.updateMessage(aiMsgId, {
        loading: false,
        text: '请求出错：' + (e.message || '请稍后重试'),
        status: 'error',
      });
    } finally {
      this.setData({ sending: false });
    }
  },

  // 发送预设问题
  sendPreset(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputValue: question });
    this.sendMessage();
  },

  // 播放音频
  playAudio(e) {
    const audioUrl = e.currentTarget.dataset.audiourl;
    const msgId = e.currentTarget.dataset.msgid;
    if (audioUrl) {
      this.playAudioUrl(audioUrl, msgId);
    }
  },

  playAudioUrl(audioUrl, msgId) {
    const innerAudioContext = this.data.innerAudioContext;
    innerAudioContext.src = audioUrl;
    innerAudioContext.play();

    // 更新播放状态
    const messages = this.data.messages.map(msg => {
      if (msg.id === msgId) return { ...msg, audioPlaying: true };
      return { ...msg, audioPlaying: false };
    });
    this.setData({ messages });

    innerAudioContext.onEnded(() => {
      const msgs = this.data.messages.map(msg => {
        if (msg.id === msgId) return { ...msg, audioPlaying: false };
        return msg;
      });
      this.setData({ messages: msgs });
    });
  },

  // 停止播放
  stopAudio() {
    this.data.innerAudioContext.stop();
    const messages = this.data.messages.map(msg => ({ ...msg, audioPlaying: false }));
    this.setData({ messages });
  },

  // 添加消息
  addMessage(type, text, id, extra = {}) {
    const msg = {
      id, type, text,
      loading: false,
      status: 'done',
      retrieval: [],
      audioUrl: null,
      audioPlaying: false,
      ...extra,
    };
    const messages = [...this.data.messages, msg];
    this.setData({ messages, scrollToView: `msg-${id}` });
  },

  // 更新消息
  updateMessage(id, updates) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) return { ...msg, ...updates };
      return msg;
    });
    this.setData({ messages, scrollToView: `msg-${id}` });
  },

  // 封装云函数调用
  callFunction(name, data) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name, data,
        success(res) { resolve(res.result); },
        fail(err) { reject(err); },
      });
    });
  },
});
