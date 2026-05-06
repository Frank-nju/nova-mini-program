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

    _playAudio(url) {
      this._stopSpeaking();
      const audio = wx.createInnerAudioContext();
      this.audioCtx = audio;
      audio.src = url;

      let lipTimer;
      audio.onPlay(() => {
        this.setData({ isSpeaking: true });
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

      audio.onError(() => {
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthSrc: this.data.baseSrc });
        audio.destroy();
      });

      audio.play();
    },

    _stopSpeaking() {
      if (this.audioCtx) {
        this.audioCtx.stop();
        this.audioCtx.destroy();
        this.audioCtx = null;
      }
      this.setData({ isSpeaking: false, mouthSrc: this.data.baseSrc });
    },

    // 暴露给外部调用的方法：传文字，自动走 AI+TTS+播放
    speak(text) {
      this._stopSpeaking();
      this.setData({ isSpeaking: true });

      wx.cloud.callFunction({
        name: 'chat',
        data: { message: text }
      }).then(chatRes => {
        const answer = chatRes.result.text;
        return wx.cloud.callFunction({
          name: 'tts',
          data: { text: answer }
        }).then(ttsRes => {
          this.triggerEvent('message', { question: text, answer });
          this._playAudio(ttsRes.result.url);
        });
      }).catch(err => {
        this.setData({ isSpeaking: false });
        this.triggerEvent('error', { err });
      });
    }
  }
});