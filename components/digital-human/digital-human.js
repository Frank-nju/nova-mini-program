Component({
  properties: {
    size: { type: Number, value: 300 },
    speaking: { type: Boolean, value: false },
    audioUrl: { type: String, value: '' }
  },

  data: {
    baseSrc: '',
    mouthList: [],
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
    },
    detached() {
      this._stopSpeaking();
    }
  },

  methods: {
    // 通过云函数获取图片临时链接
    _loadCloudImages() {
      wx.cloud.callFunction({
        name: 'presetManager',
        data: { action: 'getDhImageUrls' }
      }).then(res => {
        if (res.result && res.result.code === 0 && res.result.data && res.result.data.images) {
          const images = res.result.data.images;
          const baseImg = images.find(img => img.fileName === 'wu_base.png');
          const mouthImgs = ['wu_mouth_1.png', 'wu_mouth_2.png', 'wu_mouth_3.png', 'wu_mouth_4.png']
            .map(name => images.find(img => img.fileName === name))
            .filter(Boolean);

          if (baseImg && baseImg.tempFileURL) {
            const mouthList = mouthImgs.filter(img => img.tempFileURL).map(img => img.tempFileURL);
            if (mouthList.length === 4) {
              console.log('[digital-human] 图片加载成功');
              this.setData({ baseSrc: baseImg.tempFileURL, mouthList });
              return;
            }
          }
        }
        // 云端图片获取失败或部分缺失，使用本地 fallback
        console.warn('[digital-human] 云端图片不完整，使用本地图片');
        this.setData({
          baseSrc: '/assets/images/wu_base.png',
          mouthList: [
            '/assets/images/wu_mouth_1.png',
            '/assets/images/wu_mouth_2.png',
            '/assets/images/wu_mouth_3.png',
            '/assets/images/wu_mouth_4.png'
          ]
        });
      }).catch(err => {
        console.warn('[digital-human] 获取图片链接失败，使用本地图片:', err.message);
        this.setData({
          baseSrc: '/assets/images/wu_base.png',
          mouthList: [
            '/assets/images/wu_mouth_1.png',
            '/assets/images/wu_mouth_2.png',
            '/assets/images/wu_mouth_3.png',
            '/assets/images/wu_mouth_4.png'
          ]
        });
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
      this._isPaused = false;
      const audio = wx.createInnerAudioContext();
      this.audioCtx = audio;
      audio.src = url;

      audio.onPlay(() => {
        this.setData({ isSpeaking: true, mouthIndex: 0 });
        this._isPaused = false;
        this._startLipTimer();
        this.triggerEvent('speakStart');
      });

      audio.onEnded(() => {
        this._stopLipTimer();
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        audio.destroy();
        this.triggerEvent('speakEnd');
      });

      audio.onError(() => {
        this._stopLipTimer();
        this.setData({ isSpeaking: false, mouthIndex: -1 });
        audio.destroy();
      });

      audio.play();
    },

    _startLipTimer() {
      if (this.lipTimer) clearInterval(this.lipTimer);
      this.lipTimer = setInterval(() => {
        const idx = Math.floor(Math.random() * 4);
        this.setData({ mouthIndex: idx });
      }, 150);
    },

    _stopLipTimer() {
      if (this.lipTimer) {
        clearInterval(this.lipTimer);
        this.lipTimer = null;
      }
    },

    stopSpeaking() {
      this._stopSpeaking();
    },

    pauseSpeaking() {
      if (this.audioCtx && this.data.isSpeaking) {
        try { this.audioCtx.pause(); } catch (e) { /* ignore */ }
        this._stopLipTimer();
        this._isPaused = true;
        this.setData({ isSpeaking: false, mouthIndex: -1 });
      }
    },

    resumeSpeaking() {
      if (this.audioCtx && this._isPaused) {
        try { this.audioCtx.play(); } catch (e) { /* ignore */ }
        // play() 会触发 onPlay，里面会处理 timer 和 isSpeaking
      }
    },

    _stopSpeaking() {
      this._stopLipTimer();
      this._isPaused = false;
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
      if (!question) return;
      if (this.data.isSpeaking) {
        this._stopSpeaking();
      }

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
        console.log('[digital-human] triggerEvent message with answer:', answer.substring(0, 50));
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
