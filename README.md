# 基层人大代表信息管理系统（演示版）

代表档案 · 活动管理（调研视察/约见镇长/代表述职）· 提案建议交办闭环。
整体目标、功能模块与数据 Schema 见 [PROJECT.md](./PROJECT.md)。

## 本地启动

```bash
npm install
npm run dev   # http://localhost:5173/npc-deputy-system/
```

## 构建

```bash
npm run build   # tsc 类型检查 + 打包到 dist/
```

## 部署到 GitHub Pages（自动部署）

已内置 GitHub Actions 工作流：`.github/workflows/deploy.yml`（按 Vite 官方文档编写：
checkout → setup-node → npm ci → npm run build → 上传 artifact → deploy-pages）。
推送到 `main` 分支即自动构建并发布。

### 第 1 步：创建同名仓库

1. 登录 GitHub → 右上角 `+` → **New repository**；
2. 仓库名必须填 **`npc-deputy-system`**（与 `vite.config.ts` 的 `base: '/npc-deputy-system/'` 保持一致，否则页面资源全部 404）；
3. 可见性选 **Public**（免费账户的 Pages 仅支持公开仓库）；
4. 不要勾选自动生成 README；点击 **Create repository**。

### 第 2 步：推送代码

方式 A（推荐）：本机安装 Git（`winget install Git.Git`）后在项目目录执行：

```bash
git init
git add .
git commit -m "feat: 基层人大代表信息管理系统"
git branch -M main
git remote add origin https://github.com/<你的用户名>/npc-deputy-system.git
git push -u origin main
```

方式 B（不装 Git）：打开新建的空仓库页面，点击 **uploading an existing file**，
把整个项目文件夹拖拽上传（`node_modules`、`dist`、`*.log` 不要上传，`.gitignore` 已列出）。

### 第 3 步：开启 Pages（选择 GitHub Actions）

仓库 → **Settings** → 左侧 **Pages** → **Build and deployment** → **Source** 选择
**GitHub Actions**（不要选 “Deploy from a branch”）。

### 第 4 步：等待自动部署

- 推送到 `main` 后工作流自动运行；也可以到仓库 **Actions** 标签页手动 **Run workflow**；
- 流程全绿即发布成功，首次约 1~2 分钟；
- 以后每次推送代码到 `main`，会自动重新构建发布，无需手动操作。

### 访问地址

```
https://<你的用户名>.github.io/npc-deputy-system/
```

> **HashRouter 说明**：路由使用 Hash 模式，页面内跳转后地址会带 `#` 号，
> 例如 `https://<你的用户名>.github.io/npc-deputy-system/#/proposals`。
> 这是正常现象，也是选 HashRouter 的原因——刷新或分享带 `#` 的链接都不会 404。
> 首次进入请使用不带 `#` 的根地址。

### 常见问题

| 现象 | 原因与处理 |
|---|---|
| 访问 404 | 仓库名与 `base` 不一致，或第 3 步未选择 GitHub Actions |
| Actions 报权限/404 错误 | 确认第 3 步 Source 已选 **GitHub Actions**，然后在 Actions 页面重新运行 |
| 页面白屏 | 浏览器控制台查看资源是否 404，确认仓库与 `base` 同名 |
| 想改访问路径 | 修改 `vite.config.ts` 的 `base` 与仓库名保持一致后重新推送 |

## 演示角色

- **管理员**：全部功能（档案维护、活动组织、建议交办流转、导出）；
- **人大代表**：我的档案 / 我的活动 / 我的提案（登录页选择代表身份进入）。