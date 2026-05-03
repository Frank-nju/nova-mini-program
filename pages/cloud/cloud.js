const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    mapScale: 1.0,
    offsetX: 0,
    offsetY: 0,
    nodes: [],
    lastDistance: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    scaleMin: 0.5,
    scaleMax: 2.0,
    canvas: null,
    ctx: null,
  },

  onLoad() {
    this.initNodes();
    setTimeout(() => {
      this.drawLines();
    }, 300);
  },

  onShow() {
    this.refreshUnlockedStatus();
  },

  onUnload() {
    if (this.data.canvas) {
      this.data.canvas = null;
      this.data.ctx = null;
    }
  },

  // 初始化30个节点，5章，每章6个
  initNodes() {
    let nodes = [];
    const chapters = [
      { name: '序章',    centerX: 150,  centerY: 250 },
      { name: '生平',    centerX: 400,  centerY: 250 },
      { name: '治学',    centerX: 650,  centerY: 250 },
      { name: '科研',    centerX: 900,  centerY: 250 },
      { name: '尾声',    centerX: 550,  centerY: 750 },
    ];

    chapters.forEach((chapter, cIdx) => {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const radius = 100 + Math.random() * 40;

        nodes.push({
          id: cIdx * 6 + i,
          chapter: chapter.name,
          chapterIndex: cIdx,
          title: `${chapter.name}·事件${i + 1}`,
          x: chapter.centerX + Math.cos(angle) * radius,
          y: chapter.centerY + Math.sin(angle) * radius,
          unlocked: false
        });
      }
    });

    this.setData({ nodes });
  },

  // 从云端读取解锁状态（替代本地存储）
  // 优先从本地缓存读取，再异步从云端同步
  refreshUnlockedStatus() {
    // 先从本地缓存读取（立即可用）
    try {
      const cache = wx.getStorageSync('exhibitProgress') || {};
      const timelineNodes = cache.timelineNodes || [];
      console.log('[cloud] 读取缓存:', JSON.stringify(cache));

      const nodes = this.data.nodes.map(node => {
        // node.id 是 0-29，nodeId 应该是 1-30
        const nodeId = 'n' + (node.id + 1);
        const unlocked = timelineNodes.includes(nodeId);
        if (unlocked) console.log('[cloud] 节点点亮:', node.title, '->', nodeId, 'id=', node.id);
        return { ...node, unlocked };
      });

      this.setData({ nodes });
      setTimeout(() => this.drawLines(), 100);
    } catch (e) {
      console.error('读取缓存失败:', e);
    }

    // 再异步从云端同步（只有云端成功时才覆盖）
    cloudUtil.getUser().then(res => {
      if (res.code !== 0) {
        console.log('[cloud] 云端同步失败，保留本地缓存数据');
        return;
      }
      const data = res.data || {};
      const progress = data.progress || {};
      const timelineNodes = progress.timelineNodes || [];

      const nodes = this.data.nodes.map(node => {
        const nodeId = 'n' + (node.id + 1);
        return { ...node, unlocked: timelineNodes.includes(nodeId) };
      });

      this.setData({ nodes });
      setTimeout(() => this.drawLines(), 100);
    }).catch(() => {});
  },

  // 绘制分支连线
  drawLines() {
    const query = wx.createSelectorQuery();
    query.select('#lineCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) {
        console.error('Canvas 获取失败');
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const width = res[0].width;
      const height = res[0].height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      this.setData({
        canvas: canvas,
        ctx: ctx
      });

      // 绘制连线
      this.renderLines(ctx, width, height);
    });
  },

  // 实际绘制逻辑
  renderLines(ctx, width, height) {
    const { nodes } = this.data;

    // 清空画布
    ctx.fillStyle = 'rgba(0, 8, 20, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // 分组绘制连线（同章节的节点连线）
    for (let chapter = 0; chapter < 5; chapter++) {
      const chapterNodes = nodes.filter(n => n.chapterIndex === chapter);
      
      if (chapterNodes.length < 2) continue;

      ctx.strokeStyle = 'rgba(68, 170, 255, 0.2)';
      ctx.lineWidth = 1;

      // 连接相邻节点
      for (let i = 0; i < chapterNodes.length; i++) {
        const node1 = chapterNodes[i];
        const node2 = chapterNodes[(i + 1) % chapterNodes.length];

        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);

        // 使用二次贝塞尔曲线
        const cpX = (node1.x + node2.x) / 2;
        const cpY = Math.min(node1.y, node2.y) - 40;
        ctx.quadraticCurveTo(cpX, cpY, node2.x, node2.y);
        ctx.stroke();
      }
    }
  },

  // 触摸开始
  handleTouchStart(e) {
    const touches = e.touches;
    if (touches.length === 1) {
      this.setData({
        lastTouchX: touches[0].clientX,
        lastTouchY: touches[0].clientY
      });
    } else if (touches.length === 2) {
      // 计算初始距离
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.setData({ lastDistance: distance });
    }
  },

  // 触摸移动 - 双指缩放核心
  handleTouchMove(e) {
    const touches = e.touches;

    if (touches.length === 2) {
      // 双指缩放
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.data.lastDistance > 0) {
        // 计算缩放比例
        const scale = this.data.mapScale + (distance - this.data.lastDistance) * 0.005;
        
        // 限制缩放范围
        const newScale = Math.min(Math.max(scale, this.data.scaleMin), this.data.scaleMax);
        this.setData({
          mapScale: newScale,
          lastDistance: distance
        });
      }
    } else if (touches.length === 1) {
      // 单指拖拽
      const deltaX = touches[0].clientX - this.data.lastTouchX;
      const deltaY = touches[0].clientY - this.data.lastTouchY;

      this.setData({
        offsetX: this.data.offsetX + deltaX,
        offsetY: this.data.offsetY + deltaY,
        lastTouchX: touches[0].clientX,
        lastTouchY: touches[0].clientY
      });
    }
  },

  // 触摸结束
  handleTouchEnd(e) {
    this.setData({
      lastDistance: 0
    });
  },

  // 星星点击
  onStarTap(e) {
    const id = e.currentTarget.dataset.id;
    const node = this.data.nodes.find(n => n.id === id);

    if (!node) return;

    const content = node.unlocked 
      ? '这是该事件的详细描述内容...'
      : '该事件尚未解锁，请先阅读对应章节。';

    wx.showModal({
      title: node.title,
      content: content,
      showCancel: !node.unlocked,
      confirmText: node.unlocked ? '进入故事' : '知道了',
      success: (res) => {
        if (res.confirm && node.unlocked) {
          // 进入故事页面
          wx.navigateTo({
            url: `/pages/story/story?section=${node.chapterIndex + 1}&story=${node.id % 6}`
          });
        }
      }
    });
  },

  // 手动缩放
  zoomIn() {
    const newScale = Math.min(this.data.mapScale * 1.2, this.data.scaleMax);
    this.setData({ mapScale: newScale });
  },

  zoomOut() {
    const newScale = Math.max(this.data.mapScale / 1.2, this.data.scaleMin);
    this.setData({ mapScale: newScale });
  },

  // 返回
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});

