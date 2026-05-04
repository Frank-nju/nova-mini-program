const cloudUtil = require('../../cloudUtil.js');

Page({
  data: {
    eventClouds: [],
    backgroundStars: [],
    selectedEvent: null,
    canvasId: 'cloudCanvas',
    canvasWidth: 0,
    canvasHeight: 0,
  },

  onLoad() {
    console.log('cloudmap页面开始加载');

    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          canvasWidth: res.windowWidth,
          canvasHeight: res.windowHeight - 100,
        }, () => {
          this.initCanvas();
        });
      },
      fail: () => {
        console.error('获取系统信息失败');
      }
    });

    // 优先从云端获取云图数据
    this.loadCloudMapData();

    // 生成背景星星
    this.generateBackgroundStars();
  },

  // 从云端加载云图数据
  loadCloudMapData() {
    cloudUtil.getCloudMap().then(res => {
      if (res.code !== 0 || !res.data || !res.data.nodes) {
        console.warn('[cloudmap] 云端数据异常，使用兜底数据');
        this.generateSampleEvents();
        return;
      }
      const { nodes } = res.data;
      const colors = ['#64c8ff', '#c9a96e', '#ff69b4', '#ffd700', '#00ff00'];

      const events = nodes.map((node, index) => {
        const section = Math.floor(index / 6) + 1;
        const pos = node.position || [500, 500];
        return {
          id: index + 1,
          nodeId: node.nodeId,
          name: node.name || ('节点' + (index + 1)),
          section: section,
          storyIndex: index % 6,
          unlocked: false,
          color: colors[(section - 1) % colors.length],
          x: pos[0] / 1000,
          y: pos[1] / 1000,
          vx: (Math.random() - 0.5) * 0.001,
          vy: (Math.random() - 0.5) * 0.001,
          relatedWorks: node.relatedWorks || [],
          description: node.description || '',
        };
      });

      this.setData({ eventClouds: events });
      console.log('[cloudmap] 云端数据加载成功, 节点数:', events.length);
    }).catch(err => {
      console.error('[cloudmap] 获取云图数据失败:', err);
      this.generateSampleEvents();
    });
  },

  // 初始化canvas
  initCanvas() {
    console.log('初始化canvas');
    const query = wx.createSelectorQuery();
    query.select('#cloudCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        console.log('canvas查询结果:', res);
        if (res && res[0]) {
          try {
            this.canvas = res[0].node;
            this.ctx = this.canvas.getContext('2d');
            // 设置canvas分辨率
            const dpr = wx.getSystemInfoSync().pixelRatio;
            this.canvas.width = res[0].width * dpr;
            this.canvas.height = res[0].height * dpr;
            this.ctx.scale(dpr, dpr);

            console.log('canvas初始化成功，开始动画');
            this.startAnimation();
          } catch (e) {
            console.error('canvas初始化失败:', e);
            wx.showToast({
              title: '画布加载失败',
              icon: 'error',
            });
          }
        } else {
          console.error('未找到canvas元素');
          wx.showToast({
            title: '画布未找到',
            icon: 'error',
          });
        }
      });
  },

  // 生成示例事件数据（兜底）
  generateSampleEvents() {
    const events = [];
    const colors = ['#64c8ff', '#c9a96e', '#ff69b4', '#ffd700', '#00ff00'];

    for (let i = 1; i <= 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 100 + Math.random() * 100;
      events.push({
        id: i,
        name: `事件 ${i}`,
        section: Math.ceil(i / 6),
        storyIndex: (i - 1) % 6,
        unlocked: Math.random() > 0.6,
        color: colors[Math.floor(i / 6) % colors.length],
        x: 0.5 + (Math.cos(angle) * radius) / 500,
        y: 0.5 + (Math.sin(angle) * radius) / 500,
        vx: (Math.random() - 0.5) * 0.001,
        vy: (Math.random() - 0.5) * 0.001,
      });
    }

    this.setData({ eventClouds: events });
  },

  // 生成背景星星
  generateBackgroundStars() {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    this.setData({ backgroundStars: stars });
  },

  // 启动动画循环
  startAnimation() {
    const animate = () => {
      this.updateNodes();
      this.drawCloud();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },

  // 更新节点位置
  updateNodes() {
    const events = this.data.eventClouds;
    const centerX = 0.5;
    const centerY = 0.5;

    events.forEach(event => {
      // 轻微浮动
      event.x += event.vx;
      event.y += event.vy;

      // 边界检测
      if (event.x < 0.05 || event.x > 0.95) event.vx *= -1;
      if (event.y < 0.05 || event.y > 0.95) event.vy *= -1;

      // 向中心吸引力
      const dx = centerX - event.x;
      const dy = centerY - event.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.3) {
        event.vx += dx * 0.00002;
        event.vy += dy * 0.00002;
      }

      // 阻尼
      event.vx *= 0.998;
      event.vy *= 0.098;
    });
  },

  // 绘制云图
  drawCloud() {
    if (!this.ctx) return;

    const { canvasWidth, canvasHeight, eventClouds, backgroundStars } = this.data;
    const ctx = this.ctx;

    // 清空canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 1)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制背景星星
    backgroundStars.forEach(star => {
      ctx.beginPath();
      ctx.arc(
        star.x * canvasWidth,
        star.y * canvasHeight,
        star.size,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });

    // 绘制连接线
    for (let i = 0; i < eventClouds.length; i++) {
      for (let j = i + 1; j < eventClouds.length; j++) {
        const event1 = eventClouds[i];
        const event2 = eventClouds[j];

        const x1 = event1.x * canvasWidth;
        const y1 = event1.y * canvasHeight;
        const x2 = event2.x * canvasWidth;
        const y2 = event2.y * canvasHeight;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(201, 169, 110, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 绘制节点
    eventClouds.forEach((event, index) => {
      const x = event.x * canvasWidth;
      const y = event.y * canvasHeight;
      const radius = event.unlocked ? 8 : 5;

      // 发光效果
      if (event.unlocked) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = event.color.replace(')', ',0.1)').replace('rgb', 'rgba');
        ctx.fill();
      }

      // 节点圆圈
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = event.color + (event.unlocked ? 'CC' : '33');
      ctx.fill();
      ctx.strokeStyle = event.color + (event.unlocked ? 'FF' : '66');
      ctx.lineWidth = event.unlocked ? 1.5 : 1;
      ctx.stroke();
    });
  },

  // 点击事件节点
  onCanvasTap(e) {
    const { x, y } = e.detail;
    const { eventClouds, canvasWidth, canvasHeight } = this.data;

    // 检测点击范围内的节点
    for (const event of eventClouds) {
      const nodeX = event.x * canvasWidth;
      const nodeY = event.y * canvasHeight;
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);

      if (distance < 15) {
        this.setData({ selectedEvent: event });

        // 3秒后隐藏
        if (this._detailTimer) {
          clearTimeout(this._detailTimer);
        }
        this._detailTimer = setTimeout(() => {
          this.setData({ selectedEvent: null });
        }, 3000);
        return;
      }
    }
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onUnload() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this._detailTimer) {
      clearTimeout(this._detailTimer);
    }
  },
});
