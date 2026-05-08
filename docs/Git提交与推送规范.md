# Git 提交与推送规范

## 分支命名

| 类型 | 格式 | 示例 |
|---|---|---|
| 主分支 | `main` | 受保护，禁止直接推送 |
| 集成分支 | `develop` | 日常开发 / bug 修复提交到这里 |
| 功能分支 | `feature/<name>` | `feature/story-unlock` |
| 修复分支 | `fix/<name>` | `fix/restore-cloud-map` |

## 提交流程

### 方案 A：直接提交到 develop（小改 / 单人开发）

```bash
git add <具体文件1> <具体文件2>    # 不要 git add -A 或 git add .
git commit -m "fix: <一句话描述>"
git push origin develop            # 普通 push，不要 --force
```

### 方案 B：feature 分支 + PR（大改动 / 多人协作）

```bash
git checkout -b feature/<name>
git add <文件>
git commit -m "feat: <描述>"
git push origin feature/<name>
# 在 GitHub / 工蜂上创建 PR，目标分支选 develop
```

## Commit Message 格式

```
<type>: <简短描述>
```

**type 取值：**
- `feat` — 新功能
- `fix` — 修复 bug
- `refactor` — 重构（不改变行为）
- `style` — 样式调整
- `docs` — 文档
- `chore` — 杂项 / 构建 / 依赖

**示例：**
```
fix: 恢复被备份分支覆盖的云图云端逻辑
feat: 新增云图连线解锁规则
refactor: 云图节点坐标改用 rpx 单位
```

## Force Push 安全规则

| 分支 | 允许 force push | 原因 |
|---|---|---|
| `main` | **禁止** | 生产分支，覆盖历史会导致所有人代码丢失 |
| `develop` | **禁止** | 共享集成分支，别人可能基于你的 commit 开发 |
| `feature/*` / `fix/*` | **允许（仅你自己用）** | 个人分支，不影响他人 |

**如果 develop 推送被拒绝（远程有更新）：**
```bash
# 不要用 --force！用 rebase：
git pull --rebase origin develop
git push origin develop
```

## 危险操作红线

- **永远不要** `git add -A` 或 `git add .` — 可能误提交 `.env`、密钥文件、二进制文件
- **永远不要** `git push --force origin main` 或 `origin develop`
- **永远不要** `git reset --hard` 后再 force push 到共享分支
- **恢复文件前先确认**：从备份分支 cherry-pick 或 checkout 特定文件时，确认不会覆盖其他人的新代码

## 常用恢复操作

```bash
# 从历史 commit 恢复单个文件
git checkout <commit-hash> -- <file-path>

# 从另一个分支拿单个文件
git checkout <branch-name> -- <file-path>

# 查看某文件在某个 commit 的内容
git show <commit-hash>:<file-path>
```
