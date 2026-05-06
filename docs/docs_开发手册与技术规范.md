# 开发手册与技术规范（冲突预防版）

> 适用仓库：`Frank-nju/nova-mini-program`  
> 目标：统一开发方式、接口约定与提交规则，**降低多人并行开发冲突与返工风险**。

---

## 1. 开发原则

1. **单一主线叙事原则**：卷轴主线是唯一体验主轴，所有模块围绕主线增强。  
2. **组件解耦原则**：动效、容器、业务逻辑、数据访问分层。  
3. **可回退原则**：高风险视觉特效必须有降级路径。  
4. **先约定后开发原则**：接口、数据结构、命名、状态流转先冻结再编码。  
5. **冲突最小化原则**：按模块边界切分任务与目录，减少同文件并行修改。

---

## 2. 角色与代码边界（防冲突核心）

| 角色 | 主要目录 | 可修改范围 | 禁止直接修改 |
|---|---|---|---|
| A UI/UX | `docs/design/`、设计token配置 | 视觉规范、动效参数文档 | 业务逻辑代码 |
| B 素材/排版 | `assets/materials/`、`docs/material-ledger/` | 素材台账、资源更新 | 核心组件逻辑 |
| C 前端动效 | `components/exhibition/`、`modules/cloud-map/` | 视差/粒子/云图动效 | 后端接口实现 |
| D 前端业务 | `pages/`、`components/media/`、`components/badge/` | 页面编排、容器交互、状态接入 | 云函数内部实现 |
| E 后端架构 | `cloudfunctions/`、`services/api-schema/`、数据库脚本 | API、数据表、审核流 | 前端视图层细节 |
| F AI/PM | `modules/rag/`、`modules/digital-human/`、`docs/prd/` | RAG、脚本、流程管理 | 低层渲染实现 |

**规定**：跨边界改动必须在 PR 描述中注明“跨模块原因 + 影响范围 + 回滚方案”。

---

## 3. Git 工作流规范

## 3.1 分支模型

- `main`：生产发布分支（受保护）
- `develop`：日常集成分支
- `feature/<module>-<short-desc>`：功能开发分支
- `fix/<module>-<short-desc>`：缺陷修复分支
- `release/<version>`：发布预演分支
- `hotfix/<issue>`：线上热修复分支

## 3.2 命名示例

- `feature/cloudmap-node-popup`
- `feature/dh-recommend-bubble`
- `fix/badge-unlock-race-condition`

## 3.3 提交规范（Conventional Commits）

- `feat:` 新功能
- `fix:` 修复
- `refactor:` 重构（不改行为）
- `perf:` 性能优化
- `docs:` 文档
- `test:` 测试
- `chore:` 构建/工具链

示例：
- `feat(cloud-map): add node detail modal with dh audio entry`
- `fix(badge): prevent duplicate unlock under websocket retry`

## 3.4 PR 规范（强制）

- PR 标题：`[模块] 简要描述`
- PR 必填：
  1. 变更背景
  2. 变更范围
  3. 自测结果
  4. 风险与回滚
  5. 截图/录屏（UI 相关）
- 合并条件：
  - CI 通过（lint/type-check/build/test）
  - 至少 1 位 reviewer 通过
  - 无未解决冲突
  - 无高风险 TODO 残留

---

## 4. 代码规范

## 4.1 通用规范

- 统一使用 TypeScript（若存量 JS，新增模块优先 TS）
- ESLint + Prettier + EditorConfig 强制生效
- 禁止魔法值：提取为常量或配置
- 组件必须有 props 类型与默认值
- 异步请求必须有超时、错误兜底、重试策略（可配置）

## 4.2 命名规范

- 组件：`PascalCase`，如 `CloudNodeDetail.vue`
- 文件：`kebab-case`，如 `badge-unlock.ts`
- 变量函数：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- ID：使用业务前缀，如 `node_1956_parity`

## 4.3 样式规范

- 采用设计 Token（颜色、字号、间距、圆角、阴影）
- 禁止页面内散落硬编码色值（如 `#3B82F6` 应沉淀到 token）
- 动画时长采用统一变量：`--motion-fast/normal/slow`

---

## 5. 模块技术规范

## 5.1 卷轴主线（Scroll Narrative）

- 每段必须包含：
  - 事迹摘要
  - 代表引语
  - 成果入口
  - 数字人讲解入口
- 所有可跳转卡片必须带 `anchorId`
- 返回行为统一：`onClose -> scrollTo(anchorId)`

## 5.2 多媒体容器规范

统一接口（示例）：
```ts
interface MediaContainerProps {
  workId: string
  anchorId: string
  onClose: () => void
}
```

容器组件：
- `RichTextReader`
- `SlideViewer`
- `GallerySlider`
- `VideoPlayer`
- `LongImageViewer`
- `WebViewEmbed`

