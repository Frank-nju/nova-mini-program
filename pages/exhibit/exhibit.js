Page({
  data: {
    screenHeight: 0,
    currentSection: 'section-0',
    stars: [],
    
    // 面板状态
    showCloudPanel: false,
    showBadgePanel: false,
    showAIPanel: false,
    newBadges: false,
    selectedCloud: null,

    // 事件云图 - 节点数据
    eventClouds: [
      { id: 1, name: '序章开启', color: '#64c8ff', x: 0.2, y: 0.3, unlocked: false, particles: [] },
      { id: 2, name: '童年往事', color: '#c9a96e', x: 0.5, y: 0.2, unlocked: false, particles: [] },
      { id: 3, name: '求学之路', color: '#ff69b4', x: 0.8, y: 0.35, unlocked: false, particles: [] },
      { id: 4, name: '浙大岁月', color: '#ffd700', x: 0.35, y: 0.55, unlocked: false, particles: [] },
      { id: 5, name: '赴美留学', color: '#00ff00', x: 0.65, y: 0.6, unlocked: false, particles: [] },
      { id: 6, name: '宇称不守恒', color: '#ff6347', x: 0.5, y: 0.8, unlocked: false, particles: [] },
      { id: 7, name: '诺贝尔之光', color: '#9370db', x: 0.2, y: 0.75, unlocked: false, particles: [] },
      { id: 8, name: '伟大遗产', color: '#20b2aa', x: 0.8, y: 0.8, unlocked: false, particles: [] },
    ],

    // 徽章系统
    badges: [
      { id: 1, icon: '🌟', name: '序章探索', unlocked: false },
      { id: 2, icon: '📖', name: '生平完成', unlocked: false },
      { id: 3, icon: '✍️', name: '治学达人', unlocked: false },
      { id: 4, icon: '🔬', name: '科研专家', unlocked: false },
      { id: 5, icon: '👑', name: '知识王者', unlocked: false },
      { id: 6, icon: '🎖️', name: '尾声见证', unlocked: false },
    ],

    // 粒子爆炸效果数据
    particleExplosions: [],
    animationFrameId: null,
  },

  onLoad() {
    // 获取窗口高度
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          screenHeight: res.windowHeight,
        });
      },
    });
    
    this.generateStars();
  },
  
  // 生成星星数据
  generateStars() {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push(Math.random() * 100);
    }
    this.setData({ stars });
  },

  onScroll(e) {
    // 处理滚动事件
  },

  // 返回首页
  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },

  // 进入故事
  enterStory(e) {
    const section = e.currentTarget.dataset.section;
    const story = e.currentTarget.dataset.story || 0;
    
    // 保存进度和解锁云图
    this.unlockEventCloud(parseInt(section) + 1);
    
    // 显示加载提示并准备导航
    wx.showLoading({
      title: '故事加载中...',
      mask: true,
    });
    
    // 延迟导航以允许动画完成
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/story/story?section=${section}&story=${story}`,
        success: () => {
          // 导航成功，页面动画会自动播放
        },
        fail: () => {
          wx.showToast({
            title: '加载失败',
            icon: 'error',
            duration: 2000,
          });
        }
      });
    }, 800);
  },

  // 点亮事件云图 - 粒子爆炸效果
  unlockEventCloud(cloudId) {
    const eventClouds = this.data.eventClouds.map(item => {
      if (item.id === cloudId && !item.unlocked) {
        // 触发粒子爆炸
        this.createParticleExplosion(item);
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({ eventClouds });
    
    // 启动动画循环
    if (!this.data.animationFrameId && this.data.showCloudPanel) {
      this.startAnimationLoop();
    }
    
    // 重绘云图
    if (this.data.showCloudPanel) {
      setTimeout(() => {
        this.drawCloudMap();
      }, 100);
    }
  },

  // 创建粒子爆炸效果
  createParticleExplosion(cloud) {
    const particles = [];
    const particleCount = 40;
    const canvas = wx.createSelectorQuery().select('#cloudMapCanvas').fields({ node: true, size: true });
    
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

  // 启动动画循环
  startAnimationLoop() {
    const animate = () => {
      const explosions = this.data.particleExplosions.map(exp => {
        exp.age += 16; // 大约60fps
        exp.particles = exp.particles.map(p => {
          return {
            ...p,
            x: p.x + p.vx * 0.1,
            y: p.y + p.vy * 0.1,
            vy: p.vy + 0.05, // 重力效果
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

  // 完成章节，解锁徽章
  unlockBadge(badgeId) {
    const badges = this.data.badges.map(item => {
      if (item.id === badgeId) {
        return { ...item, unlocked: true };
      }
      return item;
    });
    this.setData({ 
      badges,
      newBadges: true,
    });
  },

  // 切换事件云图面板
  toggleClouds() {
    this.setData({
      showCloudPanel: !this.data.showCloudPanel,
      showBadgePanel: false,
      showAIPanel: false,
    });
    
    if (this.data.showCloudPanel) {
      setTimeout(() => {
        this.drawCloudMap();
        if (this.data.particleExplosions.length > 0 && !this.data.animationFrameId) {
          this.startAnimationLoop();
        }
      }, 300);
    }
  },

  // 绘制云图 - 包含粒子爆炸效果
  drawCloudMap() {
    const query = wx.createSelectorQuery();
    query.select('#cloudMapCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const width = res[0].width;
        const height = res[0].height;

        // 清空画布
        ctx.fillStyle = 'rgba(20, 20, 40, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // 绘制连接线
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.data.eventClouds.length; i++) {
          for (let j = i + 1; j < this.data.eventClouds.length; j++) {
            const cloud1 = this.data.eventClouds[i];
            const cloud2 = this.data.eventClouds[j];
            
            const x1 = cloud1.x * width;
            const y1 = cloud1.y * height;
            const x2 = cloud2.x * width;
            const y2 = cloud2.y * height;
            
            // 只绘制相邻节点的连线
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            if (dist < 250) {
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }
        }

        // 绘制粒子爆炸效果
        this.data.particleExplosions.forEach(explosion => {
          explosion.particles.forEach(particle => {
            const px = particle.x * width;
            const py = particle.y * height;
            
            ctx.fillStyle = this.adjustAlpha(particle.color, particle.life * 0.8);
            ctx.beginPath();
            ctx.arc(px, py, 4 * particle.life, 0, Math.PI * 2);
            ctx.fill();
            
            // 粒子发光
            ctx.strokeStyle = this.adjustAlpha(particle.color, particle.life * 0.5);
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        });

        // 绘制节点
        this.data.eventClouds.forEach((cloud, index) => {
          const x = cloud.x * width;
          const y = cloud.y * height;
          const radius = cloud.unlocked ? 16 : 12;
          
          // 绘制发光效果
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
          if (cloud.unlocked) {
            gradient.addColorStop(0, cloud.color + '60');
            gradient.addColorStop(1, cloud.color + '00');
          } else {
            gradient.addColorStop(0, 'rgba(100, 100, 100, 0.2)');
            gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(x - radius * 2, y - radius * 2, radius * 4, radius * 4);
          
          // 绘制节点 - 已解锁时显示呼吸效果
          if (cloud.unlocked) {
            const breatheScale = 1 + Math.sin(Date.now() / 800) * 0.2;
            ctx.fillStyle = this.adjustAlpha(cloud.color, 0.9 + Math.sin(Date.now() / 1000) * 0.1);
            ctx.beginPath();
            ctx.arc(x, y, radius * breatheScale, 0, Math.PI * 2);
            ctx.fill();
            
            // 呼吸边框
            ctx.strokeStyle = this.adjustAlpha(cloud.color, 1);
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 灰暗边框
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          // 绘制标签
          ctx.fillStyle = cloud.unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(100, 100, 100, 0.5)';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cloud.name, x, y + radius + 20);
        });
      });
  },

  // 调整颜色透明度
  adjustAlpha(color, alpha) {
    // 将hex颜色转为rgba
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  },

  // 切换徽章面板
  toggleBadge() {
    this.setData({
      showBadgePanel: !this.data.showBadgePanel,
      showCloudPanel: false,
      showAIPanel: false,
      newBadges: false,
    });
  },

  // 切换数字人面板
  toggleAI() {
    this.setData({
      showAIPanel: !this.data.showAIPanel,
      showCloudPanel: false,
      showBadgePanel: false,
    });
  },

  // 切换更多菜单
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

  // Canvas 点击事件
  onCanvasTap(e) {
    const query = wx.createSelectorQuery();
    query.select('#cloudMapCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const width = res[0].width;
        const height = res[0].height;
        // x, y 是相对于canvas的坐标
        const x = e.detail.x;
        const y = e.detail.y;
        
        let foundCloud = null;
        
        // 检查点击的云图节点
        this.data.eventClouds.forEach((cloud) => {
          const cloudX = cloud.x * width;
          const cloudY = cloud.y * height;
          const dist = Math.sqrt((x - cloudX) ** 2 + (y - cloudY) ** 2);
          
          if (dist < 30) {
            foundCloud = cloud;
            // 点击到了节点
            if (!cloud.unlocked) {
              // 自动解锁
              this.unlockEventCloud(cloud.id);
              // 显示解锁提示
              wx.showToast({
                title: cloud.name + ' 已解锁！',
                icon: 'success',
                duration: 1500,
              });
            }
            // 更新选中的云
            this.setData({
              selectedCloud: cloud,
            });
            
            // 3秒后自动隐藏信息框
            if (this._infoTimer) {
              clearTimeout(this._infoTimer);
            }
            this._infoTimer = setTimeout(() => {
              this.setData({
                selectedCloud: null,
              });
            }, 3000);
          }
        });
      });
  },

  // 页面销毁时清理
  onUnload() {
    if (this.data.animationFrameId) {
      clearTimeout(this.data.animationFrameId);
    }
  },
});
