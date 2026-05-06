const cloudUtil = require('../../../cloudUtil.js');

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
    canvasWidth: 0,
    canvasHeight: 0,
    animating: false,
    hoveredNode: null,
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
    this.stopAnimation();
    if (this.data.canvas) {
      this.data.canvas = null;
      this.data.ctx = null;
    }
  },

  // 启动动画循环
  startAnimation() {
    if (this.data.animating) return;
    this.setData({ animating: true });
    this._frameCount = 0;
    this.animateFrame();
  },

  // 停止动画循环
  stopAnimation() {
    if (this._animFrameId) {
      clearTimeout(this._animFrameId);
      this._animFrameId = null;
    }
    this.setData({ animating: false });
  },

  // 动画帧
  animateFrame() {
    if (!this.data.animating) return;
    this.updateNodes();
    this.drawFrame();
    this._animFrameId = setTimeout(() => this.animateFrame(), 16); // ~60fps
  },

  // 更新节点位置（浮动、边界、中心引力）
  // 所有坐标单位均为 rpx
  updateNodes() {
    const nodes = this.data.nodes;
    // 使用典型 rpx 范围（750×1334）
    const w = 750;
    const h = 1334;
    const centerX = w / 2;
    const centerY = h / 2;
    const gravity = 0.003;
    const damping = 0.998;

    nodes.forEach(n => {
      // 中心引力
      const dx = centerX - (n.baseX + n.fx);
      const dy = centerY - (n.baseY + n.fy);
      n.vx += dx * gravity * 0.01;
      n.vy += dy * gravity * 0.01;

      // 更新位置
      n.fx += n.vx;
      n.fy += n.vy;

      // 阻尼
      n.vx *= damping;
      n.vy *= damping;

      // 边界反弹
      if (n.fx < -60) { n.fx = -60; n.vx *= -0.5; }
      if (n.fx > 60) { n.fx = 60; n.vx *= -0.5; }
      if (n.fy < -60) { n.fy = -60; n.vy *= -0.5; }
      if (n.fy > 60) { n.fy = 60; n.vy *= -0.5; }

      // 同步 display 坐标（rpx，供 WXML 使用）
      n.x = n.baseX + n.fx;
      n.y = n.baseY + n.fy;
    });

    // 每3帧更新一次 WXML 节点位置（减少 setData 开销）
    this._frameCount++;
    if (this._frameCount % 3 === 0) {
      this.setData({ nodes: [...nodes] });
    }
  },

  // 绘制一帧
  drawFrame() {
    const { ctx, canvasWidth, canvasHeight } = this.data;
    if (!ctx || !canvasWidth) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.drawParticles(ctx);
    this.drawConnections(ctx);
    this.drawHoverGlow(ctx);
  },

  // 绘制背景粒子
  drawParticles(ctx) {
    if (!this._bgParticles) {
      this._bgParticles = [];
      const pxW = this.data.canvasWidth;
      const pxH = this.data.canvasHeight;
      for (let i = 0; i < 40; i++) {
        this._bgParticles.push({
          x: Math.random() * pxW,
          y: Math.random() * pxH,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.3 + 0.1,
        });
      }
    }

    const pxW = this.data.canvasWidth;
    const pxH = this.data.canvasHeight;
    this._bgParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = pxW;
      if (p.x > pxW) p.x = 0;
      if (p.y < 0) p.y = pxH;
      if (p.y > pxH) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(68, 170, 255, ${p.alpha})`;
      ctx.fill();
    });
  },

  // 绘制节点连线
  drawConnections(ctx) {
    const nodes = this.data.nodes;
    const r = this._rpxToPx || 0.5;
    const connectDistPx = 180 * r;

    for (let chapter = 0; chapter < 5; chapter++) {
      const chapterNodes = nodes.filter(n => n.chapterIndex === chapter);

      for (let i = 0; i < chapterNodes.length; i++) {
        for (let j = i + 1; j < chapterNodes.length; j++) {
          const a = chapterNodes[i];
          const b = chapterNodes[j];
          const ax = (a.baseX + a.fx) * r;
          const ay = (a.baseY + a.fy) * r;
          const bx = (b.baseX + b.fx) * r;
          const by = (b.baseY + b.fy) * r;
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

          if (dist < connectDistPx) {
            const alpha = (1 - dist / connectDistPx) * 0.35;
            const isLit = a.unlocked || b.unlocked;
            const color = isLit ? `rgba(68, 170, 255, ${alpha})` : `rgba(100, 140, 180, ${alpha * 0.5})`;

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            const cpX = (ax + bx) / 2;
            const cpY = Math.min(ay, by) - 30 * r;
            ctx.quadraticCurveTo(cpX, cpY, bx, by);
            ctx.strokeStyle = color;
            ctx.lineWidth = isLit ? 1.5 : 0.8;
            ctx.stroke();
          }
        }
      }
    }
  },

  // 悬停发光效果
  drawHoverGlow(ctx) {
    const { hoveredNode } = this.data;
    if (!hoveredNode || hoveredNode < 0) return;
    const node = this.data.nodes.find(n => n.id === hoveredNode);
    if (!node) return;

    const r = this._rpxToPx || 0.5;
    const x = (node.baseX + node.fx) * r;
    const y = (node.baseY + node.fy) * r;

    // 外发光
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40 * r);
    gradient.addColorStop(0, node.unlocked ? 'rgba(68, 170, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(x, y, 40 * r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  },

  // 初始化30个节点，5章，每章6个
  initNodes() {
    let nodes = [];
    const chapters = [
      { name: '序章', centerX: 150,  centerY: 250, titles: ['诞生', '家风', '入浙大', '遇恩师', '立初心', '赴美'] },
      { name: '生平', centerX: 400,  centerY: 250, titles: ['初抵美', '伯克利', '获博士', '遇费米', '遇良缘', '稳根基'] },
      { name: '治学', centerX: 650,  centerY: 250, titles: ['严谨', '求极致', '长明灯', '守诚信', '授业', '传国际'] },
      { name: '科研', centerX: 900,  centerY: 250, titles: ['宇称假说', '受挑战', '克难关', '创技术', '破宇称', '耀光芒'] },
      { name: '尾声', centerX: 550,  centerY: 750, titles: ['忆往昔', '她力量', '归故乡', '设基金', '最后坚守', '永流传'] },
    ];

    chapters.forEach((chapter, cIdx) => {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const radius = 100 + Math.random() * 40;
        const bx = chapter.centerX + Math.cos(angle) * radius;
        const by = chapter.centerY + Math.sin(angle) * radius;

        nodes.push({
          id: cIdx * 6 + i,
          chapter: chapter.name,
          chapterIndex: cIdx,
          title: `${chapter.name}·${chapter.titles[i]}`,
          baseX: bx,
          baseY: by,
          x: bx,
          y: by,
          fx: 0,
          fy: 0,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
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

    // 再异步从云端同步（只有云端有数据时才覆盖，否则保留本地缓存）
    cloudUtil.getUser().then(res => {
      console.log('[cloud] 云端 getUser 返回:', JSON.stringify(res));
      if (res.code !== 0) {
        console.log('[cloud] 云端同步失败，保留本地缓存数据');
        return;
      }
      const data = res.data || {};
      const progress = data.progress || {};
      const timelineNodes = progress.timelineNodes || [];
      console.log('[cloud] 云端 progress.timelineNodes:', JSON.stringify(timelineNodes));
      console.log('[cloud] 当前 data.progress 全部字段:', JSON.stringify(progress));
      if (timelineNodes.length === 0) {
        console.warn('[cloud] 云端 timelineNodes 为空！保留本地缓存，不覆盖');
        return;
      }

      const nodes = this.data.nodes.map(node => {
        const nodeId = 'n' + (node.id + 1);
        return { ...node, unlocked: timelineNodes.includes(nodeId) };
      });

      this.setData({ nodes });
      setTimeout(() => this.drawLines(), 100);
    }).catch(err => {
      console.error('[cloud] 云端同步异常:', err);
    });
  },

  // 初始化 Canvas 并启动动画
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

      // rpx → CSS px 转换系数
      const sys = wx.getSystemInfoSync();
      this._rpxToPx = sys.windowWidth / 750;

      this.setData({
        canvas: canvas,
        ctx: ctx,
        canvasWidth: width,
        canvasHeight: height,
      });

      // 启动粒子动画（节点坐标用 rpx，更新节点时用 _rpxToPx 同步 display 坐标 px）
      this.startAnimation();
    });
  },

  // 触摸开始
  handleTouchStart(e) {
    const touches = e.touches;
    if (touches.length === 1) {
      this.setData({
        lastTouchX: touches[0].clientX,
        lastTouchY: touches[0].clientY
      });

      // 检测触摸点是否在节点附近（悬停发光）
      // 将 touch 坐标转换为 rpx
      const r = this._rpxToPx || 0.5;
      const touchX = touches[0].clientX / r;
      const touchY = touches[0].clientY / r;
      let closest = null;
      let minDist = 80; // rpx 单位

      this.data.nodes.forEach(n => {
        const dx = n.x - touchX;
        const dy = n.y - touchY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = n.id;
        }
      });

      this.setData({ hoveredNode: closest });
    } else if (touches.length === 2) {
      // 计算初始距离
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.setData({ lastDistance: distance, hoveredNode: null });
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
      lastDistance: 0,
      hoveredNode: null
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
            url: `/subpkg/pages/story/story?section=${node.chapterIndex + 1}&story=${node.id % 6}`
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

