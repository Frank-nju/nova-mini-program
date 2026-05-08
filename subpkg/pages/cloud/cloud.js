const cloudUtil = require('../../../cloudUtil.js');

// ─── 辅助：判断 timelineNodes 是否包含某节点 ───
function hasNode(tl, id) {
  return tl.indexOf(id) >= 0;
}

// ─── 解锁规则：cloudNodeId → 需要哪些 story timelineNode 完成 ───
// timelineNodes 来自 exhibitProgress 缓存，格式 ['n1','n2',...]，对应故事页的进度
// 每个规则返回 true/false，表示该节点是否应解锁
const UNLOCK_RULES = {
  // 中心节点：所有其他 8 个节点解锁后才亮
  'node_0': function (tl) {
    var allIds = ['node_1','node_2','node_3','node_4','node_5','node_6','node_7','node_8'];
    return allIds.every(function (nid) { return UNLOCK_RULES[nid](tl); });
  },
  // section 1: n1-n6
  'node_1': function (tl) { return hasNode(tl, 'n1'); },
  'node_2': function (tl) { return ['n1','n2','n3','n4','n5','n6'].every(function (id) { return hasNode(tl, id); }); },
  // section 2: n7-n12
  'node_3': function (tl) { return hasNode(tl, 'n7'); },
  'node_4': function (tl) { return ['n7','n8','n9'].every(function (id) { return hasNode(tl, id); }); },
  'node_5': function (tl) { return ['n7','n8','n9','n10','n11','n12'].every(function (id) { return hasNode(tl, id); }); },
  // section 4: n19-n24
  'node_6': function (tl) { return hasNode(tl, 'n19'); },
  'node_7': function (tl) { return ['n19','n20','n21','n22','n23','n24'].every(function (id) { return hasNode(tl, id); }); },
  // section 5: n25-n30
  'node_8': function (tl) { return ['n25','n26','n27','n28','n29','n30'].every(function (id) { return hasNode(tl, id); }); },
};

