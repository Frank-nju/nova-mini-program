Component({
  properties: {
    speaking: { type: Boolean, value: false },
    audioUrl: { type: String, value: '' }
  },

  data: {
    baseSrc: '/assets/images/wu_base.png',
    mouthList: [
      '/assets/images/wu_mouth_1.png',
      '/assets/images/wu_mouth_2.png',
      '/assets/images/wu_mouth_3.png',
      '/assets/images/wu_mouth_4.png'
    ],
    mouthIndex: -1,
    isSpeaking: false,
    // 嘴巴位置（百分比，基于图片比例）
    mouthTop: 40.5,  // 顶部 40.5%
    mouthLeft: 42.5, // 左边 42.5%
    mouthWidth: 18,  // 宽度 18%
    mouthHeight: 8   // 高度 8%
  },

  lifetimes: {
    attached() {
      // 不再需要计算，使用固定百分比
    }
  },

  methods: {

    _playAudio(url) {
      this._stopSpeaking();
      const audio = wx.createInnerAudioContext();
      this.audioCtx = audio;
      audio.src = url;

      let lipTimer;

      audio.onPlay(() => {
        this.setData({ isSpeaking: true, mouthIndex: 0 });

        lipTimer = setInterval(() => {
          const idx = Math.floor(Math.random() * 4);
          this.setData({ mouthIndex: idx });
        }, 150);
      });

      audio.onEnded(() => {
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        audio.destroy();
        this.triggerEvent('speakEnd');
      });

      audio.onError(() => {
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        audio.destroy();
      });

      audio.play();
    },

    stopSpeaking() {
      this._stopSpeaking();
    },

    _stopSpeaking() {
      if (this.audioCtx) {
        try {
          this.audioCtx.stop();
          this.audioCtx.destroy();
        } catch (e) {
          // ignore
        }
        this.audioCtx = null;
      }
      this.setData({ isSpeaking: false, mouthIndex: -1 });
    },

    // 暴露给外部：传入问题，自动调用云函数获取回答和音频
    ask(question) {
      if (!question || this.data.isSpeaking) return;

      this._stopSpeaking();
      this.setData({ isSpeaking: true });

      // 调用 askDigitalHuman 云函数（chat action）
      wx.cloud.callFunction({
        name: 'askDigitalHuman',
        data: { action: 'chat', question }
      }).then(res => {
        if (res.result.code !== 0) {
          throw new Error(res.result.message || '对话失败');
        }

        const answer = res.result.data.text;
        this.triggerEvent('message', { question, answer, retrieval: res.result.data.retrieval });

        // 异步请求 TTS
        return wx.cloud.callFunction({
          name: 'askDigitalHuman',
          data: { action: 'tts', text: answer }
        }).then(ttsRes => {
          if (ttsRes.result.code === 0 && ttsRes.result.data.audioUrl) {
            this._playAudio(ttsRes.result.data.audioUrl);
          } else {
            this.setData({ isSpeaking: false, mouthIndex: -1 });
          }
        });
      }).catch(err => {
        console.error('[digital-human] 请求失败:', err);
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        this.triggerEvent('error', { err });
      });
    }
  }
});
