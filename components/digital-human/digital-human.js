Component({
  properties: {
    size: { type: Number, value: 300 },
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
    // 嘴巴位置（由 attached 根据 size 自动计算）
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
    // 计算嘴巴位置（最终确认版锚点）
    _calcMouthPos() {
      const size = this.properties.size;
      const height = Math.round(size * 1.33);
      this.setData({
        mouthTop: Math.round(height * 0.405),
        mouthLeft: Math.round(size * 0.425),
        mouthWidth: Math.round(size * 0.18),
        mouthHeight: Math.round(height * 0.08)
      });
    },

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
      });

      audio.onError(() => {
        clearInterval(lipTimer);
        this.setData({ isSpeaking: false, mouthIndex: -1 });
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
      this.setData({ isSpeaking: false, mouthIndex: -1 });
    },

    speak(text) {
      this._stopSpeaking();
      
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
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        this.triggerEvent('error', { err });
      });
    }
  }
});