要求：
- 首屏外内容懒加载
- 视频/H5 二次按需拉取
- 关闭后回到原卷轴锚点

## 5.3 事件云图规范

- 节点类型：`stage | event | partner | keyword | work`
- 必填字段：`id/type/label/position/connections/scrollAnchor`
- 点击流程固定：
  `高亮节点 -> 弹详情卡 -> 可播数字人讲解 -> 可跳卷轴/作品`

## 5.4 勋章系统规范

触发链路三类：
1. 事迹浏览
2. 成果观看
3. 互动参与

避免重复发放规则：
- 后端幂等校验：同用户同勋章只解锁一次
- 前端展示幂等：同一事件帧内只弹一次动画
- WebSocket 重试去重：基于 `badgeName + timestamp/window`

## 5.5 数字人规范

状态机：
`welcome -> explain -> recommend -> feedback -> qa -> summary`

要求：
- 统一第一人称口吻
- 语气一致（温和、严谨、鼓励）
- 场景切换��打断主线浏览
- 脚本版本化管理（字段：`version`, `scene`, `updatedAt`）

---

## 6. API 与数据契约规范

## 6.1 契约管理

- API 文档单独维护：`docs/API约定.md`
- 变更流程：提出 RFC -> 评审 -> 升级版本号 -> 前后端联调
- 禁止“先改后说”

## 6.2 返回结构统一

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "..."
}
```

错误码分层：
- `1xxx` 参数错误
- `2xxx` 权限/鉴权
- `3xxx` 业务规则
- `5xxx` 服务异常

## 6.3 数据字段稳定性

- 对外字段只增不删（破坏性变更必须走版本升级）
- 枚举值集中管理（如 `assetStatus`, `slot`, `type`）

---

## 7. 素材台账与内容治理规范

## 7.1 命名规范

`{展区}_{节点}_{类型}_{作者}_{版本}_{日期}`  
示例：`生平履历_赴美深造_video_张三_v1_20250401`

## 7.2 状态流转

`draft -> review -> online -> revision -> online -> archive`

约束：
- `review` 仅审核角色可流转
- `online` 资源必须绑定 `nodeBinding + slot`
- `archive` 资源不可被主线检索到

## 7.3 上线检查清单

- 内容准确性
- 分辨率与压缩率
- 版权与署名
- 节点映射正确
- 数字人推荐语存在

---

## 8. 性能与稳定性规范

- 主包目标：`< 2MB`
- 图片：WebP + 多尺寸裁剪 + 懒加载
- 视频：封面优先 + 点击后加载
- 长列表：虚拟滚动
- 动效降级开关：
  - 低端机关闭粒子
  - 降低视差层数量
  - 降低动画帧频

监控指标（最低）：
- 首屏时间
- 页面切换耗时
- JS 错误率
- API 失败率
- 勋章解锁成功率

---

## 9. 测试规范

- 单元测试：勋章判定、状态机切换、工具函数
- 集成测试：卷轴->节点->容器->返回锚点闭环
- 回归测试：每周一次，覆盖核心链路
- 提测门槛：
  - 核心路径全通过
  - 无 P0/P1 未解决缺陷
  - 有可回滚版本

---

## 10. 冲突预防机制（执行级）

1. **锁文件机制**：高冲突文件（如首页主卷轴页面）采用“时段锁”，同一时段仅一人主改。  
2. **日合并机制**：每日固定时间将 feature rebase develop，提前暴露冲突。  
3. **模块 owner 审核**：跨模块 PR 必须 @模块 owner。  
4. **大改预告机制**：超过 200 行或改动核心协议，需先发“变更预告卡”。  
5. **接口冻结窗口**：联调期内禁止随意改字段；必须变更时先升版本。  
6. **发布前冻结**：上线前 48 小时仅允许 `fix/*` 合入。  
7. **冲突处理优先级**：数据契约 > 业务逻辑 > UI 表现。  
8. **回滚策略**：所有高风险开关可配置，确保分钟级回退。

---

## 11. 版本与文档管理

- `docs/版本变更记录.md` 使用 Keep a Changelog
- 每次发布打 tag：`vX.Y.Z`
- 文档版本与代码版本同步更新
- README 仅保留“如何上手 + 去哪看细节”，详细规范统一放 `docs/`

---

## 12. 附：推荐的 CODEOWNERS（可选）

```txt
# 全局默认
* @Frank-nju

# 动效与展馆主线
/src/components/exhibition/ @Frank-nju

# 多媒体容器与业务页面
/src/components/media/ @Frank-nju
/src/pages/ @Frank-nju

# 云函数与数据契约
/cloudfunctions/ @Frank-nju
/docs/API约定.md @Frank-nju

# AI与数字人
/src/modules/rag/ @Frank-nju
/src/components/digital-human/ @Frank-nju
```

> 若团队成员已确定，建议将 owner 替换为对应负责人账号，进一步降低评审盲区。