Component({
  properties: {
    size: { type: Number, value: 300 },
    speaking: { type: Boolean, value: false },
    audioUrl: { type: String, value: '' }
  },

  data: {
    baseSrc: 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/digital-human/wu_base.png',
    mouthList: [
      'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/digital-human/wu_mouth_1.png',
      'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/digital-human/wu_mouth_2.png',
      'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/digital-human/wu_mouth_3.png',
      'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/digital-human/wu_mouth_4.png'
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
      this._loadCloudImages();
    }
  },

  methods: {
    // 将 cloud:// 路径转换为带签名的 HTTPS 临时链接
    _loadCloudImages() {
      const fileList = [this.data.baseSrc, ...this.data.mouthList];
      wx.cloud.getTempFileURL({
        fileList,
        success: (res) => {
          if (res.fileList && res.fileList.length > 0) {
            const baseSrc = res.fileList[0].tempFileURL;
            const mouthList = res.fileList.slice(1).map(item => item.tempFileURL);
            this.setData({ baseSrc, mouthList });
            console.log('[digital-human] 图片加载成功');
          }
        },
        fail: (err) => {
          console.error('[digital-human] 图片加载失败:', err);
        }
      });
    },

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
