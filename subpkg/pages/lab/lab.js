const cloudUtil = require('../../../cloudUtil.js');

Page({
  data: {
    labStep: 0,
    stepLabels: ['认识', '冷却', '磁场', '观察', '镜像', '揭示', '完成', '寄语'],

    // 温度 / 磁场
    labTemperature: 0,
    labFieldStrength: 0,
    labCanAdvance: false,

    // 观察数据
    labObserveCount: 0,
    labRecordUp: 0,
    labRecordDown: 0,

    // Canvas
    labCanvasWidth: 0,
    labCanvasHeight: 0,
    labCtx: null,
    labParticles: [],
    labAnimFrameId: null,

    // 粒子特效
    showLabOutro: false,
    labOutroAlpha: 1,
    labOutroParticles: [],
    labOutroPhase: 'converge',
    labOutroStartTime: 0,
  },

  onLoad() {
    setTimeout(() => this._initCanvas(), 300);
  },

  onUnload() {
    this._stopAnim();
  },

  onHide() {
    this._stopAnim();
  },

  // ===== 导航 =====
  nextStep() {
    if (this.data.labStep === 8) return;
    const next = this.data.labStep + 1;
    this._goToStep(next);
  },

  prevStep() {
    if (this.data.labStep <= 0) return;
    const prev = this.data.labStep - 1;
    this._goToStep(prev);
  },

  _goToStep(step) {
    this._stopAnim();
    this.setData({
      labStep: step,
      labParticles: [],
      labCanAdvance: this._getCanAdvanceForStep(step),
    });
    // 震动反馈已移除
    setTimeout(() => this._initCanvas(), 100);
  },

  _getCanAdvanceForStep(step) {
    if (step === 2) return this.data.labTemperature >= 300; // 必须降到0K(300-300=0)
    if (step === 3) return this.data.labFieldStrength >= 80;
    if (step === 4) return true; // 直接展示结果，无需交互
    return step !== 0;
  },

  // ===== Canvas 初始化 =====
  _initCanvas() {
    const { labStep } = this.data;
    // Step 4 不需要 Canvas
    if (labStep === 4) return;

    const query = wx.createSelectorQuery();
    query.select('#labCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          setTimeout(() => this._initCanvas(), 200);
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        this.setData({
          labCtx: ctx,
          labCanvasWidth: res[0].width,
          labCanvasHeight: res[0].height,
        });
        this._drawScene();
      });
  },

  // ===== 场景绘制（根据步骤） =====
  _drawScene() {
    const { labCtx, labCanvasWidth, labCanvasHeight, labStep } = this.data;
    if (!labCtx) return;
    const ctx = labCtx;
    const w = labCanvasWidth;
    const h = labCanvasHeight;
    ctx.clearRect(0, 0, w, h);

    if (labStep === 1) {
      this._drawNucleus(ctx, w, h);
    } else if (labStep === 2) {
      this._drawCooling(ctx, w, h);
    } else if (labStep === 3) {
      this._drawField(ctx, w, h);
    } else if (labStep === 5) {
      this._drawMirror(ctx, w, h);
    } else if (labStep === 6) {
      this._drawReveal(ctx, w, h);
    }
    // Step 7 和 8 是结果页和书信页，不需要 Canvas 动画

    // 持续动画
    if (labStep >= 1 && labStep <= 6) {
      this.data.labAnimFrameId = setTimeout(() => this._drawScene(), 50);
    }
  },

  // Step 1: 原子核
  _drawNucleus(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.45;
    const r = 50;
    const time = Date.now() / 1000;

    // 辉光
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
    ctx.fill();

    // 主体
    const g = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, r);
    g.addColorStop(0, '#5a9ae5');
    g.addColorStop(0.7, '#2a5a8a');
    g.addColorStop(1, '#1a3a5a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 质子/中子
    ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + time * 0.3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 标签
    ctx.fillStyle = '#f0ede6';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Co-60', cx, cy + 6);
  },

  // Step 2: 冷却
  _drawCooling(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.45;
    const temp = this.data.labTemperature;
    const actualTemp = 300 - temp;
    const align = actualTemp > 200 ? actualTemp / 300 : 0;
    const glowAlpha = 0.15 + align * 0.35; // 降低辉光强度

    // 原子核发光效果
    if (align > 0.3) {
      const nucleusGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + align * 40);
      nucleusGlow.addColorStop(0, `rgba(100, 200, 255, ${glowAlpha})`);
      nucleusGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = nucleusGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 80 + align * 40, 0, Math.PI * 2);
      ctx.fill();
    }

    this._drawNucleusSimple(ctx, cx, cy, 40);

    // 自旋箭头 - 降低闪烁频率 (3000ms)
    const n = 12;
    for (let i = 0; i < n; i++) {
      let a;
      if (align > 0.7) {
        a = -Math.PI / 2 + (Math.random() - 0.5) * (1 - align) * Math.PI * 1.5;
      } else {
        a = (i / n) * Math.PI * 2 + Date.now() / 3000; // 从2000改为3000，降低闪烁频率
      }
      const sx = cx + Math.cos(a) * 50;
      const sy = cy + Math.sin(a) * 50;
      const ex = cx + Math.cos(a) * 68;
      const ey = cy + Math.sin(a) * 68;
      const alpha = 0.2 + align * 0.4; // 降低透明度
      const lineWidth = 1.5 + align * 1.5;

      // 箭头辉光
      if (align > 0.5) {
        ctx.shadowColor = `rgba(100, 200, 255, ${alpha * 0.5})`;
        ctx.shadowBlur = 8 * align;
      }

      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.shadowBlur = 0; // 重置阴影

      ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 低温时添加霜冻效果 - 优化视觉
    if (actualTemp > 150) {
      const frostAlpha = Math.min(0.25, (actualTemp - 150) / 150 * 0.25);
      ctx.fillStyle = `rgba(150, 220, 255, ${frostAlpha})`;
      for (let i = 0; i < 20; i++) {
        const fx = Math.random() * w;
        const fy = Math.random() * h * 0.7 + h * 0.3; // 只在下半部分
        const size = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(fx, fy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  _drawNucleusSimple(ctx, cx, cy, r) {
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(cx - 8, cy - 8, 0, cx, cy, r);
    g.addColorStop(0, '#5a9ae5');
    g.addColorStop(0.7, '#2a5a8a');
    g.addColorStop(1, '#1a3a5a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  },

  // Step 3: 磁场
  _drawField(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.55;
    const strength = this.data.labFieldStrength;

    this._drawNucleusSimple(ctx, cx, cy, 35);

    // 磁力线
    const n = 6;
    for (let i = 0; i < n; i++) {
      const offset = (i - (n - 1) / 2) * 22;
      const alpha = 0.1 + strength / 100 * 0.5;
      ctx.strokeStyle = `rgba(255, 105, 180, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy + offset);
      ctx.lineTo(cx + 100, cy + offset);
      ctx.stroke();
      ctx.setLineDash([]);
      // 箭头
      const arrowX = cx + 100;
      ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(arrowX, cy + offset - 5);
      ctx.lineTo(arrowX + 8, cy + offset);
      ctx.lineTo(arrowX, cy + offset + 5);
      ctx.fill();
    }

    // 自旋排列
    const align = strength / 100;
    for (let i = 0; i < 8; i++) {
      let a = -Math.PI / 2 + (Math.random() - 0.5) * (1 - align) * Math.PI * 1.5;
      const sx = cx + Math.cos(a) * 48;
      const sy = cy + Math.sin(a) * 48;
      const ex = cx + Math.cos(a) * 65;
      const ey = cy + Math.sin(a) * 65;
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + align * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  },

  // Step 5: 镜像
  _drawMirror(ctx, w, h) {
    const midX = w / 2;
    const centerY = h * 0.55;

    // 镜面
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(midX, h * 0.25);
    ctx.lineTo(midX, h * 0.85);
    ctx.stroke();
    ctx.setLineDash([]);

    // 左侧真实
    this._drawNucleusSimple(ctx, w / 4, centerY, 25);
    this._drawElectrons(ctx, w / 4, centerY, 'up', 60);

    // 右侧镜像
    this._drawNucleusSimple(ctx, w * 3 / 4, centerY, 25);
    this._drawElectrons(ctx, w * 3 / 4, centerY, 'down', 60);
  },

  _drawElectrons(ctx, cx, cy, dir, halfW) {
    const time = Date.now() / 1000;
    const n = 15;
    for (let i = 0; i < n; i++) {
      const seed = (i * 7.3 + time * 2) % 1;
      const progress = seed;
      const spread = Math.sin(i * 3.7 + time * 3) * 8;
      const dist = progress * halfW;

      let ex, ey;
      if (dir === 'up') {
        ex = cx + spread;
        ey = cy - dist;
      } else {
        ex = cx + spread;
        ey = cy + dist;
      }
      const alpha = 1 - progress;
      ctx.fillStyle = `rgba(100, 255, 180, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // Step 6: 揭示
  _drawReveal(ctx, w, h) {
    const midX = w / 2;
    const centerY = h * 0.55;

    // 镜面（虚）
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, h * 0.25);
    ctx.lineTo(midX, h * 0.85);
    ctx.stroke();
    ctx.setLineDash([]);

    // 两边都向上
    this._drawNucleusSimple(ctx, w / 4, centerY, 25);
    this._drawElectrons(ctx, w / 4, centerY, 'up', 60);
    this._drawNucleusSimple(ctx, w * 3 / 4, centerY, 25);
    this._drawElectrons(ctx, w * 3 / 4, centerY, 'up', 60);

    // 冲击文字
    const pulse = 0.6 + Math.sin(Date.now() / 400) * 0.4;
    ctx.fillStyle = `rgba(255, 99, 71, ${pulse})`;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('两边都向上！', midX, h * 0.72);
    ctx.fillStyle = `rgba(201, 169, 110, ${pulse})`;
    ctx.font = 'bold 22px "STKaiti", serif';
    ctx.fillText('宇称不守恒！', midX, h * 0.82);
  },

  // ===== 交互处理 =====
  onTempNextTap() {
    if (this.data.labTemperature >= 300) {
      this.nextStep();
    } else {
      wx.showModal({
        title: '提示',
        content: '请继续降温至绝对零度(0K)以解锁下一步',
        showCancel: false,
        confirmText: '继续实验'
      });
    }
  },

  onFieldNextTap() {
    if (this.data.labFieldStrength >= 80) {
      this.nextStep();
    } else {
      wx.showModal({
        title: '提示',
        content: '请继续增强磁场至80%以上以解锁下一步',
        showCancel: false,
        confirmText: '继续实验'
      });
    }
  },

  onTempChanging(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      this.setData({ labTemperature: value, labCanAdvance: value >= 300 });
    }
  },

  onTempChange(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      this.setData({ labTemperature: value, labCanAdvance: value >= 300 });
      // 震动反馈已移除
    }
  },

  onFieldChanging(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      this.setData({ labFieldStrength: value, labCanAdvance: value >= 80 });
    }
  },

  onFieldChange(e) {
    const value = Number(e.detail.value);
    if (!isNaN(value)) {
      this.setData({ labFieldStrength: value, labCanAdvance: value >= 80 });
      // 震动反馈已移除
    }
  },

  // 揭晓结果
  revealResult() {
    wx.showModal({
      title: '实验结果',
      content: '镜子里和镜子外的电子都向同一个方向飞！这意味着——在弱相互作用中，宇称不守恒！点击确定进入完成页。',
      showCancel: false,
      confirmText: '确定',
      success: () => {
        this.nextStep();
      },
    });
  },

  // ===== 返回展馆 =====
  closeLab() {
    this._stopAnim();
    this._saveLabProgress();
    wx.navigateBack();
  },

  backToExhibit() {
    this._stopAnim();
    this._saveLabProgress();
    wx.navigateBack();
  },

  backToExhibitWithBadge() {
    this._stopAnim();
    // 授予追光终章勋章
    cloudUtil.grantBadge({ badgeId: 'final_chapter' }).catch(() => {});
    this._saveLabProgress();
    wx.navigateBack();
  },

  _saveLabProgress() {
    // 更新进度：标记镜像实验室已完成
    cloudUtil.updateProgress({
      type: 'cloud',
      nodeId: 'lab_completed',
      action: 'complete',
    }).catch(() => {});
  },

  _stopAnim() {
    if (this.data.labAnimFrameId) {
      clearTimeout(this.data.labAnimFrameId);
      this.data.labAnimFrameId = null;
    }
    this.setData({ labParticles: [] });
  },

  showNucleusInfo(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'structure') {
      wx.showModal({
        title: '钴-60 原子结构',
        content: '钴-60 (⁶⁰Co) 是钴的一种放射性同位素，拥有27个质子和33个中子。其原子核不稳定，通过β衰变转变为镍-60。',
        showCancel: false,
        confirmText: '知道了',
      });
    } else if (type === 'decay') {
      wx.showModal({
        title: 'β衰变原理',
        content: '钴-60发生β衰变时，原子核内的一个中子转变为质子，同时释放出一个电子(β粒子)和一个反中微子。这个过程是吴健雄实验的关键。',
        showCancel: false,
        confirmText: '知道了',
      });
    }
  },
});
