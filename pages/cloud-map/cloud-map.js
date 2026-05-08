const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    cloudEvents: [],
    selectedNode: null,
    canvasWidth: 0,
    canvasHeight: 0,
  },

  onLoad() {
    console.log('星空图谱页面加载');
    
    // 获取窗口尺寸
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          canvasWidth: res.windowWidth,
          canvasHeight: res.windowHeight - 80 - 80, // 减去顶部和底部栏高度
        }, () => {
          this.loadCloudData();
        });
      },
    });

    // 缩放和位移变量
    this.canvasScale = 1;
    this.canvasOffsetX = 0;
    this.canvasOffsetY = 0;
    this.lastDistance = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.isDragging = false;
    this.animationFrameId = null;
  },

  onShow() {
    // 页面显示时，重新加载解锁状态
    this.loadUnlockedData();
    this.startAnimation();
  },

  onUnload() {
    // 清理动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  },

  // 加载云图数据（从云端获取）
  loadCloudData() {
    cloudUtil.getCloudNodes().then(res => {
      if (res.code !== 0 || !res.data) {
        console.warn('[cloud-map] 云端数据异常，使用兜底数据');
        this.loadFallbackData();
        return;
      }
      const { nodes, connections } = res.data;

      // 将云端 nodes 转换为页面所需格式
      const events = nodes.map((node, index) => {
        const section = Math.floor(index / 6) + 1;
        return {
          id: node.nodeId || ('cn_' + index),
          name: node.name || ('节点' + (index + 1)),
          section: section,
          storyIndex: index % 6,
          x: (node.position && node.position[0]) / 1000 || 0.5,
          y: (node.position && node.position[1]) / 1000 || 0.5,
          color: this.getSectionColor(section),
          unlocked: false,
          relatedWorks: node.relatedWorks || [],
          description: node.description || '',
        };
      });

      this.setData({ cloudEvents: events }, () => {
        this.loadUnlockedData();
      });
    }).catch(err => {
      console.error('[cloud-map] 获取云图数据失败:', err);
      this.loadFallbackData();
    });
  },

  // 兜底数据（云端失败时使用）
  loadFallbackData() {
    try {
      const cloudDataJson = require('./cloud-data.json');
      this.setData({
        cloudEvents: cloudDataJson.events || [],
      }, () => {
        this.loadUnlockedData();
      });
    } catch (e) {
      console.error('[cloud-map] 兜底数据加载失败:', e);
      this.initCanvas();
    }
  },

  // 根据章节获取颜色
  getSectionColor(section) {
    const colors = ['#64c8ff', '#c9a96e', '#ff69b4', '#ffd700', '#00ff00'];
    return colors[(section - 1) % colors.length];
  },

  // 加载解锁状态
  loadUnlockedData() {
    try {
      const unlockedData = wx.getStorageSync('exhibitProgress') || {};
      const unlockedClouds = unlockedData.unlockedClouds || [];

      // 更新云图事件的解锁状态
      let events = this.data.cloudEvents.map(event => ({
        ...event,
        unlocked: unlockedClouds.includes(event.id),
      }));

      this.setData({ cloudEvents: events }, () => {
        this.initCanvas();
      });
    } catch (e) {
      console.error('加载解锁数据失败:', e);
      this.initCanvas();
    }
  },

  // 初始化 Canvas
  initCanvas() {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select('#starMap')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Canvas 元素未找到');
            return;
          }

          try {
            this.canvas = res[0].node;
            this.ctx = this.canvas.getContext('2d');
            const dpr = wx.getSystemInfoSync().pixelRatio;

            this.canvas.width = res[0].width * dpr;
            this.canvas.height = res[0].height * dpr;
            this.ctx.scale(dpr, dpr);

            console.log('Canvas 初始化成功');
            this.startAnimation();
          } catch (e) {
            console.error('Canvas 初始化失败:', e);
          }
        });
    });
  },

  // 启动动画循环
  startAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = () => {
      this.drawStarMap();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  },

  // 绘制星空图谱
  drawStarMap() {
    if (!this.ctx) return;

    const width = this.data.canvasWidth;
    const height = this.data.canvasHeight;

    // 清空画布
    this.ctx.fillStyle = 'rgba(20, 20, 50, 0.2)';
    this.ctx.fillRect(0, 0, width, height);

    // 绘制背景渐变
    const bgGradient = this.ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, 'rgba(5, 10, 30, 0)');
    bgGradient.addColorStop(0.5, 'rgba(20, 10, 40, 0)');
    bgGradient.addColorStop(1, 'rgba(10, 20, 50, 0)');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    // 应用缩放和平移
    this.ctx.save();
    this.ctx.translate(width / 2 + this.canvasOffsetX, height / 2 + this.canvasOffsetY);
    this.ctx.scale(this.canvasScale, this.canvasScale);
    this.ctx.translate(-width / 2, -height / 2);

    // 绘制分支连线（6个篇章）
    this.drawBranchLines(width, height);

    // 绘制节点
    this.drawNodes(width, height);

    this.ctx.restore();
  },

  // 绘制分支连线
  drawBranchLines(width, height) {
    const events = this.data.cloudEvents;

    // 按篇章分组
    for (let section = 1; section <= 5; section++) {
      const sectionEvents = events.filter(e => e.section === section);
      
      if (sectionEvents.length > 1) {
        // 绘制该篇章的连线
        for (let i = 0; i < sectionEvents.length - 1; i++) {
          const e1 = sectionEvents[i];
          const e2 = sectionEvents[i + 1];

          const x1 = e1.x * width;
          const y1 = e1.y * height;
          const x2 = e2.x * width;
          const y2 = e2.y * height;

          // 绘制连线
          this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.quadraticCurveTo(
            (x1 + x2) / 2 + 20,
            (y1 + y2) / 2,
            x2,
            y2
          );
          this.ctx.stroke();
        }
      }
    }
  },

  // 绘制节点
  drawNodes(width, height) {
    const events = this.data.cloudEvents;
    const now = Date.now();

    events.forEach((event, index) => {
      // 计算摇摆偏移
      const wobbleX = Math.sin(now * 0.0005 + index) * 2;
      const wobbleY = Math.cos(now * 0.0005 + index * 0.5) * 2;

      const x = event.x * width + wobbleX;
      const y = event.y * height + wobbleY;

      if (event.unlocked) {
        // 已解锁节点 - 发光效果
        const glow = this.ctx.createRadialGradient(x, y, 0, x, y, 25);
        glow.addColorStop(0, event.color + '60');
        glow.addColorStop(1, event.color + '00');

        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // 呼吸效果
        const breatheRadius = 10 + Math.sin(now / 800) * 2;
        this.ctx.fillStyle = event.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, breatheRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 外环
        this.ctx.strokeStyle = event.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, breatheRadius + 3, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        // 未解锁节点 - 暗淡
        this.ctx.fillStyle = 'rgba(100, 100, 120, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      // 在节点旁绘制文字标签
      this.drawNodeLabel(x, y + 20, event.name, event.unlocked);
    });
  },

  // 绘制节点标签
  drawNodeLabel(x, y, text, unlocked) {
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = unlocked ? 'rgba(200, 220, 255, 0.8)' : 'rgba(150, 150, 170, 0.3)';

    // 截断过长文字
    if (text.length > 12) {
      text = text.substring(0, 12) + '...';
    }

    this.ctx.fillText(text, x, y);
  },

  // 手指触摸开始
  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // 双指缩放
      this.isDragging = false;
      this.lastDistance = this.calculateDistance(
        e.touches[0],
        e.touches[1]
      );
    }
  },

  // 手指移动
  onTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging) {
      // 单指拖拽
      const offsetX = e.touches[0].clientX - this.lastTouchX;
      const offsetY = e.touches[0].clientY - this.lastTouchY;

      this.canvasOffsetX += offsetX;
      this.canvasOffsetY += offsetY;

      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // 双指缩放
      const currentDistance = this.calculateDistance(
        e.touches[0],
        e.touches[1]
      );

      if (this.lastDistance > 0) {
        const scaleRatio = currentDistance / this.lastDistance;
        this.canvasScale = Math.max(0.5, Math.min(3, this.canvasScale * scaleRatio));
      }

      this.lastDistance = currentDistance;
    }
  },

  // 手指触摸结束
  onTouchEnd(e) {
    this.isDragging = false;
    this.lastDistance = 0;

    // 检测是否点击了节点
    if (e.changedTouches.length === 1) {
      this.detectNodeClick(e.changedTouches[0]);
    }
  },

  // 计算两点距离
  calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 检测节点点击
  detectNodeClick(touch) {
    const width = this.data.canvasWidth;
    const height = this.data.canvasHeight;

    // 转换触摸坐标到 Canvas 坐标系
    const clickX = (touch.clientX - width / 2 - this.canvasOffsetX) / this.canvasScale + width / 2;
    const clickY = (touch.clientY - height / 2 - this.canvasOffsetY) / this.canvasScale + height / 2;

    const events = this.data.cloudEvents;

    for (let event of events) {
      const nodeX = event.x * width;
      const nodeY = event.y * height;
      const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);

      if (distance < 20) {
        // 点击到了节点
        this.setData({
          selectedNode: {
            ...event,
            screenX: touch.clientX - 140,
            screenY: touch.clientY - 150,
          },
        });
        return;
      }
    }

    // 点击空白处，关闭信息面板
    this.setData({ selectedNode: null });
  },

  // 进入故事
  enterStory(e) {
    const nodeId = parseInt(e.currentTarget.dataset.id);
    const event = this.data.cloudEvents.find(e => e.id === nodeId);

    if (!event || !event.unlocked) {
      wx.showToast({
        title: '故事未解锁',
        icon: 'none',
      });
      return;
    }

    wx.navigateTo({
      url: `/subpkg/pages/story/story?section=${event.section}&story=${event.storyIndex}`,
    });
  },

  // 缩放控制
  zoomIn() {
    this.canvasScale = Math.min(3, this.canvasScale * 1.2);
  },

  zoomOut() {
    this.canvasScale = Math.max(0.5, this.canvasScale / 1.2);
  },

  resetView() {
    this.canvasScale = 1;
    this.canvasOffsetX = 0;
    this.canvasOffsetY = 0;
  },

  // 返回
  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },

  // Canvas 点击事件（备用）
  onCanvasTap(e) {
    // 处理 canvas 点击
    this.detectNodeClick(e.detail);
  },
});
