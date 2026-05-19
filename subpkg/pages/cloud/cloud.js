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
  // 8条放射连线(中心→各节点)：必须全部节点点亮后才亮
  'node_0->node_1': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_2': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_3': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_4': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_5': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_6': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_7': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  'node_0->node_8': function (tl) { return UNLOCK_RULES['node_0'](tl); },
  // 2条时间连线(章节内推进)
  'node_1->node_2': function (tl) { return ['n1','n2','n3','n4','n5','n6'].every(function (id) { return hasNode(tl, id); }); },
  'node_2->node_3': function (tl) { return hasNode(tl, 'n7'); },
  'node_3->node_4': function (tl) { return ['n7','n8','n9'].every(function (id) { return hasNode(tl, id); }); },
  'node_4->node_5': function (tl) { return ['n7','n8','n9','n10','n11','n12'].every(function (id) { return hasNode(tl, id); }); },
  'node_5->node_6': function (tl) { return hasNode(tl, 'n19'); },
  // 1条逻辑连线(发现→荣誉)
  'node_6->node_7': function (tl) { return ['n19','n20','n21','n22','n23','n24'].every(function (id) { return hasNode(tl, id); }); },
  // 1条精神传承连线(荣誉→遗产)
  'node_7->node_8': function (tl) { return ['n25','n26','n27','n28','n29','n30'].every(function (id) { return hasNode(tl, id); }); },
};

// ─── 节点年份（吴健雄生平关键节点） ───
var NODE_YEARS = {
  'node_1': '1912',
  'node_2': '1923',
  'node_3': '1929',
  'node_4': '1934',
  'node_5': '1936',
  'node_6': '1944',
  'node_7': '1956',
  'node_8': '1997',
};

// ─── 外侧节点照片 FileID ───
var NODE_PHOTOS = {
  'node_1': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/1.jpg',
  'node_2': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/2.png',
  'node_3': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/3.png',
  'node_4': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/4.png',
  'node_5': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/5.png',
  'node_6': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/6.png',
  'node_7': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/7.png',
  'node_8': 'cloud://cloud1-0g0wg0plf9fb9ed2.636c-cloud1-0g0wg0plf9fb9ed2-1421412578/云图外侧8节点图片/8.png',
};

// ─── 外侧节点照片说明（待补充） ───
var NODE_PHOTO_CAPTIONS = {
  'node_1': '图1：浏河古镇街景',
  'node_2': '图2：江苏省立第二女子师范学校',
  'node_3': '图3：国立中央大学（正门）',
  'node_4': '图4：中央研究院院徽',
  'node_5': '图5：先生在伯克利实验照',
  'node_6': '图6：与美国NBS学者的合影',
  'node_7': '图7：与李政道等众多学者的合影',
  'node_8': '图8：墓志铭“一个永远的中国人”',
};

// ─── 外侧节点简介（状态 0-4 点击时弹出） ───
var NODE_DESCRIPTIONS = {
  'node_1': '吴健雄出生于江苏省太仓县浏河镇，自幼聪慧好学。',
  'node_2': '考入江苏省立第二女子师范学校，开始接受现代教育的熏陶。',
  'node_3': '以优异成绩考入国立中央大学物理系，正式踏上科学之路。',
  'node_4': '进入中央研究院物理研究所，开启核物理实验研究生涯。',
  'node_5': '赴美国加州大学伯克利分校深造，师从多位物理学大师。',
  'node_6': '作为唯一华人女性参与曼哈顿计划，解决关键核反应难题。',
  'node_7': '以精巧实验验证宇称不守恒理论，推动现代物理学发展。',
  'node_8': '吴健雄逝世，其科学遗产与精神激励一代代后人不断前行。',
};

