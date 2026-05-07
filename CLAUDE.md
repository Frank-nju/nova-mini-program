# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"追光健雄" — WeChat mini-program cloud digital exhibition hall for Chien-Shiung Wu. Uses native WeChat mini-program framework (NOT Uni-app/Vue3 — the README describes a planned migration that hasn't happened). Backend is WeChat Cloud Development (云开发): cloud functions + cloud database + cloud storage.

- **Cloud env ID**: `cloud1-0g0wg0plf9fb9ed2` (configured in `app.js`)
- **AppID**: `wx7510b7f30659080e`
- **Cloud function root**: `cloudfunctions/`
- **Frontend**: single page `pages/index/index` (skeleton only)
- **Git**: `main` (protected) / `develop` (integration) / `feature/*` / `fix/*`

## Architecture

### Cloud Functions (8)

**User System:**
- `getUser` — query by `_openid`, auto-create if not exists. Returns full user doc. Error: `1003` on DB failure.
- `updateProgress` — record node unlock/complete. Params: `{ type: "timeline"|"cloud"|"work", nodeId, action: "unlock"|"complete" }`. Deduplicates: if nodeId already in list, skips DB write and returns current progress. Auto-creates user if not found. The `nodeId` should match `cloud_nodes.nodeId` format (e.g. `"node_1"`). Error: `1001` (bad params), `1003` (DB fail).
- `grantBadge` — award badge idempotently. Param: `{ badgeId }`. Reads badge definition from `badges` collection, checks user's `badges[]`. If already owned, returns `code: 0, alreadyOwned: true`. Otherwise appends and persists. Error: `1001` (badgeId missing or badge definition not found), `1002`, `1003`.

**Cloud Map (云图):**
- `getCloudNodes` — query cloud map nodes from `cloud_nodes` collection. Param: `{ includeConnections?: boolean }` (optional, includes `cloud_connections` data when true). Error: `2002` on DB failure.

**Materials & Media:**
- `getMaterialList` — paginated query with optional `category` filter. `pageSize` capped at 100. Error: `9999`.
- `getFilePreviewUrl` — get 2h temp URL via `cloud.getTempFileURL`. Param: `{ fileID }`. Error: `1001`, `9999`.

**Digital Human:**
- `digitalHuman` — AI chat via RAG pipeline. Param: `{ question }`. Returns `{ text, retrieval[], hasRAG }`. 30s timeout. Error: `9999`.

**Debug:**
- `resetProgress` — clear user's `progress` and `badges` in cloud DB. No params needed. Only accessible in dev/trial builds.

### Database Collections

| Collection | Key Fields | Managed By |
|---|---|---|
| `users` | `_openid` (auto), `nickName`, `avatarUrl`, `badges[]`, `progress: { timelineNodes[], cloudNodes[], readWorks[] }`, `createdAt`, `updatedAt` | getUser, updateProgress, grantBadge |
| `badges` | `badgeId`, `name`, `description`, `icon` | grantBadge (read), manual seed |
| `materials` | `fileName`, `fileID`, `category`, `createdAt` | getMaterialList (read), manual seed |
| `cloud_nodes` | `nodeId`, `type`, `label`, `position: { x, y }`, `color`, `section` | getCloudNodes (read), manual seed |
| `cloud_connections` | `from`, `to`, `type`, `label`, `style`, `weight` | getCloudNodes (read, optional) |

### Error Code Convention

| Code | Meaning |
|---|---|
| `0` | Success |
| `1001` | Missing/invalid parameter |
| `1002` | User not found |
| `1003` | Database operation failed |
| `1004` | Badge already owned (reserved; idempotent case returns `code: 0` + `alreadyOwned: true` instead) |
| `2001`–`2003` | Reserved for works/cloud/scripts (pending) |
| `9999` | Unknown server error |

### User Data Flow

```
getUser (create) → progress: { timelineNodes:[], cloudNodes:[], readWorks:[] }, badges:[]
                        │                                              │
                updateProgress                                  grantBadge
                appends nodeId to                           appends badgeId to
                progress[fieldName]                         badges[] (idempotent)
```

## Key Docs

- `docs/开发手册与技术规范.md` — dev manual, module boundaries, git workflow, API conventions
- `docs/后端A-云函数开发报告.md` — full cloud function report with API contracts, call chains, deployment checklist
- `docs_开发手册与技术规范.md` — older copy at repo root (may be stale)

## Important Notes

- **Do not modify frontend code** (`pages/`, `app.json`, `app.wxss`) — frontend is owned by another developer.
- Cloud functions all use `cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`, not hardcoded env ID.
- All user-scoped operations get openid from `cloud.getWXContext().OPENID` — never accept it from client params.
- README describes a planned Uni-app/Vue3 migration; the actual codebase today is native WeChat mini-program.
