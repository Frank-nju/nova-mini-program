Component({
  properties: {
    size: { type: Number, value: 300 },
    mouthTopRatio: { type: Number, value: 0.375 },
    mouthLeftRatio: { type: Number, value: 0.40 },
    mouthWidthRatio: { type: Number, value: 0.20 },
    mouthHeightRatio: { type: Number, value: 0.10 },
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
    mouthSrc: '/assets/images/wu_base.png',
    isSpeaking: false,
    mouthTop: 0,
    mouthLeft: 0,
    mouthWidth: 0,
    mouthHeight: 0
  },

  lifetimes: {
    attached() {
      this._calcMouthPos();
    }
  },

  methods: {
    _calcMouthPos() {
      const { size, mouthTopRatio, mouthLeftRatio, mouthWidthRatio, mouthHeightRatio } = this.properties;
      const height = Math.round(size * 1.33);
      this.setData({
        mouthTop: Math.round(height * mouthTopRatio),
        mouthLeft: Math.round(size * mouthLeftRatio),
        mouthWidth: Math.round(size * mouthWidthRatio),
        mouthHeight: Math.round(height * mouthHeightRatio)
      });
    },

    // 播放音频并启动口型动画
    playAudio(url) {
      if (!url) return;
      this._stopSpeaking();
      
      const audio = wx.createInnerAudioContext();
      this.audioCtx = audio;
      audio.src = url;

      let lipTimer;
      audio.onPlay(() => {
        this.setData({ isSpeaking: true });
        // 口型动画：每150ms随机切换嘴巴图片
        lipTimer = setInterval(() => {
          const idx = Math.floor(Math.random() * 4);
          this.setData({ mouthSrc: this.data.mouthList[idx] });
        }, 150);
      });

      audio.onEnded(() => {
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthSrc: this.data.baseSrc });
        audio.destroy();
        this.triggerEvent('speakEnd');
      });

      audio.onError((err) => {
        console.error('[digital-human] 音频播放失败:', err);
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthSrc: this.data.baseSrc });
        audio.destroy();
      });

      audio.play();
    },

    // 停止播放
    stopSpeaking() {
      this._stopSpeaking();
    },

    _stopSpeaking() {
      if (this.audioCtx) {
        this.audioCtx.stop();
        this.audioCtx.destroy();
        this.audioCtx = null;
      }
      this.setData({ isSpeaking: false, mouthSrc: this.data.baseSrc });
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
            this.playAudio(ttsRes.result.data.audioUrl);
          } else {
            this.setData({ isSpeaking: false });
          }
        });
      }).catch(err => {
        console.error('[digital-human] 请求失败:', err);
        this.setData({ isSpeaking: false });
        this.triggerEvent('error', { err });
      });
    }
  }
});