// ─── 时间线刻度点年份（段间里程碑） ───
var TIMELINE_DOT_YEARS = {
  'node_1->node_2': ['1915', '1918', '1921'],
  'node_2->node_3': ['1925', '1927', '1928'],
  'node_3->node_4': ['1930', '1932', '1933'],
  'node_4->node_5': ['1935'],
  'node_5->node_6': ['1938', '1940', '1942'],
  'node_6->node_7': ['1948', '1952', '1954'],
  'node_7->node_8': ['1965', '1975', '1990'],
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
    zoomState: 4,
    canvas: null,
    ctx: null,
    canvasWidth: 0,
    canvasHeight: 0,
    animating: false,
    hoveredNode: null,
    selectedNode: null,
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
        // 预取照片临时链接，避免点击时延迟
        self._prefetchPhotos();
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

  // ─── 缩放状态 0~8（4=默认） ───
  _getZoomState() {
    var s = this.data.mapScale;
    var state = 4 - Math.round(Math.log(s) / Math.log(1.18));
    if (state < 0) state = 0;
    if (state > 8) state = 8;
    return state;
  },

  _updateZoomState() {
    var st = this._getZoomState();
    if (st !== this._zoomStatePending) {
      this._zoomStatePending = st;
      this._zoomStatePendingFrame = this._frameCount;
    }
    // 插值结束后或每 15 帧才更新 CSS 状态，让 CSS transition 有时间完成
    if (st !== this.data.zoomState && this._interpTarget === undefined) {
      this._flushZoomState(st);
    } else if (st !== this.data.zoomState && this._frameCount - (this._zoomStatePendingFrame || 0) >= 15) {
      this._flushZoomState(st);
    }
  },

  _flushZoomState(st) {
    if (st !== this.data.zoomState) {
      this.setData({ zoomState: st });
    }
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

      var cx = 375, cy = 667; // 设计稿中心
      var bx = cx;
      var by = cy;
      if (cn.position && typeof cn.position === 'object') {
        var px = Number(cn.position.x);
        var py = Number(cn.position.y);
        if (!isNaN(px) && !isNaN(py)) {
          // 以中心为原点扩散 20%，节点间距拉开
          var spread = 1.2;
          bx = cx + (px * 750 - cx) * spread;
          by = cy + (py * 1334 - cy) * spread;
        }
      }

      nodes.push({
        id: i,
        nodeId: normId(cn),
        section: cn.section || 0,
        type: cn.type || 'event',
        title: label,
        year: NODE_YEARS[normId(cn)] || '',
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

    // 物理数组独立于 data.nodes：每帧更新物理，每 4 帧快照到 data.nodes 供 WXML+Canvas 同步渲染
    this._physicsNodes = nodes.map(function (n) { return Object.assign({}, n); });
    this.setData({ nodes: nodes.map(function (n) { return Object.assign({}, n); }) });
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
      var pNodes = self._physicsNodes;
      var syncChanged = false;
      for (var j = 0; j < currentNodes.length; j++) {
        var node = currentNodes[j];
        var rule = UNLOCK_RULES[node.nodeId];
        var cloudUnlocked = rule ? rule(localTl) : false;
        if (cloudUnlocked && !node.unlocked) {
          console.log('[cloud] 云端同步点亮节点:', node.title, '(', node.nodeId, ')');
          node.unlocked = true;
          if (pNodes && pNodes[j]) pNodes[j].unlocked = true;
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
  // 同时更新 data.nodes（显示快照）和 _physicsNodes（物理数组），保持两者一致
  _applyUnlockFromCache() {
    try {
      var cache = wx.getStorageSync('exhibitProgress') || {};
      var tl = cache.timelineNodes || [];
      console.log('[cloud] 读取缓存 timelineNodes:', JSON.stringify(tl));

      var nodes = this.data.nodes;
      var pNodes = this._physicsNodes;
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
          if (pNodes && pNodes[i]) pNodes[i].unlocked = unlocked;
          changed = true;
        }
      }

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
    query.select('#lineCanvas').fields({ node: true, size: true });
    query.exec(function (res) {
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
      self._dpr = dpr;

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
    if (!this._orbitalParticles) this._initOrbitalParticles();
    this.animateFrame();
  },

  stopAnimation() {
    if (this._animFrameId) {
      this.data.canvas.cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
    this.setData({ animating: false });
  },

  animateFrame() {
    if (!this.data.animating) return;
    // 触摸期间暂停动画循环，由 touch handler 直接调用 drawFrame，
    // 使 setData 与 Canvas 指令在同一 JS tick 排队，减少双线程延迟
    if (this._isTouching) {
      var self = this;
      this._animFrameId = this.data.canvas.requestAnimationFrame(function () {
        self.animateFrame();
      });
      return;
    }
    this.updateNodes();
    this.drawFrame();
    var self = this;
    this._animFrameId = this.data.canvas.requestAnimationFrame(function () {
      self.animateFrame();
    });
  },

  updateNodes() {
    var nodes = this._physicsNodes;
    if (!nodes || nodes.length === 0) return;
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

    // ── 缩放插值：固定时长 ease-out，保证状态切换充分展开 ──
    var scaleChanged = false;
    if (this._interpTarget !== undefined) {
      var elapsed = this._frameCount - (this._interpStartFrame || 0);
      var dur = this._interpDuration || 15;
      var t = Math.min(1, elapsed / dur);
      t = 1 - Math.pow(1 - t, 3); // cubic ease-out
      this.data.mapScale = this._interpStart + (this._interpTarget - this._interpStart) * t;
      if (t >= 1) {
        this.data.mapScale = this._interpTarget;
        this._interpTarget = undefined;
      }
      scaleChanged = true;
      this._updateZoomState();
    }

    this._frameCount++;
    if (scaleChanged) {
      this.setData({ mapScale: this.data.mapScale });
    }
    if (this._frameCount % 4 === 0) {
      // 每 4 帧快照物理状态到 data.nodes，WXML 与 Canvas 同时使用同一份冻结位置，消除抖动
      var snapshot = nodes.map(function (n) { return Object.assign({}, n); });
      this.setData({ nodes: snapshot });
    }
    // 更新时钟/环中心为 node_0 实际动画位置
    for (var k = 0; k < nodes.length; k++) {
      if (nodes[k].nodeId === 'node_0') {
        this._clockCenterRpxX = nodes[k].baseX + nodes[k].fx;
        this._clockCenterRpxY = nodes[k].baseY + nodes[k].fy;
        break;
      }
    }
    // 更新轨道环 + 时钟粒子
    if (this._orbitalParticles) this._updateOrbitalParticles();
    if (this._clockParticles) {
      this._updateClockParticles();
    }
  },

  // ─── 时钟粒子系统（三层：放射流束 + 轨道环 + 核火星点） ───
  _initClockParticles() {
    var nodes = this._physicsNodes || this.data.nodes;
    var centerNode = null;
    for (var k = 0; k < nodes.length; k++) {
      if (nodes[k].nodeId === 'node_0') { centerNode = nodes[k]; break; }
    }
    var cx = centerNode ? centerNode.baseX : 375;
    var cy = centerNode ? centerNode.baseY : 667;
    this._clockCenterRpxX = cx;
    this._clockCenterRpxY = cy;

    // 计算各外节点距离，用于轨道环半径
    var nodeDists = [];
    for (var li = 0; li < 8; li++) {
      var node = null;
      var nid = 'node_' + (li + 1);
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].nodeId === nid) { node = nodes[j]; break; }
      }
      if (!node) continue;
      nodeDists.push(Math.sqrt(
        (node.baseX - cx) * (node.baseX - cx) +
        (node.baseY - cy) * (node.baseY - cy)
      ));
    }
    nodeDists.sort(function (a, b) { return a - b; });
    var avgDist = nodeDists.length > 0 ? nodeDists[Math.floor(nodeDists.length / 2)] : 300;

    var particles = [];

    // 1. 放射流束 — 8条射线×60 粒子，角度/末端每帧动态更新以追踪节点浮动
    var lineNodes = [];
    for (var li2 = 0; li2 < 8; li2++) {
      var snode = null;
      var snid = 'node_' + (li2 + 1);
      for (var j2 = 0; j2 < nodes.length; j2++) {
        if (nodes[j2].nodeId === snid) { snode = nodes[j2]; break; }
      }
      lineNodes.push(snode); // 存引用，每帧读取其 fx/fy
      if (!snode) continue;
      var staticAngle = Math.atan2(snode.baseY - cy, snode.baseX - cx);
      var staticMaxDist = Math.sqrt(
        (snode.baseX - cx) * (snode.baseX - cx) +
        (snode.baseY - cy) * (snode.baseY - cy)
      );
      for (var p = 0; p < 42; p++) {
        var t = p / 41;
        var ratio = p < 11 ? Math.pow(t, 1.5) : t;
        var baseDist = ratio * staticMaxDist;
        particles.push({
          type: 'stream',
          lineIdx: li2,
          angleOffset: (Math.random() - 0.5) * 0.08,
          angle: staticAngle + (Math.random() - 0.5) * 0.08,
          dist: baseDist + (Math.random() - 0.5) * 22,
          maxDist: staticMaxDist,
          alpha: 0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.032,
          size: 0.7 + Math.random() * 3.2,
          baseAlpha: p < 16 ? 0.45 + Math.random() * 0.5 : 0.1 + Math.random() * 0.35,
          baseDistRatio: ratio,
        });
      }
    }
    this._clockLineNodes = lineNodes;

    // 2. 核火星点 — 中心附近随机闪烁
    for (var si = 0; si < 35; si++) {
      particles.push({
        type: 'spark',
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 42,
        alpha: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.04 + Math.random() * 0.08,
        size: 0.4 + Math.random() * 2.2,
        baseAlpha: 0.35 + Math.random() * 0.6,
        sparkTimer: Math.random() * 2,
      });
    }

    this._clockParticles = particles;
  },

  _updateClockParticles() {
    var pts = this._clockParticles;
    // 动态追踪：当前中心和外节点位置
    var centerX = this._clockCenterRpxX || 375;
    var centerY = this._clockCenterRpxY || 667;
    var lineNodes = this._clockLineNodes || [];

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.phase += p.speed;

      if (p.type === 'stream') {
        // 每帧根据当前浮动位置重新计算射线角度和末端距离
        var ln = lineNodes[p.lineIdx];
        if (ln) {
          var curAngle = Math.atan2(
            (ln.baseY + ln.fy) - centerY,
            (ln.baseX + ln.fx) - centerX
          );
          p.angle = curAngle + p.angleOffset;
          p.maxDist = Math.sqrt(
            ((ln.baseX + ln.fx) - centerX) * ((ln.baseX + ln.fx) - centerX) +
            ((ln.baseY + ln.fy) - centerY) * ((ln.baseY + ln.fy) - centerY)
          );
        }
        var wave = 0.5 + 0.5 * Math.sin(p.phase);
        // 状态 7-8 缩放小，加大振幅和速度以保持肉眼可见的动态
        var boost = this.data.zoomState >= 7 ? 3.0 : 1.0;
        p.alpha = p.baseAlpha * (0.2 + 0.8 * wave);
        var targetDist = p.baseDistRatio * p.maxDist;
        p.dist += (targetDist - p.dist) * 0.3 + Math.sin(p.phase * 1.7) * 1.5 * boost;
        if (p.dist < 0.5) p.dist = 0.5;
        if (p.dist > p.maxDist) p.dist = p.maxDist;

      } else if (p.type === 'spark') {
        p.sparkTimer -= 0.016;
        if (p.sparkTimer <= 0) {
          // 重生
          p.angle = Math.random() * Math.PI * 2;
          p.dist = Math.random() * 35;
          p.sparkTimer = 0.2 + Math.random() * 1.6;
          p.alpha = p.baseAlpha;
        } else {
          p.alpha *= 0.86;
          if (p.alpha < 0.01) p.alpha = 0;
        }
      }
    }
  },

  // ─── 轨道环粒子系统（全部状态可见，4层同心旋转环） ───
  _initOrbitalParticles() {
    var nodes = this._physicsNodes || this.data.nodes;
    var centerNode = null;
    for (var k = 0; k < nodes.length; k++) {
      if (nodes[k].nodeId === 'node_0') { centerNode = nodes[k]; break; }
    }
    var cx = centerNode ? centerNode.baseX : 375;
    var cy = centerNode ? centerNode.baseY : 667;
    var nodeDists = [];
    for (var li = 0; li < 8; li++) {
      var node = null;
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].nodeId === 'node_' + (li + 1)) { node = nodes[j]; break; }
      }
      if (!node) continue;
      nodeDists.push(Math.sqrt(
        (node.baseX - cx) * (node.baseX - cx) +
        (node.baseY - cy) * (node.baseY - cy)
      ));
    }
    nodeDists.sort(function (a, b) { return a - b; });
    var avgDist = nodeDists.length > 0 ? nodeDists[Math.floor(nodeDists.length / 2)] : 300;

    var particles = [];
    var ringRadiiRpx = [avgDist * 0.2, avgDist * 0.4, avgDist * 0.62, avgDist * 0.84];
    for (var ri = 0; ri < 4; ri++) {
      var ringR = ringRadiiRpx[ri];
      for (var oi = 0; oi < 26; oi++) {
        particles.push({
          angle: (oi / 35) * Math.PI * 2 + Math.random() * 0.3,
          dist: ringR + (Math.random() - 0.5) * 25,
          orbitRadius: ringR,
          alpha: 0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.004 + ri * 0.005 + Math.random() * 0.006,
          size: 0.4 + Math.random() * 2.0,
          baseAlpha: 0.18 + Math.random() * 0.4,
        });
      }
    }
    this._orbitalParticles = particles;
  },

  _updateOrbitalParticles() {
    var pts = this._orbitalParticles;
    if (!pts) return;
    var boost = this.data.zoomState >= 7 ? 2.5 : 1.0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.phase += p.speed * boost;
      var wave = 0.5 + 0.5 * Math.sin(p.phase);
      p.alpha = p.baseAlpha * (0.35 + 0.65 * wave);
      p.angle += p.speed * 0.45 * boost;
      p.dist = p.orbitRadius + Math.sin(p.phase * 2.3) * 7 * boost;
    }
  },

  drawOrbitalParticles(ctx) {
    var pts = this._orbitalParticles;
    if (!pts || pts.length === 0) return;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var scx = cw / 2;
    var scy = ch / 2;
    var cx = this._clockCenterRpxX || 375;
    var cy = this._clockCenterRpxY || 667;
    var scCx = scx + (cx * r - scx + ox) * scale;
    var scCy = scy + (cy * r - scy + oy) * scale;

    ctx.save();
    ctx.shadowBlur = 7 * scale;
    ctx.shadowColor = 'rgba(255, 210, 80, 0.55)';
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p.alpha < 0.02) continue;
      var px = scCx + Math.cos(p.angle) * p.dist * r * scale;
      var py = scCy + Math.sin(p.angle) * p.dist * r * scale;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.85 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 235, 150, ' + (p.alpha * 0.85) + ')';
      ctx.fill();
    }
    ctx.restore();
  },

  // ─── 检查所有 radial 连线 + 中心节点是否已全部点亮 ───
  _allRadialLit() {
    var pairs = this._cloudConnPairs;
    var connUnlocked = this._connUnlocked;
    if (!pairs || !connUnlocked || pairs.length === 0) return false;
    // 中心节点 node_0 必须已点亮
    var nodes = this.data.nodes;
    var centerNode = nodes ? nodes.find(function (n) { return n.nodeId === 'node_0'; }) : null;
    if (!centerNode || !centerNode.unlocked) return false;
    // 所有 radial 连线必须已点亮
    var radialCount = 0;
    var radialLit = 0;
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].style === 'radial') {
        radialCount++;
        if (connUnlocked[i]) radialLit++;
      }
    }
    return radialCount > 0 && radialCount === radialLit;
  },

  drawFrame() {
    var ctx = this.data.ctx;
    var w = this.data.canvasWidth;
    if (!ctx || !w) return;
    ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    ctx.save();

    this.drawParticles(ctx);
    this.drawOrbitalParticles(ctx);

    // ── 浮点缩放状态 + smoothstep：所有视觉切换连续渐变 ──
    var rawScale = this.data.mapScale;
    var sf = 4 - Math.log(rawScale) / Math.log(1.18);
    if (sf < 0) sf = 0;
    if (sf > 8) sf = 8;

    function smoothstep(e0, e1, x) {
      var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    }

    var connAlpha = 1 - smoothstep(6.5, 7.5, sf);
    var centerRingA = 1 - smoothstep(6.8, 7.5, sf);
    var yearsAlpha = 1 - smoothstep(5.2, 6.0, sf);
    var particleA = smoothstep(6.5, 7.5, sf);
    var centerTextA = smoothstep(7.5, 8.0, sf);
    var nodeAlpha = 1 - smoothstep(7.6, 8.0, sf);
    var labelAlpha = nodeAlpha;  // 标签跟随节点一并淡出

    var allRadialLit = this._allRadialLit();

    // 连线 + 中心环
    if (connAlpha > 0.01) {
      ctx.globalAlpha = connAlpha;
      this.drawConnections(ctx);
      if (centerRingA > 0.01) {
        ctx.globalAlpha = Math.min(connAlpha, centerRingA);
        this._drawCenterRingGlow(ctx);
      }
      if (yearsAlpha > 0.01) {
        ctx.globalAlpha = Math.min(connAlpha, yearsAlpha);
        this.drawNodeYears(ctx);
      }
      ctx.globalAlpha = 1;
    }

    // 时钟粒子动效（仅全部 radial 点亮时）
    if (allRadialLit && particleA > 0.01) {
      ctx.globalAlpha = particleA;
      if (!this._clockParticles) this._initClockParticles();
      this.drawClockParticles(ctx);
      if (centerTextA > 0.01) {
        ctx.globalAlpha = Math.min(particleA, centerTextA);
        this.drawCenterText(ctx);
      }
      ctx.globalAlpha = 1;
    }
    this.drawHoverGlow(ctx);

    // Canvas 节点圆点（替代 WXML star-core，与连线完美同步）
    if (nodeAlpha > 0.01) {
      ctx.globalAlpha = nodeAlpha;
      this.drawNodes(ctx);
      ctx.globalAlpha = 1;
    }

    // Canvas 节点标签（替代 WXML star-text）
    if (labelAlpha > 0.01) {
      ctx.globalAlpha = labelAlpha;
      this.drawNodeLabels(ctx);
      ctx.globalAlpha = 1;
    }

    // 节点简介弹窗虚线连接
    if (this.data.selectedNode) {
      this.drawPopupDashLine(ctx);
    }

    ctx.restore();
  },

  // ─── 背景粒子 ───
  drawParticles(ctx) {
    if (!this._bgParticles) {
      this._bgParticles = [];
      var pxW = this.data.canvasWidth;
      var pxH = this.data.canvasHeight;
      for (var i = 0; i < 28; i++) {
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

  // ─── 计算连线端点裁剪到节点边缘（圆心→边界） ───
  _clipLine(aNode, bNode, ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) return { ax: ax, ay: ay, bx: bx, by: by };
    var rpxToPx = this._rpxToPx;
    var scale = this.data.mapScale;
    // 节点核心半径（rpx），与 WXSS star-core 尺寸一致 + 2rpx 重叠避免抗锯齿缝隙
    // is-center lit: 15, dark: 10; 普通 lit: 9, dark: 7（clip 收紧让线伸入节点更多）
    var getR = function (n) {
      if (!n) return 8;
      if (n.nodeId === 'node_0') return n.unlocked ? 15 : 10;
      return n.unlocked ? 9 : 7;
    };
    var ra = getR(aNode) * rpxToPx * scale;
    var rb = getR(bNode) * rpxToPx * scale;
    if (ra >= dist * 0.5) ra = dist * 0.3;
    if (rb >= dist * 0.5) rb = dist * 0.3;
    var ux = dx / dist;
    var uy = dy / dist;
    return {
      ax: ax + ux * ra,
      ay: ay + uy * ra,
      bx: bx - ux * rb,
      by: by - uy * rb,
    };
  },

  // ─── 绘制节点圆点（Canvas 替代 WXML star-core，与连线同坐标系完美同步） ───
  drawNodes(ctx) {
    var nodes = this.data.nodes;
    if (!nodes || nodes.length === 0) return;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;

    // 呼吸动画相位
    var breathe = 0.82 + 0.18 * Math.sin(this._frameCount * 0.07);

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var isLit = n.unlocked;
      var isCenter = n.nodeId === 'node_0';

      // 状态 7：隐藏中心节点，仅绘制外侧八节点
      if (isCenter && this.data.zoomState >= 7) continue;

      var px = (n.baseX + n.fx) * r;
      var py = (n.baseY + n.fy) * r;
      var sx = cx + (px - cx + ox) * scale;
      var sy = cy + (py - cy + oy) * scale;

      var radiusRpx, fillColor, glowColor, glowSize;

      if (isCenter && isLit) {
        // 中心点亮：微金柔光 35rpx
        radiusRpx = 17.5;
        fillColor = '#fffef7';
        glowColor = 'rgba(255,180,50,' + (0.45 * breathe).toFixed(2) + ')';
        glowSize = 60;
      } else if (isCenter) {
        // 中心暗态：22rpx 半透
        radiusRpx = 11;
        fillColor = 'rgba(255,255,255,0.25)';
        glowColor = null;
        glowSize = 0;
      } else if (isLit) {
        // 普通点亮：白色蓝光 18rpx
        radiusRpx = 9;
        fillColor = '#ffffff';
        glowColor = 'rgba(68,170,255,' + (0.6 * breathe).toFixed(2) + ')';
        glowSize = 20;
      } else {
        // 普通暗态：半透灰白 14rpx
        radiusRpx = 7;
        fillColor = 'rgba(255,255,255,0.15)';
        glowColor = null;
        glowSize = 0;
      }

      var radiusPx = radiusRpx * r * scale;

      ctx.beginPath();
      ctx.arc(sx, sy, radiusPx, 0, Math.PI * 2);

      if (glowColor && glowSize > 0) {
        ctx.save();
        ctx.shadowBlur = glowSize * r * scale;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.restore();
        // 内层高亮（模拟 CSS box-shadow 多层）
        ctx.beginPath();
        ctx.arc(sx, sy, radiusPx * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * breathe).toFixed(2) + ')';
        ctx.fill();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
    }
  },

  // ─── 绘制节点文字标签（Canvas 替代 WXML star-text） ───
  drawNodeLabels(ctx) {
    var nodes = this.data.nodes;
    if (!nodes || nodes.length === 0) return;
    var zs = this.data.zoomState;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var isCenter = n.nodeId === 'node_0';

      // 与原 WXML 规则一致：状态 7+ 全隐藏，状态 5-6 仅显中心
      if (zs >= 7) continue;
      if (zs >= 5 && !isCenter) continue;

      var px = (n.baseX + n.fx) * r;
      var py = (n.baseY + n.fy) * r;
      var sx = cx + (px - cx + ox) * scale;
      var sy = cy + (py - cy + oy) * scale;

      var labelOffsetRpx = isCenter ? (n.unlocked ? 26 : 18) : (n.unlocked ? 16 : 14);
      var labelY = sy + labelOffsetRpx * r * scale;
      var fontSizeRpx = isCenter ? (n.unlocked ? 30 : 24) : (n.unlocked ? 22 : 20);
      var fontSize = fontSizeRpx * r * scale;
      if (fontSize < 6) fontSize = 6;
      if (fontSize > 48) fontSize = 48;

      ctx.save();
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (n.unlocked) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10 * r * scale;
        ctx.shadowColor = 'rgba(68, 170, 255, 0.6)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      }

      ctx.fillText(n.title || '', sx, labelY);
      ctx.restore();
    }
  },

  // ─── 绘制连线（三种样式：radial 放射线 / solid 时间线 / dashed 虚线） ───
  drawConnections(ctx) {
    var nodes = this.data.nodes;
    var r = this._rpxToPx || 0.5;
    var pairs = this._cloudConnPairs;
    var connUnlocked = this._connUnlocked || [];
    if (!pairs || pairs.length === 0) return;

    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;

    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var a = nodes[pair.from];
      var b = nodes[pair.to];
      if (!a || !b) continue;

      // 节点内部坐标（rpx → px）
      var aix = (a.baseX + a.fx) * r;
      var aiy = (a.baseY + a.fy) * r;
      var bix = (b.baseX + b.fx) * r;
      var biy = (b.baseY + b.fy) * r;

      // 应用与 CSS transform 一致的缩放+平移
      var ax = cx + (aix - cx + ox) * scale;
      var ay = cy + (aiy - cy + oy) * scale;
      var bx = cx + (bix - cx + ox) * scale;
      var by = cy + (biy - cy + oy) * scale;

      var isLit = connUnlocked[i] === true;
      var style = pair.style || 'solid';
      // 裁剪端点至节点边缘
      var clipped = this._clipLine(a, b, ax, ay, bx, by);
      ax = clipped.ax; ay = clipped.ay; bx = clipped.bx; by = clipped.by;
      var cpX = cx + ((aix + bix) / 2 - cx + ox) * scale;
      var cpY = cy + (Math.min(aiy, biy) - 30 * r - cy + oy) * scale;

      if (style === 'dashed') {
        // ── dashed：蓝色虚线，不变 ──
        var dx = bx - ax;
        var dy = by - ay;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var segs = Math.floor(dist / (8 * r * scale));
        var dAlpha = isLit ? 0.5 : 0.1;
        ctx.strokeStyle = isLit ? 'rgba(180, 205, 195, ' + dAlpha + ')' : 'rgba(150, 155, 140, ' + dAlpha + ')';
        ctx.lineWidth = (isLit ? 1.5 : 0.8) * Math.min((pair.weight || 1) / 2, 1.5);
        ctx.beginPath();
        for (var s = 0; s < segs; s += 2) {
          var t0 = s / segs;
          var t1 = Math.min((s + 1) / segs, 1);
          ctx.moveTo(ax + dx * t0, ay + dy * t0);
          ctx.lineTo(ax + dx * t1, ay + dy * t1);
        }
        ctx.stroke();

      } else if (style === 'radial') {
        // ── radial：金色放射线，双层渲染 → 空灵立体感 ──
        if (isLit) {
          // ① 外层空灵光晕
          ctx.save();
          ctx.shadowBlur = 22 * scale;
          ctx.shadowColor = 'rgba(255, 180, 50, 0.45)';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.strokeStyle = 'rgba(255, 200, 80, 0.45)';
          ctx.lineWidth = 2.6 * scale;
          ctx.stroke();
          ctx.restore();

          // ② 内层高光亮脊（细，白金色，立体感）
          ctx.save();
          ctx.shadowBlur = 5 * scale;
          ctx.shadowColor = 'rgba(255, 240, 180, 0.65)';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.strokeStyle = 'rgba(255, 250, 225, 0.9)';
          ctx.lineWidth = 0.6 * scale;
          ctx.stroke();
          ctx.restore();

        } else {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.strokeStyle = 'rgba(120, 100, 60, 0.12)';
          ctx.lineWidth = 1.2 * scale;
          ctx.stroke();
        }

      } else {
        // ── solid：时间线，小刻度仅在状态 0~3 显示 ──
        var zs = this.data.zoomState;
        if (isLit) {
          // 主时间轴线
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.strokeStyle = 'rgba(210, 210, 195, 0.65)';
          ctx.lineWidth = 2.2 * Math.min((pair.weight || 1) / 2, 1.5);
          ctx.stroke();
          // 刻度点仅在状态 0~3 显示
          if (zs <= 3) {
            var connKey = pair.fromNodeId + '->' + pair.toNodeId;
            var dotYears = TIMELINE_DOT_YEARS[connKey] || [];
            // node_4->node_5 特殊处理：仅中点一个刻度
            if (connKey === 'node_4->node_5') {
              var tt = 0.5;
              var u = 1 - tt;
              var dotX = u * u * ax + 2 * u * tt * cpX + tt * tt * bx;
              var dotY = u * u * ay + 2 * u * tt * cpY + tt * tt * by;
              ctx.beginPath();
              ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(225, 220, 200, 0.85)';
              ctx.fill();
              if (zs <= 1 && dotYears[0]) {
                var dotFontSize = Math.round(9 * scale);
                if (dotFontSize < 7) dotFontSize = 7;
                ctx.font = dotFontSize + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(225, 220, 200, 0.5)';
                // 偏移朝向画面中心（线内侧）
                var toCx = cx - dotX;
                var toCy = cy - dotY;
                var toCDist = Math.sqrt(toCx * toCx + toCy * toCy);
                var labelOffX = 0, labelOffY = 0;
                if (toCDist > 1) {
                  labelOffX = (toCx / toCDist) * 14 * scale;
                  labelOffY = (toCy / toCDist) * 14 * scale;
                }
                ctx.fillText(dotYears[0], dotX + labelOffX, dotY + labelOffY);
              }
            } else {
              var dotCount = 4;
              for (var d = 1; d < dotCount; d++) {
                var tt2 = d / dotCount;
                var u2 = 1 - tt2;
                var dotX2 = u2 * u2 * ax + 2 * u2 * tt2 * cpX + tt2 * tt2 * bx;
                var dotY2 = u2 * u2 * ay + 2 * u2 * tt2 * cpY + tt2 * tt2 * by;
                ctx.beginPath();
                ctx.arc(dotX2, dotY2, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(225, 220, 200, 0.85)';
                ctx.fill();
                if (zs <= 1) {
                  var dotYear = dotYears[d - 1];
                  if (dotYear) {
                    var dotFontSize2 = Math.round(9 * scale);
                    if (dotFontSize2 < 7) dotFontSize2 = 7;
                    ctx.font = dotFontSize2 + 'px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = 'rgba(225, 220, 200, 0.5)';
                    ctx.fillText(dotYear, dotX2 + 6 * scale, dotY2 + 4 * scale);
                  }
                }
              }
            }
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.strokeStyle = 'rgba(145, 140, 125, 0.12)';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }
  },

  // ─── 悬停发光 ───
  drawHoverGlow(ctx) {
    if (this.data.zoomState >= 8) return;
    var hoveredNode = this.data.hoveredNode;
    if (hoveredNode === null || hoveredNode === undefined || hoveredNode < 0) return;
    var node = this.data.nodes.find(function (n) { return n.id === hoveredNode; });
    if (!node) return;

    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;

    var ix = (node.baseX + node.fx) * r;
    var iy = (node.baseY + node.fy) * r;
    var x = cx + (ix - cx + ox) * scale;
    var y = cy + (iy - cy + oy) * scale;
    var glowR = 40 * r * scale;

    var gradient = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    gradient.addColorStop(0, node.unlocked ? 'rgba(68, 170, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  },

  // ─── 节点年份标签（空灵半透明） ───
  drawNodeYears(ctx) {
    var nodes = this.data.nodes;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node.year) continue;
      var isLit = node.unlocked;

      var ix = (node.baseX + node.fx) * r;
      var iy = (node.baseY + node.fy) * r;
      var x = cx + (ix - cx + ox) * scale;
      var y = cy + (iy - cy + oy) * scale;

      var fontSize = Math.round(12 * scale);
      if (fontSize < 9) fontSize = 9;
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      // 空灵光晕
      ctx.save();
      ctx.shadowBlur = 6 * scale;
      ctx.shadowColor = isLit ? 'rgba(180, 210, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fillStyle = isLit ? 'rgba(220, 235, 255, 0.65)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillText(node.year, x + 28 * r * scale, y + 8 * r * scale);
      ctx.restore();
    }
  },

  // ─── 中心节点连接区辉光（大面积圆形金色柔光 + 微动效） ───
  _drawCenterRingGlow(ctx) {
    var nodes = this.data.nodes;
    var centerNode = nodes ? nodes.find(function (n) { return n.nodeId === 'node_0'; }) : null;
    if (!centerNode || !centerNode.unlocked) return;

    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var scx = cw / 2;
    var scy = ch / 2;

    var ix = (centerNode.baseX + centerNode.fx) * r;
    var iy = (centerNode.baseY + centerNode.fy) * r;
    var cx = scx + (ix - scx + ox) * scale;
    var cy = scy + (iy - scy + oy) * scale;

    var frame = this._frameCount || 0;
    var breathe = 1 + Math.sin(frame * 0.025) * 0.12;

    // 大面积圆形金色柔光，从中心向外渐变淡出
    var outerR = 72 * r * scale * breathe;

    var glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    glowGrad.addColorStop(0, 'rgba(255, 215, 100, 0.4)');
    glowGrad.addColorStop(0.2, 'rgba(255, 195, 65, 0.32)');
    glowGrad.addColorStop(0.4, 'rgba(255, 175, 45, 0.2)');
    glowGrad.addColorStop(0.65, 'rgba(255, 155, 30, 0.08)');
    glowGrad.addColorStop(1, 'rgba(255, 130, 20, 0)');

    ctx.save();
    ctx.shadowBlur = 25 * scale * breathe;
    ctx.shadowColor = 'rgba(255, 180, 50, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();
    ctx.restore();

    // ── 内圈微粒子：懒初始化，在金色区域内缓慢旋转 ──
    if (!this._centerRingParts) {
      this._centerRingParts = [];
      for (var i = 0; i < 22; i++) {
        this._centerRingParts.push({
          angle: Math.random() * Math.PI * 2,
          distRatio: Math.random() * 0.8, // 0~0.8 倍外半径
          size: Math.random() * 1.4 + 0.5,
          alphaBase: Math.random() * 0.35 + 0.12,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.006,
        });
      }
    }

    // 所有环粒子共享一次 save/restore，减少 GPU 状态切换
    ctx.save();
    ctx.shadowBlur = 2.5 * scale;
    ctx.shadowColor = 'rgba(255, 245, 180, 0.5)';
    var parts = this._centerRingParts;
    for (var pi = 0; pi < parts.length; pi++) {
      var p = parts[pi];
      var angle = p.angle + frame * p.orbitSpeed;
      var dist = outerR * p.distRatio;
      var alpha = p.alphaBase + Math.sin(frame * p.twinkleSpeed + p.twinklePhase) * 0.08;
      if (alpha < 0.02) continue;
      var px = cx + Math.cos(angle) * dist;
      var py = cy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(px, py, p.size * scale * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 230, ' + alpha + ')';
      ctx.fill();
    }
    ctx.restore();
  },

  // ─── 时钟粒子渲染 ───
  drawClockParticles(ctx) {
    var pts = this._clockParticles;
    if (!pts || pts.length === 0) return;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var scx = cw / 2;
    var scy = ch / 2;

    var centerRpxX = this._clockCenterRpxX || 375;
    var centerRpxY = this._clockCenterRpxY || 667;
    var cx = scx + (centerRpxX * r - scx + ox) * scale;
    var cy = scy + (centerRpxY * r - scy + oy) * scale;

    // ── 外层大光晕（琥珀色） ──
    var outerGlowR = 55 * r * scale;
    var outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerGlowR);
    outerGrad.addColorStop(0, 'rgba(255, 210, 70, 0.5)');
    outerGrad.addColorStop(0.35, 'rgba(255, 170, 40, 0.2)');
    outerGrad.addColorStop(1, 'rgba(255, 130, 15, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, outerGlowR, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // ── 中层光晕（金色） ──
    var midGlowR = 28 * r * scale;
    var midGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, midGlowR);
    midGrad.addColorStop(0, 'rgba(255, 240, 140, 0.8)');
    midGrad.addColorStop(0.4, 'rgba(255, 200, 70, 0.35)');
    midGrad.addColorStop(1, 'rgba(255, 155, 35, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, midGlowR, 0, Math.PI * 2);
    ctx.fillStyle = midGrad;
    ctx.fill();

    // ── 中心亮核（白金色） ──
    var coreR = 12 * r * scale;
    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, 'rgba(255, 255, 230, 1)');
    coreGrad.addColorStop(0.2, 'rgba(255, 235, 140, 0.8)');
    coreGrad.addColorStop(0.6, 'rgba(255, 200, 60, 0.3)');
    coreGrad.addColorStop(1, 'rgba(255, 170, 30, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // 分离流束和火星
    var streams = [];
    var sparks = [];
    for (var i = 0; i < pts.length; i++) {
      if (pts[i].type === 'stream') streams.push(pts[i]);
      else sparks.push(pts[i]);
    }

    // ── 放射流束粒子（外层辉光 + 内核） ──
    ctx.save();
    ctx.shadowBlur = 9 * scale;
    ctx.shadowColor = 'rgba(255, 190, 50, 0.6)';
    for (var si = 0; si < streams.length; si++) {
      var sp = streams[si];
      if (sp.alpha < 0.02) continue;
      var spx = cx + Math.cos(sp.angle) * sp.dist * r * scale;
      var spy = cy + Math.sin(sp.angle) * sp.dist * r * scale;
      ctx.beginPath();
      ctx.arc(spx, spy, sp.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 85, ' + (sp.alpha * 0.75) + ')';
      ctx.fill();
    }
    ctx.restore();
    // 流束亮核
    for (var si2 = 0; si2 < streams.length; si2++) {
      var sp2 = streams[si2];
      if (sp2.alpha < 0.04) continue;
      var spx2 = cx + Math.cos(sp2.angle) * sp2.dist * r * scale;
      var spy2 = cy + Math.sin(sp2.angle) * sp2.dist * r * scale;
      ctx.beginPath();
      ctx.arc(spx2, spy2, sp2.size * 0.4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 250, 220, ' + (sp2.alpha * 0.95) + ')';
      ctx.fill();
    }

    // ── 核火星点（高亮闪烁） ──
    for (var ki = 0; ki < sparks.length; ki++) {
      var kp = sparks[ki];
      if (kp.alpha < 0.03) continue;
      var kpx = cx + Math.cos(kp.angle) * kp.dist * r * scale;
      var kpy = cy + Math.sin(kp.angle) * kp.dist * r * scale;
      ctx.save();
      ctx.shadowBlur = 6 * scale;
      ctx.shadowColor = 'rgba(255, 245, 180, 0.85)';
      ctx.beginPath();
      ctx.arc(kpx, kpy, kp.size * 0.6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 235, ' + kp.alpha + ')';
      ctx.fill();
      ctx.restore();
    }
  },

  // ─── 中心文字（状态 8） ───
  drawCenterText(ctx) {
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var scx = cw / 2;
    var scy = ch / 2;
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var centerRpxX = this._clockCenterRpxX || 375;
    var centerRpxY = (this._clockCenterRpxY || 667) - 47;
    var cx = scx + (centerRpxX * r - scx + ox) * scale;
    var cy = scy + (centerRpxY * r - scy + oy) * scale;

    var fontSize = Math.round(38 * scale);
    ctx.font = fontSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.shadowBlur = 22 * scale;
    ctx.shadowColor = 'rgba(255, 190, 60, 0.55)';
    ctx.fillStyle = 'rgba(255, 220, 120, 0.8)';
    ctx.fillText('生平事迹', cx, cy);
    ctx.restore();
  },

  // ─── 触摸交互 ───
  handleTouchStart(e) {
    this._isTouching = true;
    this._tapStartX = (e.touches[0] || {}).clientX;
    this._tapStartY = (e.touches[0] || {}).clientY;
    var touches = e.touches;
    if (touches.length === 1) {
      this.data.lastTouchX = touches[0].clientX;
      this.data.lastTouchY = touches[0].clientY;
      var r = this._rpxToPx || 0.5;
      var scale = this.data.mapScale;
      var ox = this.data.offsetX;
      var oy = this.data.offsetY;
      var cw = this.data.canvasWidth;
      var ch = this.data.canvasHeight;
      var cx = cw / 2;
      var cy = ch / 2;
      var touchX = ((touches[0].clientX - cx) / scale + cx - ox) / r;
      var touchY = ((touches[0].clientY - cy) / scale + cy - oy) / r;
      var closest = -1;
      var minDist = 80;
      var nodes = this.data.nodes;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = n.x - touchX;
        var dy = n.y - touchY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) { minDist = dist; closest = n.id; }
      }
      this.data.hoveredNode = closest;
    } else if (touches.length === 2) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      this.data.lastDistance = Math.sqrt(dx * dx + dy * dy);
      this.data.hoveredNode = -1;
    }
  },

  handleTouchMove(e) {
    var touches = e.touches;
    if (touches.length === 2) {
      this.dismissPopup();
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (this.data.lastDistance > 0) {
        var scale = this.data.mapScale + (distance - this.data.lastDistance) * 0.005;
        var newScale = Math.min(Math.max(scale, this.data.scaleMin), this.data.scaleMax);
        this._interpTarget = undefined;
        this.data.mapScale = newScale;
        this.data.lastDistance = distance;
        this._updateZoomState();
        this.drawFrame();
      }
    } else if (touches.length === 1) {
      this._interpTarget = undefined;
      var deltaX = touches[0].clientX - this.data.lastTouchX;
      var deltaY = touches[0].clientY - this.data.lastTouchY;
      this.data.offsetX += deltaX;
      this.data.offsetY += deltaY;
      this.data.lastTouchX = touches[0].clientX;
      this.data.lastTouchY = touches[0].clientY;
      // 拖拽偏移超过阈值时关闭弹窗
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        this.dismissPopup();
      }
      this.drawFrame();
    }
  },

  handleTouchEnd(e) {
    this._isTouching = false;
    this._flushZoomState(this._getZoomState());
    this.data.lastDistance = 0;
    this.data.hoveredNode = -1;

    // tap 检测：几乎没有移动 → 判断是否点在节点上
    var endX = (e.changedTouches[0] || {}).clientX;
    var endY = (e.changedTouches[0] || {}).clientY;
    if (Math.abs(endX - (this._tapStartX || 0)) < 10 && Math.abs(endY - (this._tapStartY || 0)) < 10) {
      this._onCanvasTap(endX, endY);
    }

    this.drawFrame();
  },

  // Canvas 坐标检测节点点击 → 状态 0-4 外侧节点弹窗 / 状态 5+ 跳转章节
  _onCanvasTap(touchX, touchY) {
    var r = this._rpxToPx || 0.5;
    var scale = this.data.mapScale;
    var ox = this.data.offsetX;
    var oy = this.data.offsetY;
    var cw = this.data.canvasWidth;
    var ch = this.data.canvasHeight;
    var cx = cw / 2;
    var cy = ch / 2;
    var wx = ((touchX - cx) / scale + cx - ox) / r;
    var wy = ((touchY - cy) / scale + cy - oy) / r;
    var closest = null;
    var minDist = 60;
    var nodes = this.data.nodes;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - wx;
      var dy = n.y - wy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; closest = n; }
    }
    if (!closest) {
      this.dismissPopup();
      return;
    }

    var zs = this.data.zoomState;
    // 状态 0-4：外侧八节点点击弹出简介窗
    if (zs <= 4 && closest.nodeId !== 'node_0') {
      var nx = (closest.baseX + closest.fx) * r;
      var ny = (closest.baseY + closest.fy) * r;
      var screenX = cx + (nx - cx + ox) * scale;
      var screenY = cy + (ny - cy + oy) * scale;
      // 弹窗定位在节点上方
      var popupW = 300 * r;
      var popupH = 280 * r;
      var gap = 30 * r;
      var pLeft = screenX - popupW / 2;
      var pTop = screenY - 18 * r * scale - popupH - gap;
      // 锚点（弹窗底部中心，虚线连接终点）
      var anchorX = screenX;
      var anchorY = pTop + popupH;
      var photoFileID = NODE_PHOTOS[closest.nodeId] || '';
      var photoCaption = NODE_PHOTO_CAPTIONS[closest.nodeId] || '';
      // 优先使用预取缓存，否则异步获取
      var cachedUrl = this._photoTempUrls && this._photoTempUrls[closest.nodeId];
      var photoUrl = cachedUrl || '';
      this.setData({
        selectedNode: {
          id: closest.id,
          nodeId: closest.nodeId,
          title: closest.title,
          description: NODE_DESCRIPTIONS[closest.nodeId] || '',
          photoUrl: photoUrl,
          photoCaption: photoCaption,
          nodeScreenX: screenX,
          nodeScreenY: screenY,
          popupLeft: pLeft,
          popupTop: pTop,
          anchorX: anchorX,
          anchorY: anchorY,
        }
      });
      if (!cachedUrl && photoFileID) {
        var self = this;
        cloudUtil.call('getFilePreviewUrl', { fileID: photoFileID }, 8000).then(function (res) {
          if (res.code === 0 && res.data && res.data.tempFileURL) {
            var sel = self.data.selectedNode;
            sel.photoUrl = res.data.tempFileURL;
            self.setData({ selectedNode: sel });
          }
        }).catch(function (err) {
          console.error('[cloud] getFilePreviewUrl 异常:', err);
        });
      }
      return;
    }

    // 关闭弹窗
    this.dismissPopup();

    if (!closest.unlocked) {
      wx.showToast({ title: '尚未解锁', icon: 'none' });
      return;
    }
    var section = closest.section || 1;
    wx.navigateTo({
      url: '/subpkg/pages/story/story?section=' + section + '&story=0',
      fail: function () {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 关闭节点简介弹窗
  dismissPopup() {
    if (this.data.selectedNode) {
      this.setData({ selectedNode: null });
    }
  },

  // 页面加载时预取全部照片临时链接，避免点击延迟
  _prefetchPhotos() {
    var fileIDs = [];
    var keys = [];
    for (var k in NODE_PHOTOS) {
      if (NODE_PHOTOS.hasOwnProperty(k) && NODE_PHOTOS[k]) {
        fileIDs.push(NODE_PHOTOS[k]);
        keys.push(k);
      }
    }
    if (fileIDs.length === 0) return;
    var self = this;
    self._photoTempUrls = {};
    // 逐个预取（getFilePreviewUrl 云函数每次只接受单个 fileID）
    var pending = fileIDs.length;
    for (var i = 0; i < fileIDs.length; i++) {
      (function (idx) {
        cloudUtil.call('getFilePreviewUrl', { fileID: fileIDs[idx] }, 8000).then(function (res) {
          if (res.code === 0 && res.data && res.data.tempFileURL) {
            self._photoTempUrls[keys[idx]] = res.data.tempFileURL;
          }
        }).catch(function (err) {
          console.error('[cloud] 预取照片失败:', keys[idx], err);
        }).finally(function () {
          pending--;
          if (pending === 0) {
            console.log('[cloud] 照片预取完成, 共', Object.keys(self._photoTempUrls).length, '张');
          }
        });
      })(i);
    }
  },

  // 绘制弹窗虚线连接（节点 → 弹窗）
  drawPopupDashLine(ctx) {
    var sel = this.data.selectedNode;
    if (!sel) return;
    var scale = this.data.mapScale;
    // 从节点上边缘到弹窗锚点画虚线
    var startX = sel.nodeScreenX;
    var startY = sel.nodeScreenY - 14 * (this._rpxToPx || 0.5) * scale;
    var endX = sel.anchorX;
    var endY = sel.anchorY;
    var dx = endX - startX;
    var dy = endY - startY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    var ux = dx / dist;
    var uy = dy / dist;
    var dashLen = 4;
    var gapLen = 3;
    var segLen = dashLen + gapLen;
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var pos = 0;
    while (pos < dist) {
      var s = pos;
      var e = Math.min(pos + dashLen, dist);
      ctx.moveTo(startX + ux * s, startY + uy * s);
      ctx.lineTo(startX + ux * e, startY + uy * e);
      pos += segLen;
    }
    ctx.stroke();
    ctx.restore();
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

  // ─── 缩放控制（目标值交由动画循环平滑插值） ───
  zoomIn() {
    this.dismissPopup();
    var baseScale = this._interpTarget !== undefined ? this._interpTarget : this.data.mapScale;
    var target = Math.min(baseScale * 1.18, this.data.scaleMax);
    var start = this.data.mapScale + (target - this.data.mapScale) * 0.7;
    this.data.mapScale = start;
    this.setData({ mapScale: start });
    this._interpStart = start;
    this._interpTarget = target;
    this._interpStartFrame = this._frameCount;
    this._interpDuration = 15;
  },

  zoomOut() {
    this.dismissPopup();
    var baseScale = this._interpTarget !== undefined ? this._interpTarget : this.data.mapScale;
    var target = Math.max(baseScale / 1.18, this.data.scaleMin);
    var start = this.data.mapScale + (target - this.data.mapScale) * 0.7;
    this.data.mapScale = start;
    this.setData({ mapScale: start });
    this._interpStart = start;
    this._interpTarget = target;
    this._interpStartFrame = this._frameCount;
    this._interpDuration = 15;
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 调试：只重置云图进度（不影响徽章）
  debugReset() {
    var self = this;
    wx.showModal({
      title: '重置云图',
      content: '将清除云图节点进度，徽章和故事进度不受影响。确定继续？',
      success: function (modalRes) {
        if (!modalRes.confirm) return;

        // 只清除本地缓存中的云图进度（保留徽章数据）
        try {
          var existing = wx.getStorageSync('exhibitProgress') || {};
          existing.timelineNodes = [];
          wx.setStorageSync('exhibitProgress', existing);
          console.log('[cloud] 调试：已清除本地云图缓存');
        } catch (e) {
          console.warn('[cloud] 清除本地缓存失败:', e);
        }

        // 立即将全部节点设为暗
        self._applyUnlockFromCache();

        wx.showToast({ title: '云图已重置', icon: 'success', duration: 1500 });
      },
    });
  },
});