// ─── 连线解锁规则：8条连线 → 映射到30个故事节点(n1-n30) ───
// 每条连线的点亮条件 = 其目标节点的解锁条件
// key 格式: 'fromNodeId->toNodeId'
var CONNECTION_UNLOCK_RULES = {
  // 3条放射连线(中心→各阶段入口)
  'node_0->node_1': function (tl) { return hasNode(tl, 'n1'); },
  'node_0->node_6': function (tl) { return hasNode(tl, 'n19'); },
  'node_0->node_7': function (tl) { return ['n19','n20','n21','n22','n23','n24'].every(function (id) { return hasNode(tl, id); }); },
  // 2条时间连线(章节内推进)
  'node_1->node_2': function (tl) { return ['n1','n2','n3','n4','n5','n6'].every(function (id) { return hasNode(tl, id); }); },
  'node_3->node_4': function (tl) { return ['n7','n8','n9'].every(function (id) { return hasNode(tl, id); }); },
  'node_4->node_5': function (tl) { return ['n7','n8','n9','n10','n11','n12'].every(function (id) { return hasNode(tl, id); }); },
  // 1条逻辑连线(发现→荣誉)
  'node_6->node_7': function (tl) { return ['n19','n20','n21','n22','n23','n24'].every(function (id) { return hasNode(tl, id); }); },
  // 1条精神传承连线(荣誉→遗产)
  'node_7->node_8': function (tl) { return ['n25','n26','n27','n28','n29','n30'].every(function (id) { return hasNode(tl, id); }); },
};

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
    cloudReady: false,
    isDev: false,
  },

  onLoad() {
    var self = this;
    // 开发版/体验版显示调试重置按钮，正式版隐藏
    try {
      var accountInfo = wx.getAccountInfoSync();
      var envVersion = accountInfo.miniProgram.envVersion;
      if (envVersion === 'develop' || envVersion === 'trial') {
        this.setData({ isDev: true });
      }
    } catch (e) {}
    cloudUtil.getCloudNodes().then(function (res) {
      if (res.code === 0 && res.data && res.data.nodes && res.data.nodes.length > 0) {
        self.buildFromCloud(res.data.nodes, res.data.connections || []);
        self.setData({ cloudReady: true });
        console.log('[cloud] 云端数据加载完成, 节点:', res.data.nodes.length, '连线:', (res.data.connections || []).length);
        // 初始化 Canvas 连线
        setTimeout(function () { self.drawLines(); }, 200);
      } else {
        console.error('[cloud] 云端数据为空，无法渲染云图');
        wx.showToast({ title: '云图数据加载失败', icon: 'error' });
      }
      // 加载完成后刷新解锁状态
      self.refreshUnlockedStatus();
      // 如果 onShow 先触发过，补一次刷新
      if (self._pendingRefresh) {
        self._pendingRefresh = false;
        self.refreshUnlockedStatus();
      }
    }).catch(function (err) {
      console.error('[cloud] 云端数据获取失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'error' });
    });
  },

  onShow() {
    if (this.data.cloudReady) {
      this.refreshUnlockedStatus();
    } else {
      // 云端数据尚未加载完成，标记待刷新
      this._pendingRefresh = true;
    }
  },

  onUnload() {
    this.stopAnimation();
  },

  // ─── 从云端数据构建全部节点 ───
  buildFromCloud(cloudNodes, cloudConnections) {
    // 归一化 nodeId（数据库中有 nodeId 和 nodeid 两种写法）
    var normId = function (cn) { return cn.nodeId || cn.nodeid || ''; };
    const parseNum = function (id) {
      const m = (id || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    const sorted = [...cloudNodes].sort(function (a, b) {
      return parseNum(normId(a)) - parseNum(normId(b));
    });

    // cloudNodeId → localIndex 映射
    const idToIndex = {};
    sorted.forEach(function (cn, i) { idToIndex[normId(cn)] = i; });

    // 转换 connections
    const connPairs = [];
    if (cloudConnections && cloudConnections.length > 0) {
      for (var ci = 0; ci < cloudConnections.length; ci++) {
        var conn = cloudConnections[ci];
        var fromIdx = idToIndex[conn.from];
        var toIdx = idToIndex[conn.to];
        if (fromIdx !== undefined && toIdx !== undefined) {
          connPairs.push({
            from: fromIdx,
            to: toIdx,
            fromNodeId: conn.from,
            toNodeId: conn.to,
            weight: conn.weight || 1,
            style: conn.style || 'solid',
            label: conn.label || '',
          });
        }
      }
    }
    this._cloudConnPairs = connPairs;

    // 构建节点
    var nodes = [];
    for (var i = 0; i < sorted.length; i++) {
      var cn = sorted[i];
      var label = cn.label;
      if (!label || typeof label !== 'string' || label.trim().length === 0) {
        label = '节点 ' + (i + 1);
      }
      label = label.replace(/&/g, '＆').replace(/</g, '＜').replace(/>/g, '＞');

      var bx = 375; // 默认居中
      var by = 667;
      if (cn.position && typeof cn.position === 'object') {
        var px = Number(cn.position.x);
        var py = Number(cn.position.y);
        if (!isNaN(px) && !isNaN(py)) {
          bx = px * 750;
          by = py * 1334;
        }
      }

      nodes.push({
        id: i,
        nodeId: normId(cn),
        section: cn.section || 0,
        type: cn.type || 'event',
        title: label,
        color: cn.color || '#64c8ff',
        shape: cn.shape || 'circle',
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        fx: 0,
        fy: 0,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        unlocked: false,
      });
    }

    this.setData({ nodes: nodes });
    console.log('[cloud] buildFromCloud 完成, 节点:', nodes.length, '连线对:', connPairs.length);
  },

  // ─── 刷新解锁状态（节点 + 连线） ───
  refreshUnlockedStatus() {
    var self = this;
    if (!this.data.nodes || this.data.nodes.length === 0) {
      console.warn('[cloud] refreshUnlockedStatus 跳过：节点数据为空');
      return;
    }

    // ─── 本地立即更新：读缓存 → 算节点+连线状态 → setData → 动画帧自动重绘 ───
    this._applyUnlockFromCache();

    // 异步从云端同步：只做补充合并，绝不覆盖本地已有的解锁
    cloudUtil.getUser().then(function (res) {
      if (res.code !== 0) return;
      var data = res.data || {};
      var progress = data.progress || {};
      var cloudTl = progress.timelineNodes || [];
      if (cloudTl.length === 0) {
        console.warn('[cloud] 云端 timelineNodes 为空，保留本地缓存');
        return;
      }
      console.log('[cloud] 云端同步 timelineNodes:', JSON.stringify(cloudTl));

      // 合并云端进度到本地缓存（只增不删）
      var localCache = wx.getStorageSync('exhibitProgress') || {};
      var localTl = localCache.timelineNodes || [];
      var merged = false;
      for (var i = 0; i < cloudTl.length; i++) {
        if (localTl.indexOf(cloudTl[i]) < 0) {
          localTl.push(cloudTl[i]);
          merged = true;
        }
      }
      if (merged) {
        wx.setStorageSync('exhibitProgress', {
          timelineNodes: localTl,
          badges: localCache.badges || [],
        });
        console.log('[cloud] 合并云端进度到本地:', JSON.stringify(localTl));
      }

      // 用合并后的列表更新节点（只开不关：已解锁的保持解锁）
      var currentNodes = self.data.nodes;
      var syncChanged = false;
      for (var j = 0; j < currentNodes.length; j++) {
        var node = currentNodes[j];
        var rule = UNLOCK_RULES[node.nodeId];
        var cloudUnlocked = rule ? rule(localTl) : false;
        if (cloudUnlocked && !node.unlocked) {
          console.log('[cloud] 云端同步点亮节点:', node.title, '(', node.nodeId, ')');
          node.unlocked = true;
          syncChanged = true;
        }
      }
      // 同步更新连线状态
      self._evalConnUnlocked(localTl);
      if (syncChanged) {
        self.setData({ nodes: currentNodes });
      }
    }).catch(function (err) {
      console.error('[cloud] 云端同步异常:', err);
    });
  },

  // ─── 从本地缓存立即应用解锁（节点+连线） ───
  // 注意：直接修改节点对象属性（不创建新对象），避免与 updateNodes() 的 setData 产生竞态
  _applyUnlockFromCache() {
    try {
      var cache = wx.getStorageSync('exhibitProgress') || {};
      var tl = cache.timelineNodes || [];
      console.log('[cloud] 读取缓存 timelineNodes:', JSON.stringify(tl));

      var nodes = this.data.nodes;
      var changed = false;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var rule = UNLOCK_RULES[node.nodeId];
        var unlocked = rule ? rule(tl) : false;
        if (unlocked !== node.unlocked) {
          if (unlocked) {
            console.log('[cloud] 节点点亮:', node.title, '(', node.nodeId, ')');
          }
          node.unlocked = unlocked;
          changed = true;
        }
      }

      // 同步更新连线点亮状态
      this._evalConnUnlocked(tl);

      if (changed) {
        this.setData({ nodes: nodes });
      }
    } catch (e) {
      console.error('[cloud] 读取缓存失败:', e);
    }
  },

  // ─── 根据 timelineNodes 计算每条连线的点亮状态 ───
  _evalConnUnlocked(tl) {
    var pairs = this._cloudConnPairs;
    if (!pairs || pairs.length === 0) return;
    var connUnlocked = [];
    for (var i = 0; i < pairs.length; i++) {
      var key = pairs[i].fromNodeId + '->' + pairs[i].toNodeId;
      var rule = CONNECTION_UNLOCK_RULES[key];
      var lit = rule ? rule(tl) : false;
      connUnlocked.push(lit);
      if (lit) {
        console.log('[cloud] 连线点亮:', pairs[i].label || key);
      }
    }
    this._connUnlocked = connUnlocked;
  },

  // ─── Canvas 初始化 ───
  drawLines() {
    var query = wx.createSelectorQuery();
    var self = this;
    query.select('#lineCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0]) {
        console.error('[cloud] Canvas 获取失败');
        return;
      }
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      var sys = wx.getSystemInfoSync();
      self._rpxToPx = sys.windowWidth / 750;

      self.setData({
        canvas: canvas,
        ctx: ctx,
        canvasWidth: width,
        canvasHeight: height,
      });
      self.startAnimation();
    });
  },

  // ─── 动画 ───
  startAnimation() {
    if (this.data.animating) return;
    this.setData({ animating: true });
    this._frameCount = 0;
    this.animateFrame();
  },

  stopAnimation() {
    if (this._animFrameId) {
      clearTimeout(this._animFrameId);
      this._animFrameId = null;
    }
    this.setData({ animating: false });
  },

  animateFrame() {
    if (!this.data.animating) return;
    this.updateNodes();
    this.drawFrame();
    this._animFrameId = setTimeout(() => this.animateFrame(), 16);
  },

  updateNodes() {
    var nodes = this.data.nodes;
    var w = 750;
    var h = 1334;
    var centerX = w / 2;
    var centerY = h / 2;
    var gravity = 0.003;
    var damping = 0.998;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = centerX - (n.baseX + n.fx);
      var dy = centerY - (n.baseY + n.fy);
      n.vx += dx * gravity * 0.01;
      n.vy += dy * gravity * 0.01;
      n.fx += n.vx;
      n.fy += n.vy;
      n.vx *= damping;
      n.vy *= damping;
      if (n.fx < -60) { n.fx = -60; n.vx *= -0.5; }
      if (n.fx > 60)  { n.fx = 60;  n.vx *= -0.5; }
      if (n.fy < -60) { n.fy = -60; n.vy *= -0.5; }
      if (n.fy > 60)  { n.fy = 60;  n.vy *= -0.5; }
      n.x = n.baseX + n.fx;
      n.y = n.baseY + n.fy;
    }

    this._frameCount++;
    if (this._frameCount % 3 === 0) {
      this.setData({ nodes: [...nodes] });
    }
  },

  drawFrame() {
    var ctx = this.data.ctx;
    var w = this.data.canvasWidth;
    if (!ctx || !w) return;
    ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    this.drawParticles(ctx);
    this.drawConnections(ctx);
    this.drawHoverGlow(ctx);
  },

  // ─── 背景粒子 ───
  drawParticles(ctx) {
    if (!this._bgParticles) {
      this._bgParticles = [];
      var pxW = this.data.canvasWidth;
      var pxH = this.data.canvasHeight;
      for (var i = 0; i < 40; i++) {
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
    var pxW = this.data.canvasWidth;
    var pxH = this.data.canvasHeight;
    for (var i = 0; i < this._bgParticles.length; i++) {
      var p = this._bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = pxW;
      if (p.x > pxW) p.x = 0;
      if (p.y < 0) p.y = pxH;
      if (p.y > pxH) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(68, 170, 255, ' + p.alpha + ')';
      ctx.fill();
    }
  },

  // ─── 绘制连线（使用 CONNECTION_UNLOCK_RULES 判定点亮） ───
  drawConnections(ctx) {
    var nodes = this.data.nodes;
    var r = this._rpxToPx || 0.5;
    var pairs = this._cloudConnPairs;
    var connUnlocked = this._connUnlocked || [];
    if (!pairs || pairs.length === 0) return;

    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var a = nodes[pair.from];
      var b = nodes[pair.to];
      if (!a || !b) continue;

      var ax = (a.baseX + a.fx) * r;
      var ay = (a.baseY + a.fy) * r;
      var bx = (b.baseX + b.fx) * r;
      var by = (b.baseY + b.fy) * r;

      var isLit = connUnlocked[i] === true;
      var alpha = isLit ? 0.5 : 0.1;
      var color = isLit
        ? 'rgba(68, 170, 255, ' + alpha + ')'
        : 'rgba(100, 140, 180, ' + alpha + ')';

      ctx.beginPath();
      ctx.moveTo(ax, ay);

      if (pair.style === 'dashed') {
        // 虚线用分段绘制
        var dx = bx - ax;
        var dy = by - ay;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var segs = Math.floor(dist / (8 * r));
        for (var s = 0; s < segs; s += 2) {
          var t0 = s / segs;
          var t1 = Math.min((s + 1) / segs, 1);
          ctx.moveTo(ax + dx * t0, ay + dy * t0);
          ctx.lineTo(ax + dx * t1, ay + dy * t1);
        }
      } else {
        var cpX = (ax + bx) / 2;
        var cpY = Math.min(ay, by) - 30 * r;
        ctx.quadraticCurveTo(cpX, cpY, bx, by);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = (isLit ? 1.5 : 0.8) * Math.min((pair.weight || 1) / 2, 1.5);
      ctx.stroke();
    }
  },

  // ─── 悬停发光 ───
  drawHoverGlow(ctx) {
    var hoveredNode = this.data.hoveredNode;
    if (hoveredNode === null || hoveredNode === undefined || hoveredNode < 0) return;
    var node = this.data.nodes.find(function (n) { return n.id === hoveredNode; });
    if (!node) return;

    var r = this._rpxToPx || 0.5;
    var x = (node.baseX + node.fx) * r;
    var y = (node.baseY + node.fy) * r;

    var gradient = ctx.createRadialGradient(x, y, 0, x, y, 40 * r);
    gradient.addColorStop(0, node.unlocked ? 'rgba(68, 170, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(x, y, 40 * r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  },

  // ─── 触摸交互 ───
  handleTouchStart(e) {
    var touches = e.touches;
    if (touches.length === 1) {
      this.setData({
        lastTouchX: touches[0].clientX,
        lastTouchY: touches[0].clientY,
      });
      var r = this._rpxToPx || 0.5;
      var touchX = touches[0].clientX / r;
      var touchY = touches[0].clientY / r;
      var closest = null;
      var minDist = 80;
      var nodes = this.data.nodes;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = n.x - touchX;
        var dy = n.y - touchY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = n.id;
        }
      }
      this.setData({ hoveredNode: closest });
    } else if (touches.length === 2) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      this.setData({ lastDistance: Math.sqrt(dx * dx + dy * dy), hoveredNode: null });
    }
  },

  handleTouchMove(e) {
    var touches = e.touches;
    if (touches.length === 2) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (this.data.lastDistance > 0) {
        var scale = this.data.mapScale + (distance - this.data.lastDistance) * 0.005;
        var newScale = Math.min(Math.max(scale, this.data.scaleMin), this.data.scaleMax);
        this.setData({ mapScale: newScale, lastDistance: distance });
      }
    } else if (touches.length === 1) {
      var deltaX = touches[0].clientX - this.data.lastTouchX;
      var deltaY = touches[0].clientY - this.data.lastTouchY;
      this.setData({
        offsetX: this.data.offsetX + deltaX,
        offsetY: this.data.offsetY + deltaY,
        lastTouchX: touches[0].clientX,
        lastTouchY: touches[0].clientY,
      });
    }
  },

  handleTouchEnd() {
    this.setData({ lastDistance: 0, hoveredNode: null });
  },

  // ─── 节点点击 → 进入对应章节故事 ───
  onStarTap(e) {
    var id = e.currentTarget.dataset.id;
    var node = this.data.nodes.find(function (n) { return n.id === id; });
    if (!node) return;

    if (!node.unlocked) {
      wx.showToast({ title: '尚未解锁', icon: 'none' });
      return;
    }

    // 跳转到该节点所属 section 的第一个故事
    var section = node.section || 1;
    wx.navigateTo({
      url: '/subpkg/pages/story/story?section=' + section + '&story=0',
      fail: function () {
        wx.showToast({ title: '故事加载失败', icon: 'error' });
      },
    });
  },

  // ─── 从故事页返回时解锁 ───
  unlockEventCloudByStory(section, storyIndex) {
    // 因为不能改其他前端代码，这里通过刷新缓存来响应解锁
    // story.js 的 _saveProgressToCache 已经直接写入了 exhibitProgress
    this.refreshUnlockedStatus();
  },

  saveProgressCache() {
    // 只读刷新，不写缓存（写入由 story.js 的 _saveProgressToCache 负责）
    this.refreshUnlockedStatus();
  },

  // ─── 缩放控制 ───
  zoomIn() {
    var newScale = Math.min(this.data.mapScale * 1.2, this.data.scaleMax);
    this.setData({ mapScale: newScale });
  },

  zoomOut() {
    var newScale = Math.max(this.data.mapScale / 1.2, this.data.scaleMin);
    this.setData({ mapScale: newScale });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 调试：重置所有进度（清除本地缓存 + 云端数据）
  debugReset() {
    var self = this;
    wx.showModal({
      title: '重置进度',
      content: '将清除本地和云端所有进度，节点全部变暗。确定继续？',
      success: function (modalRes) {
        if (!modalRes.confirm) return;
        wx.showLoading({ title: '重置中...', mask: true });

        // 1. 清除本地缓存
        try {
          wx.removeStorageSync('exhibitProgress');
          console.log('[cloud] 调试：已清除本地缓存');
        } catch (e) {
          console.warn('[cloud] 清除本地缓存失败:', e);
        }

        // 2. 调用云函数清除云端数据
        cloudUtil.resetProgress().then(function (res) {
          wx.hideLoading();
          if (res.code === 0) {
            console.log('[cloud] 调试：已重置云端进度');
            wx.showToast({ title: '已重置', icon: 'success', duration: 1500 });
          } else {
            console.warn('[cloud] 云端重置返回非0:', res);
            wx.showToast({ title: '云端重置异常', icon: 'none', duration: 1500 });
          }
          // 3. 无论云端是否成功，本地立即将全部节点设为暗
          self._applyUnlockFromCache();
        }).catch(function (err) {
          wx.hideLoading();
          console.error('[cloud] 云端重置失败:', err);
          wx.showToast({ title: '云端重置失败', icon: 'none', duration: 1500 });
          // 本地仍然重置
          self._applyUnlockFromCache();
        });
      },
    });
  },
});
