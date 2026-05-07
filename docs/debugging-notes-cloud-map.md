# 云图（Cloud Map）解锁流程调试笔记

> 日期: 2026-05-06 / 更新: 2026-05-07 | 涉及分支: develop

## 一、涉及文件及职责

| 文件 | 角色 | 本次是否改动 |
|---|---|---|
| `subpkg/pages/cloud/cloud.js` | **云图页面（唯一注册的云图页）** | ✅ 重写 + 连线规则 |
| `subpkg/pages/story/story.js` | 故事阅读页，负责写入缓存 | ✅ prev/next 自动保存 |
| `pages/exhibit/exhibit.js` | 主展馆页，负责写入缓存 | 未改 |
| `cloudUtil.js` | 云函数调用封装 | ✅ 改了函数名 |
| `cloudfunctions/getCloudNodes/index.js` | 云端查询 cloud_nodes + cloud_connections | 未改 |
| `pages/cloudmap/cloudmap.js` | **死代码（未在 app.json 注册）** | 顺手修了函数名 |
| `pages/cloud-map/cloud-map.js` | **死代码（未在 app.json 注册）** | 顺手修了函数名 |

---

## 二、数据流向全链路

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  story.js    │    │  exhibit.js  │    │   cloud.js       │
│              │    │              │    │                  │
│ goBack() ────┼──→│ unlockEvent  │    │  onLoad()        │
│   │          │    │ CloudByStory │    │    │             │
│   ▼          │    │   │          │    │    ▼             │
│ _saveProgress│    │   ▼          │    │ getCloudNodes()  │
│ ToCache()    │    │ saveProgress │    │    │             │
│   │          │    │ Cache()      │    │    ▼             │
│   ▼          │    │   │          │    │ buildFromCloud() │
│ wx.setStorage│    │   ▼          │    │    │             │
│ Sync('exhibit│    │ wx.setStorage│    │    ▼             │
│ Progress',..)│    │ Sync(...)    │    │ refreshUnlocked  │
│              │    │              │    │ Status()         │
│ prevStory()  │    │              │    │    │             │
│ nextStory()  │    │              │    │    ▼             │
│   │          │    │              │    │ _applyUnlock     │
│   ▼          │    │              │    │ FromCache()      │
│ _saveCurrent │    │              │    │    │             │
│ Story() ← NEW│    │              │    │    ├─ UNLOCK_    │
│              │    │              │    │    │  RULES(节点) │
└──────┬───────┘    └──────┬───────┘    │    ├─ CONNECTION_ │
       │                   │            │    │  UNLOCK_RULES│
       └───────────┬───────┘            │    │  (连线) NEW  │
                   │                    │    ▼             │
                   ▼                    │ wx.getStorage    │
           ┌──────────────┐            │ Sync('exhibit    │
           │ exhibitProgress│           │ Progress')       │
           │ 本地缓存       │←──────────│                  │
           │ {            │            └──────────────────┘
           │  timelineNodes│
           │  :['n1',...],│
           │  badges:[...]│
           │ }            │
           └──────────────┘
```

### 缓存格式

```js
// key: 'exhibitProgress'
{
  timelineNodes: ['n1', 'n2', 'n7', ...],  // 故事 ID，格式 'n' + 数字
  badges: ['badge_01', ...]                  // 徽章 ID
}
```

### 故事 ID 映射规则

```
cloudId = (section - 1) * 6 + storyIndex + 1
nodeId  = 'n' + cloudId

Section 1 (序章, story 0-5)  → n1 - n6
Section 2 (生平, story 0-5)  → n7 - n12
Section 3 (治学, story 0-5)  → n13 - n18
Section 4 (科研, story 0-5)  → n19 - n24
Section 5 (尾声, story 0-5)  → n25 - n30
```

---

## 三、解锁规则 (UNLOCK_RULES)

9 个云图节点 → 对应故事完成条件：

| 节点 | nodeId | 含义 | 解锁条件 |
|---|---|---|---|
| 中心 | `node_0` | 吴健雄 | 其他 8 个节点全部解锁后自动亮 |
| S1-1 | `node_1` | 序章开启 | n1 完成 |
| S1-2 | `node_2` | 童年往事 | n1-n6 全部完成 |
| S2-1 | `node_3` | 求学之路 | n7 完成 |
| S2-2 | `node_4` | 浙大岁月 | n7-n9 完成 |
| S2-3 | `node_5` | 赴美留学 | n7-n12 全部完成 |
| S4-1 | `node_6` | 宇称不守恒 | n19 完成 |
| S4-2 | `node_7` | 诺贝尔之光 | n19-n24 全部完成 |
| S5-1 | `node_8` | 伟大遗产 | n25-n30 全部完成 |

**注意**：Section 3（治学风骨 n13-n18）不触发任何云图节点，这是设计如此。

---

## 四、连线解锁规则 (CONNECTION_UNLOCK_RULES) — 2026-05-07 新增

8 条连线 → 映射到 30 个故事节点 (n1-n30)。每条连线在其目标 (to) 节点满足解锁条件时点亮。

| # | 连线 | 类型 | 标签 | 点亮条件 | 对应故事 |
|---|---|---|---|---|---|
| 1 | `node_0→node_1` | stage/radial | 人生起点 | n1 完成 | n1 |
| 2 | `node_0→node_6` | stage/radial | 科学巅峰 | n19 完成 | n19 |
| 3 | `node_0→node_7` | stage/radial | 荣耀时刻 | n19-n24 全部 | n19,n20,n21,n22,n23,n24 |
| 4 | `node_1→node_2` | time/solid | 序章递进 | n1-n6 全部 | n1,n2,n3,n4,n5,n6 |
| 5 | `node_3→node_4` | time/solid | 求学→浙大 | n7-n9 完成 | n7,n8,n9 |
| 6 | `node_4→node_5` | time/solid | 浙大→赴美 | n7-n12 全部 | n7,n8,n9,n10,n11,n12 |
| 7 | `node_6→node_7` | logic/dashed | 发现→诺奖 | n19-n24 全部 | n19,n20,n21,n22,n23,n24 |
| 8 | `node_7→node_8` | spirit/dashed | 诺奖→遗产 | n25-n30 全部 | n25,n26,n27,n28,n29,n30 |

连线点亮状态通过 `_evalConnUnlocked(tl)` 预计算存入 `this._connUnlocked[]`，`drawConnections()` 每帧直接读取，不再使用 `a.unlocked || b.unlocked`。

---

## 五、Bug 修复记录

### Bug 1: `Array.includes` 兼容性（2026-05-06）
- **问题**：UNLOCK_RULES 中使用 `tl.includes('n1')`，这是 ES2016 方法，部分微信版本可能不支持
- **现象**：若 `includes` 抛异常，被 try-catch 吞掉，所有节点永远不更新
- **修复**：添加 `hasNode(tl, id)` 辅助函数，使用 `indexOf >= 0`

### Bug 2: 云端同步覆盖本地状态（2026-05-06）
- **问题**：`refreshUnlockedStatus()` 先从本地缓存正确读取并点亮节点，然后 `getUser()` 异步拉云端数据。若云端 `updateProgress` 未完成，返回的旧数据直接覆盖刚点亮的节点
- **现象**：节点短暂点亮后又变暗，或者始终不亮
- **修复**：
  - 云端数据 → 合并进本地缓存（只增不删）
  - 节点解锁用 `node.unlocked || cloudUnlocked`（只开不关）

### Bug 3: onShow 在云数据加载前触发（2026-05-06）
- **问题**：首次进入页面，`onShow` 在 `getCloudNodes` 回调完成前触发，`cloudReady=false` 直接跳过刷新
- **修复**：增加 `_pendingRefresh` 标记，数据加载完成后补刷新

### Bug 4: prevStory/nextStory 不保存进度（2026-05-07 ★ 关键）
- **问题**：`prevStory()` 和 `nextStory()` 只切换显示内容，不调用 `_saveProgressToCache()`。用户用 prev/next 翻页浏览多个故事后点「返回」，只有最后一个故事被保存到缓存
- **现象**：只有单故事条件的 node_1 (n1) 和 node_3 (n7) 能点亮，其余需要多故事的节点（node_2 需 n1-n6、node_4 需 n7-n9 等）永远无法点亮
- **修复**：新增 `_saveCurrentStory()`，在 prev/next 切换前自动保存当前故事进度

### Bug 5: 数据库 nodeId 字段大小写不一致（2026-05-07）
- **问题**：`cloud_nodes` 集合中 `node_4` 和 `node_7` 的字段名为 `nodeid`（小写 i），其余节点为 `nodeId`（驼峰）。`buildFromCloud()` 使用 `cn.nodeId` 读取，导致这两个节点在 `idToIndex` 映射中缺失
- **影响**：5 条引用 node_4/node_7 的连线无法建立映射，`UNLOCK_RULES` 也无法匹配这两个节点
- **修复**：新增 `normId(cn)` 归一化函数，兼容 `cn.nodeId || cn.nodeid`

### Bug 6: 节点解锁与动画循环竞态（2026-05-07）
- **问题**：`_applyUnlockFromCache()` 用 `{ ...node, unlocked }` 创建新对象，`updateNodes()` 每 3 帧用 `setData({ nodes: [...nodes] })` 覆盖。若时序交错，动画循环的旧对象引用会覆盖新解锁状态
- **修复**：改为直接修改节点对象的 `.unlocked` 属性（原地修改），不再创建新对象

### Bug 7: 冗余 setTimeout 延迟 Canvas 重绘（2026-05-07）
- **问题**：`refreshUnlockedStatus()` 中每次更新后调用 `setTimeout(drawLines, 100)`，额外延迟 100ms 才触发重绘
- **修复**：移除 `setTimeout(drawLines)` —— 动画循环每 16ms 自动重绘，`setData` 后下一帧即生效

### Bug 8: exhibit.js saveProgressCache 覆盖破坏进度数据（2026-05-07 ★ 关键）
- **问题**：`saveProgressCache()` 直接根据 `eventClouds` 中被标记为 unlocked 的节点**重建整个缓存并覆盖写入**。用户用 prev/next 浏览多个故事时，story.js 的 `_saveCurrentStory()` 逐个推入缓存（如 n1-n6），但 goBack 触发 exhibit 的 `unlockEventCloudByStory` 只标记了最后一个 storyIndex 的 cloud，随后 `saveProgressCache` 以这一条数据覆盖了全部缓存
- **现象**：缓存中 `timelineNodes` 从 `["n1","n2","n3","n4","n5","n6"]` 被覆盖为 `["n6"]`，云图只能读到 n6，多故事条件的节点（node_2 需 n1-n6）永远无法解锁
- **修复**：`saveProgressCache` 改为与已有缓存合并（只增不删），先读取现有 `exhibitProgress`，将新的 unlockedClouds 中不存在的节点追加入 `existingTl`，再写回

### Bug 9: updateProgress 永远返回「用户不存在」（2026-05-07 ★ 关键）
- **问题**：`updateProgress` 云函数中 `db.collection('users').where({ _openid: openid }).get()` 始终返回空数组，导致 `code: 1002`。`getUser` 也有同样问题，但因为查不到就自动创建（掩盖了查询失败），导致同一用户被反复创建（200+ 条重复记录）
- **现象**：
  - 云函数日志显示每次调用 `updateProgress` 都返回 `{code:1002, "用户不存在"}`
  - 所有用户 DB 记录的 `timelineNodes` 都是空的
  - 云图页面日志显示 `[cloud] 云端 timelineNodes 为空，保留本地缓存`
  - 本地缓存工作正常（story.js → `_saveProgressToCache`），但云端同步永久失败
- **根因**：`_openid` 查询在云函数环境中可能不生效（可能与集合权限配置或 SDK 版本有关，确切原因未定）
- **修复**：`updateProgress` 增加 auto-create 逻辑——找不到用户时先创建再更新，与 `getUser` 行为一致。创建后改用 `doc(addRes._id).get()` 回查（绕过 `_openid` 查询）。涉及变更：
  - `cloudfunctions/updateProgress/index.js`：33-53 行重写，`let userRes` → 查不到则 `add()` + `doc().get()` 回查
  - 云函数需重新部署才能生效
- **注意**：`_openid` 查询不可靠的根因仍需排查（可能需检查 users 集合权限设置），当前 auto-create 是绕过方案。

---

## 六、调试检查清单

### 1. 确认云函数部署
```bash
# 在微信开发者工具中，右键 cloudfunctions/getCloudNodes → 上传并部署
```

### 2. 确认数据库有数据
在云开发控制台检查：
- `cloud_nodes` 集合：应有 9 条记录，`nodeId` 为 `node_0` ~ `node_8`。**注意检查字段名统一为 `nodeId`（驼峰），不是 `nodeid`**
- `cloud_connections` 集合：应有 8 条连线记录

### 3. 确认缓存写入
在微信开发者工具控制台，完成一个故事后检查：
```js
wx.getStorageSync('exhibitProgress')
// 应返回类似: { timelineNodes: ['n1'], badges: [] }
```

### 4. 确认云图读取缓存
打开云图页面后，控制台应打印：
```
[cloud] 读取缓存 timelineNodes: ["n1",...]
[cloud] 节点点亮: 序章开启 ( node_1 )
[cloud] 连线点亮: 人生起点
```

### 5. 常见问题排查

| 现象 | 可能原因 | 检查方法 |
|---|---|---|
| 云图无节点显示 | getCloudNodes 未部署或返回空 | 控制台看 `[cloud] 云端数据加载完成` |
| 节点始终全暗 | 缓存从未写入 | `wx.getStorageSync('exhibitProgress')` 返回空 |
| 节点点亮后变暗 | 云端同步覆盖（Bug 2，已修复） | 控制台看云端返回数据是否覆盖了本地 |
| 只有 node_1/node_3 能亮 | prev/next 不保存进度（Bug 4，已修复） | 检查 story.js 是否部署了 `_saveCurrentStory` |
| 部分连线不亮 | node_4/node_7 的 nodeId 字段大小写（Bug 5，已修复） | 检查数据库字段名 + cloud.js `normId()` |
| 节点进入不了故事 | unlocked=false，被 `onStarTap` 拦截 | 设计如此，需先通过展厅完成故事 |
| 云端同步始终为空 | updateProgress 查不到用户（Bug 9，已修复，需部署） | 检查云函数日志是否返回 1002，部署新版 updateProgress |

---

## 七、关键控制台日志

正常流程应看到以下日志序列：

```
[cloud] 云端数据加载完成, 节点: 9 连线: 8
[cloud] buildFromCloud 完成, 节点: 9 连线对: 8
[cloud] 读取缓存 timelineNodes: ["n1","n2","n3","n4","n5","n6"]
[cloud] 节点点亮: 序章开启 ( node_1 )
[cloud] 节点点亮: 童年往事 ( node_2 )
[cloud] 连线点亮: 人生起点
[cloud] 连线点亮: 序章递进
[cloud] 云端同步 timelineNodes: [...]
```

异常情况：
```
[cloud] 云端数据为空，无法渲染云图          ← 云函数未部署或数据库无数据
[cloud] refreshUnlockedStatus 跳过：节点数据为空  ← buildFromCloud 未执行
[cloud] 云端 timelineNodes 为空，保留本地缓存    ← 正常（新用户）
[cloud] 读取缓存失败: ...                   ← includes 抛异常（Bug 1）
```

---

## 八、调试重置机制（2026-05-07 新增）

### 为什么需要重置？

当前设计：节点解锁后**永久记录**（本地缓存 + 云端数据库双重持久化），`refreshUnlockedStatus()` 只开不关。这对生产环境是正确行为，但调试时需要在重复测试中从头开始。

### 解决方案

**`resetProgress` 云函数**：清除云端 `users` 集合中当前用户的 `progress` 和 `badges` 字段。

调用链：点击「重置」按钮 → 确认弹窗 → 清除本地缓存 + 调用 `resetProgress` → `_applyUnlockFromCache()` 刷新（此时缓存为空，所有节点变暗）。

### 环境区分

- **开发版 / 体验版**：云图页面左下角显示红色「重置」按钮
- **正式版**：按钮隐藏，用户进度永久保存

检测方式：`wx.getAccountInfoSync().miniProgram.envVersion`，`develop` / `trial` 时设 `isDev: true`。

### 涉及文件

| 文件 | 改动 |
|---|---|
| `cloudfunctions/resetProgress/index.js` | **新增** — 云函数，重置用户进度 |
| `cloudfunctions/resetProgress/package.json` | **新增** — 依赖配置 |
| `cloudUtil.js` | 新增 `resetProgress()` 封装 |
| `subpkg/pages/cloud/cloud.js` | `onLoad` 检测环境 + `debugReset()` 方法 |
| `subpkg/pages/cloud/cloud.wxml` | 新增 `wx:if="{{isDev}}"` 重置按钮 |
| `subpkg/pages/cloud/cloud.wxss` | 新增 `.debug-reset-btn` 样式 |

### 部署注意

首次使用需部署 `resetProgress` 云函数：
```bash
# 在微信开发者工具中，右键 cloudfunctions/resetProgress → 上传并部署
```
