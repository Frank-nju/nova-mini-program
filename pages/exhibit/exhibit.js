const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    screenHeight: 0,
    currentSection: 'section-0',
    stars: [],
    activeStates: [true, false, false, false, false, false],
    showBadgePanel: false,
    showAIPanel: false,
    newBadges: false,
    badgeNotification: null,
    eventClouds: [],
    badges: [
      { id: 'badge_01', icon: '🌟', name: '序章探索', section: 1, unlocked: false },
      { id: 'badge_02', icon: '📖', name: '生平完成', section: 2, unlocked: false },
      { id: 'badge_03', icon: '✍️', name: '治学达人', section: 3, unlocked: false },
      { id: 'badge_04', icon: '🔬', name: '科研专家', section: 4, unlocked: false },
      { id: 'badge_05', icon: '👑', name: '知识王者', section: 5, unlocked: false },
    ],
    particleExplosions: [],
    animationFrameId: null,
  },

  onLoad() {
    this.setData({ screenHeight: 812 });
    wx.getWindowInfo({
      success: (res) => {
        this.setData({ screenHeight: res.windowHeight || 812 });
      },
    });
    this.generateStars();
    this.initializeEventClouds();
    // 云调用在渲染后异步执行，不阻塞页面
    setTimeout(() => this.loadProgress(), 300);
  },

  onShow() {
    setTimeout(() => this.loadProgress(), 300);
  },

  initializeEventClouds() {
    const clouds = [];
    const colors = ['#64c8ff', '#c9a96e', '#ff69b4', '#ffd700', '#00ff00', '#20b2aa'];
    const sectionNames = ['序章', '生平', '治学', '科研', '尾声', '永恒'];
    let cloudId = 1;

    for (let section = 1; section <= 5; section++) {
      for (let storyIndex = 0; storyIndex < 6; storyIndex++) {
        const row = Math.floor((cloudId - 1) / 6);
        const col = (cloudId - 1) % 6;
        const x = 0.15 + (col * 0.13) + (Math.random() - 0.5) * 0.08;
        const y = 0.2 + (row * 0.15) + (Math.random() - 0.5) * 0.06;

        clouds.push({
          id: cloudId,
          name: `${sectionNames[section - 1]} · 故事${storyIndex + 1}`,
          color: colors[section - 1],
          x: Math.max(0.1, Math.min(0.9, x)),
          y: Math.max(0.1, Math.min(0.9, y)),
          unlocked: false,
          section: section,
          storyIndex: storyIndex,
          particles: [],
        });
        cloudId++;
      }
    }

    this.setData({ eventClouds: clouds });
  },

  // 保存进度到本地缓存
  saveProgressCache(clouds, badges) {
    try {
      const cloudList = clouds || this.data.eventClouds;
      const badgeList = badges || this.data.badges;

      const unlockedClouds = cloudList
        .filter(c => c.unlocked)
        .map(c => 'n' + c.id);

      const unlockedBadges = badgeList
        .filter(b => b.unlocked)
        .map(b => b.id);

      const data = {
        timelineNodes: unlockedClouds,
        badges: unlockedBadges,
      };
      console.log('[exhibit] 保存缓存:', JSON.stringify(data));
      wx.setStorageSync('exhibitProgress', data);
    } catch (e) {
      console.error('保存缓存失败:', e);
    }
  },

  // 从云端加载进度（替代本地存储）
  loadProgress() {
    // 先从本地缓存读取（立即可用）
    try {
      const cache = wx.getStorageSync('exhibitProgress') || {};
      const timelineNodes = cache.timelineNodes || [];
      const badgeIds = cache.badges || [];

      const eventClouds = this.data.eventClouds.map(cloud => {
        const nodeId = 'n' + cloud.id;
        const unlocked = timelineNodes.includes(nodeId);
        return { ...cloud, unlocked };
      });

      const badges = this.data.badges.map(badge => ({
        ...badge,
        unlocked: badgeIds.includes(badge.id),
      }));

      this.setData({ eventClouds, badges });
    } catch (e) {
      console.warn('读取缓存失败:', e);
    }

    // 再异步从云端同步（只有云端成功时才覆盖）
    cloudUtil.getUser().then(res => {
      if (res.code !== 0) return;
      const data = res.data || {};
      const progress = data.progress || {};
      const badgeIds = data.badges || [];

      const eventClouds = this.data.eventClouds.map(cloud => {
        const nodeId = 'n' + cloud.id;
        const unlocked = progress.timelineNodes && progress.timelineNodes.includes(nodeId);
        return { ...cloud, unlocked };
      });

      const badges = this.data.badges.map(badge => ({
        ...badge,
        unlocked: badgeIds.includes(badge.id),
      }));

      this.setData({ eventClouds, badges });
    }).catch(err => {
      console.warn('loadProgress 失败，保留本地缓存:', err.message);
    });
  },

  generateStars() {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push(Math.random() * 100);
    }
    this.setData({ stars });
  },

  onScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const screenHeight = this.data.screenHeight || 812;
    const index = Math.round(scrollTop / screenHeight);

    let newStates = this.data.activeStates.slice();
    let hasChanged = false;

    for (let i = 0; i < 6; i++) {
      const shouldBeActive = (i <= index && i >= Math.max(0, index - 1));
      if (newStates[i] !== shouldBeActive) {
        newStates[i] = shouldBeActive;
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.setData({ activeStates: newStates });
    }
    this.data.scrollY = scrollTop;
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  enterStory(e) {
    const section = e.currentTarget.dataset.section;
    const story = e.currentTarget.dataset.story || 0;

    wx.showLoading({ title: '故事加载中...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/story/story?section=${section}&story=${story}`,
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'error', duration: 2000 });
        }
      });
    }, 800);
  },

  // 从故事页返回时，解锁对应节点（story.js 已上报进度，这里只刷新云端数据）
  unlockEventCloudByStory(section, storyIndex) {
    const cloudIndex = this.data.eventClouds.findIndex(
      c => c.section === section && c.storyIndex === storyIndex
    );
    if (cloudIndex === -1) return;

    const cloud = this.data.eventClouds[cloudIndex];
    if (cloud.unlocked) return;

    // 乐观更新UI
    const eventClouds = [...this.data.eventClouds];
    eventClouds[cloudIndex] = { ...cloud, unlocked: true };
    this.setData({ eventClouds });
    this.createParticleExplosion(cloud);

    // 立即保存缓存（不等 setData 回调）
    this.saveProgressCache(eventClouds, this.data.badges);

    // 检查是否完成整个章节
    const sectionCloudCount = eventClouds.filter(c => c.section === section).length;
    const unlockedCount = eventClouds.filter(
      c => c.section === section && c.unlocked
    ).length;

    if (unlockedCount === sectionCloudCount) {
      this.unlockBadge(section);
      wx.showToast({ title: `${this.getBadgeName(section)} 已获得！`, icon: 'success', duration: 2000 });
    }

    // 乐观更新已完成，缓存已保存，无需额外云同步（后端云函数开发中）
  },

  getBadgeName(section) {
    const badge = this.data.badges.find(b => b.section === section);
    return badge ? badge.name : '';
  },

  unlockEventCloud(cloudId) {
    const eventClouds = this.data.eventClouds.map(item => {
      if (item.id === cloudId && !item.unlocked) {
        this.createParticleExplosion(item);
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({ eventClouds });

    if (!this.data.animationFrameId && this.data.showCloudPanel) {
      this.startAnimationLoop();
    }
  },

  createParticleExplosion(cloud) {
    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: cloud.color,
      });
    }

    const explosions = [...this.data.particleExplosions, {
      cloudId: cloud.id,
      particles: particles,
      age: 0,
      duration: 1500,
    }];

    this.setData({ particleExplosions: explosions });
  },

  startAnimationLoop() {
    const animate = () => {
      const explosions = this.data.particleExplosions.map(exp => {
        exp.age += 16;
        exp.particles = exp.particles.map(p => {
          return {
            ...p,
            x: p.x + p.vx * 0.1,
            y: p.y + p.vy * 0.1,
            vy: p.vy + 0.05,
            life: 1 - (exp.age / exp.duration),
          };
        }).filter(p => p.life > 0);
        return exp;
      }).filter(exp => exp.age < exp.duration);

      this.setData({ particleExplosions: explosions });

      if (explosions.length > 0) {
        this.data.animationFrameId = setTimeout(animate, 16);
      } else {
        this.data.animationFrameId = null;
      }
    };

    this.data.animationFrameId = setTimeout(animate, 16);
  },

  // 发放徽章（调用 grantBadge 云函数）
  unlockBadge(sectionId) {
    const badge = this.data.badges.find(b => b.section === sectionId);
    if (!badge || badge.unlocked) return;

    // 乐观更新UI
    const badges = this.data.badges.map(item => {
      if (item.section === sectionId && !item.unlocked) {
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({
      badges,
      newBadges: true,
      badgeNotification: badge,
    });

    this.saveProgressCache(this.data.eventClouds, badges);

    if (this._badgeNotificationTimer) {
      clearTimeout(this._badgeNotificationTimer);
    }
    this._badgeNotificationTimer = setTimeout(() => {
      this.setData({ badgeNotification: null });
    }, 3000);

    // 上报到云端
    cloudUtil.grantBadge({ badgeId: badge.id }).then(res => {
      if (res.code === 0) {
        console.log('徽章发放成功:', res.data);
      } else if (res.code === 1004) {
        console.log('徽章已存在（幂等）');
      }
    }).catch(err => {
      console.error('徽章发放失败:', err);
    });
  },

  toggleClouds() {
    wx.navigateTo({
      url: '/pages/cloud/cloud',
      fail: (err) => {
        console.error('导航到云图失败:', err);
        wx.showToast({ title: '页面加载失败', icon: 'error' });
      },
    });
  },

  toggleBadge() {
    this.setData({
      showBadgePanel: !this.data.showBadgePanel,
      showAIPanel: false,
      newBadges: false,
    });
  },

  toggleAI() {
    this.setData({
      showAIPanel: !this.data.showAIPanel,
      showBadgePanel: false,
    });
  },

  toggleMore() {
    wx.showActionSheet({
      itemList: ['关于项目', '反馈建议', '分享'],
      success(res) {
        console.log(res.tapIndex);
      },
      fail(res) {
        console.log(res.errMsg);
      },
    });
  },

  onCanvasTap(e) {
    const query = wx.createSelectorQuery();
    query.select('#cloudMapCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;

        const width = res[0].width;
        const height = res[0].height;
        const x = e.detail.x;
        const y = e.detail.y;

        let foundCloud = null;

        this.data.eventClouds.forEach((cloud) => {
          const cloudX = cloud.x * width;
          const cloudY = cloud.y * height;
          const dist = Math.sqrt((x - cloudX) ** 2 + (y - cloudY) ** 2);

          if (dist < 30) {
            foundCloud = cloud;
            this.setData({ selectedCloud: cloud });

            if (this._infoTimer) {
              clearTimeout(this._infoTimer);
            }
            this._infoTimer = setTimeout(() => {
              this.setData({ selectedCloud: null });
            }, 3000);
          }
        });
      });
  },

  onUnload() {
    if (this.data.animationFrameId) {
      clearTimeout(this.data.animationFrameId);
    }
  },
});
