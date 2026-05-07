Page({
  data: {
    question: '',
    text: '',
    audioUrl: '',
    audioBase64: '',
    loading: false,
    playing: false,
    duration: 0,
  },

  onInput(e) {
    this.setData({ question: e.detail.value });
  },

  async send() {
    const { question } = this.data;
    if (!question || this.data.loading) return;

    this.setData({ loading: true, text: '', audioUrl: '' });
    const startTime = Date.now();

    try {
      const res = await wx.cloud.callFunction({
        name: 'askDigitalHumanOmni',
        data: { question },
      });

      const duration = Date.now() - startTime;

      if (res.result.code !== 0) {
        throw new Error(res.result.message);
      }

      const { text, audioBase64 } = res.result.data;
      
      // base64 转临时文件
      let audioUrl = '';
      if (audioBase64) {
        const fs = wx.getFileSystemManager();
        const filePath = `${wx.env.USER_DATA_PATH}/omni_audio.mp3`;
        fs.writeFileSync(filePath, audioBase64, 'base64');
        audioUrl = filePath;
      }

      this.setData({
        text,
        audioBase64,
        audioUrl,
        duration,
        loading: false,
      });

      // 自动播放
      if (audioUrl) {
        this.playAudio();
      }
    } catch (e) {
      this.setData({
        text: '错误：' + e.message,
        loading: false,
        duration: Date.now() - startTime,
      });
    }
  },

  playAudio() {
    const { audioUrl, playing } = this.data;
    if (!audioUrl) return;

    if (playing) {
      this.innerAudioContext?.stop();
      this.setData({ playing: false });
      return;
    }

    const ctx = wx.createInnerAudioContext();
    this.innerAudioContext = ctx;
    ctx.src = audioUrl;

    ctx.onPlay(() => {
      this.setData({ playing: true });
    });

    ctx.onEnded(() => {
      this.setData({ playing: false });
      ctx.destroy();
    });

    ctx.onError((err) => {
      console.error('播放失败:', err);
      this.setData({ playing: false });
    });

    ctx.play();
  },

  goBack() {
    wx.navigateBack();
  },

  onUnload() {
    this.innerAudioContext?.destroy();
  },
});
