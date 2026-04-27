[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/Frank-nju/nova-mini-program)
# 追光健雄｜云端数字展馆（nova-mini-program）

> 一款“滚动卷轴式场馆长页 + 数字人导览 + 事件云图回看 + 分阶段勋章反馈”的数字展览馆级小程序。  
> 以同学共读《吴健雄传》成果为核心内容，弘扬科学家精神，构建沉浸式、可互动、可传播的学习体验。

## 1. 项目概览

- **项目名称**：追光健雄｜云端数字展馆
- **仓库**：`Frank-nju/nova-mini-program`
- **核心形态**：滚动卷轴叙事主线（唯一主展示形态）
- **核心模块**：
  - 沉浸式展厅（伪3D视差 + 粒子动效）
  - 跨时空对话（数字人 + RAG问答）
  - 数字文创集章（8枚阶段勋章）
  - 多媒体成果矩阵（文章/PPT/海报/视频/漫画/H5）

## 2. 产品目标

1. 形成“参观展馆”的连续叙事体验，降低割裂感。  
2. 将人物事迹、科学精神与同学作品进行深度耦合。  
3. 通过数字人问答与勋章反馈提升学习完成率与留存。  
4. 用可复用的技术规范保证多人协作效率，降低冲突风险。

## 3. 技术栈（规划）

### 前端
- Uni-app（Vue3）
- uView UI 3.0
- Pinia
- GSAP + CSS3 + Canvas
- 富媒体容器：`rich-text / swiper / video / web-view`

### 后端
- 微信云开发（云函数 + 云数据库 + 云存储/CDN）
- 内容审核流（素材状态治理）

### AI
- 大模型：Claude / Kimi
- Embedding：text-embedding-3-small
- 向量检索：云端向量存储 / FAISS
- 流式输出：SSE
- 数字人：SVG/Canvas + 音频脚本联动

## 4. 信息架构（主线）

1. 序章（粒子肖像 + 导览欢迎）  
2. 生平履历（时间推进 + 节点展开）  
3. 治学风骨（名言/手稿/精神关键词）  
4. 科研丰碑（实验节点 + 多媒体讲解）  
5. 事件云图总览（线性与非线性跳转）  
6. AI问答入口  
7. 成就页（勋章解锁与分享）

## 5. 快速开始（建议）

> 说明：以下为标准化建议流程，请以仓库实际脚本为准。

```bash
# 1) 安装依赖
pnpm install
# 或 npm install / yarn

# 2) 本地开发
pnpm dev:mp-weixin
# 或对应 uni-app/taro 命令

# 3) 构建
pnpm build:mp-weixin
```

## 6. 目录建议（统一协作，避免冲突）

```text
nova-mini-program/
├─ src/
│  ├─ pages/                      # 页面
│  ├─ components/                 # 通用组件
│  │  ├─ exhibition/              # 展馆主线组件（卷轴/云图）
│  │  ├─ media/                   # 多媒体容器组件
│  │  ├─ digital-human/           # 数字人组件
│  │  └─ badge/                   # 勋章系统组件
│  ├─ stores/                     # Pinia 状态
│  ├─ services/                   # API 请求层
│  ├─ modules/                    # 业务模块（cloud-map/badge/rag）
│  ├─ assets/                     # 静态资源
│  └─ utils/                      # 工具函数
├─ docs/
│  ├─ 开发手册与技术规范.md
│  ├─ API约定.md
│  ├─ 数据字典.md
│  └─ 版本变更记录.md
├─ scripts/
├─ .editorconfig
├─ .eslintrc.cjs
├─ .prettierrc
└─ README.md
```

## 7. 核心协作约定（必读）

- **统一分支策略**：`main`（保护） / `develop`（集成） / `feature/*`（功能） / `fix/*`（修复）  
- **提交规范**：Conventional Commits（`feat`/`fix`/`refactor`/`docs`/...）  
- **PR规则**：
  - 小步提交、单一职责
  - 必须通过 lint + type-check + build
  - 至少 1 名相关负责人 review
- **禁止直接 push main**（强制保护分支）

详见：`docs/开发手册与技术规范.md`

## 8. 数据模型摘要（节选）

- `users`：用户信息、进度、勋章、互动行为
- `works`：作品内容、类型、节点绑定、状态
- `cloud_nodes` / `cloud_connections`：事件云图节点与关系
- `badges`：勋章定义与触发条件
- `digital_human_scripts`：数字人多场景脚本

## 9. 里程碑（6-7周）

- **W1**：需求冻结 + 基建完成  
- **W2-3**：视觉与接口并行开发  
- **W4-5**：核心联调（卷轴/云图/数字人/勋章）  
- **W6**：性能优化与内测  
- **W7**：答辩包装与上线

## 10. 贡献指南

1. 先阅读 `docs/开发手册与技术规范.md`  
2. 从 issue 领取任务，按模块创建 `feature/*` 分支  
3. 开发完成后自测并提交 PR  
4. Review 通过后合并至 `develop`  
5. 发布窗口统一由 Release Owner 执行

## 11. 许可证

若未明确，请补充 `LICENSE`（建议 MIT 或 Apache-2.0）。
