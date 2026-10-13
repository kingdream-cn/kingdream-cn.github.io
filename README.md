<div align="center">

# KingDream's Blog

**一个基于 Hexo + Butterfly 的技术与生活个人博客**

分享技术，记录成长 —— 沉淀 ROS / ROS 2、SLAM、运动规划、嵌入式与系统架构的实践经验

[![项目状态](https://img.shields.io/badge/status-active-success?style=flat-square)](https://kingdream-cn.github.io)
[![部署状态](https://github.com/kingdream-cn/kingdream-cn.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/kingdream-cn/kingdream-cn.github.io/actions/workflows/deploy.yml)
[![Hexo](https://img.shields.io/badge/Hexo-5.4.2-0e83cd?style=flat-square&logo=hexo&logoColor=white)](https://hexo.io/)
[![Theme](https://img.shields.io/badge/Theme-Butterfly%205.7.1-blueviolet?style=flat-square)](https://butterfly.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey?style=flat-square)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Stars](https://img.shields.io/github/stars/kingdream-cn/kingdream-cn.github.io?style=flat-square&logo=github)](https://github.com/kingdream-cn/kingdream-cn.github.io/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/kingdream-cn/kingdream-cn.github.io?style=flat-square)](https://github.com/kingdream-cn/kingdream-cn.github.io/commits/main)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/kingdream-cn/kingdream-cn.github.io?style=flat-square)](https://github.com/kingdream-cn/kingdream-cn.github.io/commits/main)
[![Issues](https://img.shields.io/github/issues/kingdream-cn/kingdream-cn.github.io?style=flat-square)](https://github.com/kingdream-cn/kingdream-cn.github.io/issues)

[🌐 在线访问](https://kingdream-cn.github.io) · [📡 RSS 订阅](https://kingdream-cn.github.io/atom.xml) · [🐛 报告问题](https://github.com/kingdream-cn/kingdream-cn.github.io/issues) · [💡 功能建议](https://github.com/kingdream-cn/kingdream-cn.github.io/issues)

</div>

---

## 📑 目录

- [🎯 项目概述](#-项目概述)
- [✨ 功能特性](#-功能特性)
- [🛠️ 技术栈说明](#️-技术栈说明)
- [🚀 快速开始](#-快速开始)
- [📦 部署方式](#-部署方式)
- [📖 使用说明](#-使用说明)
- [📸 项目截图](#-项目截图)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)
- [📬 联系方式与社交链接](#-联系方式与社交链接)

---

## 🎯 项目概述

KingDream's Blog 是一个纯静态的个人技术博客，使用 **Hexo** 作为静态站点生成器、**Butterfly** 作为主题，全站构建产物托管于 **GitHub Pages**，并通过 **GitHub Actions** 实现推送即部署的自动化流程。

**项目定位**

- 面向机器人开发方向的长期技术沉淀平台，内容覆盖 ROS / ROS 2、SLAM、运动规划、嵌入式开发与系统架构
- 采用「技术」与「生活」双板块内容架构，技术文章与生活随笔互不干扰，各自拥有独立的分页列表页
- 以 Markdown 为唯一写作格式，全站无数据库、无后端服务，构建产物为纯静态文件

**核心价值**

- 零运维成本：静态托管 + 自动构建，无需服务器与数据库
- 完全可复现：依赖版本、构建流程、部署配置全部纳入版本控制
- 高度可定制：主题配置、自定义生成器、注入脚本均为源码级可改
- 开箱即用的工程化实践：内置 CI/CD、依赖自动更新、本地搜索、评论系统与 SEO 支持

**适用场景**

- 希望搭建个人技术博客并长期维护的开发者
- 需要一套「写作 → 提交 → 自动上线」轻量内容工作流的用户
- 想基于 Hexo + Butterfly 二次开发，参考双板块架构与自定义注入实现的开发者

---

## ✨ 功能特性

### 📝 内容与写作

- **双板块架构**：通过自定义 Hexo 生成器按文章分类自动生成 `/tech/`（技术）与 `/life/`（生活）两个独立分页列表页，板块无文章时也会生成空列表页
- **Markdown 写作**：支持 GitHub Flavored Markdown，文章资源自动归档到同名文件夹（`post_asset_folder` 已开启）
- **文章元信息**：支持标签、分类、摘要（`description`）、封面图（`cover`）、唯一短链 ID（`abbrlink`）
- **归档与检索**：按年份、月份归档，支持按分类、标签聚合浏览

### 🎨 界面与交互

- **卡片式响应式设计**：基于 Butterfly 主题，移动端与桌面端自适应
- **深色 / 浅色模式**：默认深色配色（`display_mode: dark`），右下角按钮一键切换并记忆偏好
- **Canvas 粒子背景**：自定义脚本 `ros-particles.js` 生成动态科技感粒子背景，替代静态头部图
- **全局衬线字体**：注入 Noto Serif SC 字体，标题与正文统一使用衬线排版，增强阅读层级
- **阅读模式与进度**：支持沉浸式阅读模式、目录跟随高亮与滚动进度提示
- **代码块增强**：Mac 风格窗口、语言标注、一键复制按钮

### 🔍 搜索与互动

- **本地全文搜索**：基于 `hexo-generator-search` 生成索引，无需第三方服务即可全文检索
- **Utterances 评论**：基于 GitHub Issues 的评论系统，按页面路径自动创建 Issue，支持亮色 / 暗色主题跟随
- **社交分享**：文章支持分享至微信、微博、QQ、X、Facebook 等平台
- **相关文章推荐**：自动推荐最多 6 篇相关文章，支持上一篇 / 下一篇导航

### 📊 数据与 SEO

- **字数统计**：文章字数与预计阅读时长、站点总字数统计
- **站点信息卡片**：文章总数、最后更新时间、站点运行时长
- **RSS 订阅**：通过 `hexo-generator-feed` 输出 `atom.xml`
- **站点地图**：通过 `hexo-generator-sitemap` 输出包含标签与分类的 `sitemap.xml`
- **自定义 404 页面**：内置独立样式的错误页

### ⚙️ 工程化

- **推送即部署**：推送到 `main` 分支后由 GitHub Actions 自动构建并发布到 `gh-pages` 分支
- **依赖自动更新**：配置 Dependabot 每日检查 npm 依赖更新
- **零第三方后端**：无服务端、无数据库，全部能力由静态资源与 GitHub 平台提供

---

## 🛠️ 技术栈说明

### 核心框架与主题

| 分类 | 技术 | 版本 | 说明 |
| --- | --- | --- | --- |
| 静态站点生成器 | [Hexo](https://hexo.io/) | 5.4.2 | 博客核心框架，负责渲染与生成静态页面 |
| 主题 | [Butterfly](https://butterfly.js.org/) | 5.7.1 | 卡片式设计主题，已内置于 `themes/butterfly`（非 submodule） |
| 运行时 | [Node.js](https://nodejs.org/) | ≥ 18 LTS | 本地构建与 CI 构建环境 |
| 包管理器 | npm | ≥ 8 | 依赖安装与脚本执行 |

### 渲染引擎与样式

| 技术 | 用途 |
| --- | --- |
| [EJS](https://ejs.co/) | Hexo 页面模板渲染（`hexo-renderer-ejs`） |
| [Pug](https://pugjs.org/) | Butterfly 主题模板渲染（`hexo-renderer-pug`） |
| [Stylus](https://stylus-lang.com/) | 主题样式编译（`hexo-renderer-stylus`） |
| [Marked](https://marked.js.org/) | Markdown 渲染，兼容 GFM（`hexo-renderer-marked`） |
| Noto Serif SC | 通过 `inject.head` 引入的全局衬线字体 |

### Hexo 插件依赖

| 插件 | 用途 |
| --- | --- |
| `hexo-server` | 本地开发服务器与热更新预览 |
| `hexo-deployer-git` | 通过 Git 推送方式部署到远程仓库 |
| `hexo-generator-index` | 首页文章列表生成与分页 |
| `hexo-generator-archive` | 归档页生成 |
| `hexo-generator-category` | 分类页生成 |
| `hexo-generator-tag` | 标签页生成 |
| `hexo-generator-search` | 生成本地搜索索引 `search.json` |
| `hexo-generator-feed` | 生成 RSS 订阅源 `atom.xml` |
| `hexo-generator-sitemap` | 生成站点地图 `sitemap.xml` |
| `hexo-abbrlink` | 为文章生成唯一短链 ID |
| `hexo-wordcount` | 文章字数与阅读时长统计 |

### 前端与自研脚本

| 技术 | 说明 |
| --- | --- |
| 原生 JavaScript（Canvas API） | `source/js/ros-particles.js`，实现首页动态粒子背景 |
| Node.js（Hexo 扩展 API + `hexo-pagination`） | `scripts/section-pages.js`，实现「技术 / 生活」双板块列表页生成器 |
| CSS 注入 | 通过 Butterfly 的 `inject.head` 注入字体、标题层级与粒子层级样式 |

### 服务与部署

| 分类 | 技术 | 说明 |
| --- | --- | --- |
| 评论系统 | [Utterances](https://utteranc.es/) | 基于 GitHub Issues，仓库 `kingdream-cn/kingdream-cn.github.io`，以 `pathname` 匹配 Issue |
| 搜索方案 | Butterfly `local_search` | 纯前端本地搜索，无第三方依赖 |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | 工作流 `.github/workflows/deploy.yml`，配合 `peaceiris/actions-gh-pages@v3` 发布 |
| 静态托管 | GitHub Pages | 发布分支 `gh-pages` |
| 依赖维护 | [Dependabot](https://github.com/dependabot) | 每日检查 npm 依赖更新 |

> 💡 本仓库**不含任何后端服务与数据库**，构建产物为纯静态文件（HTML / CSS / JS），可直接部署到任意静态托管平台。

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 | 检查命令 |
| --- | --- | --- |
| Node.js | ≥ 18（推荐 18 / 20 LTS） | `node -v` |
| npm | ≥ 8 | `npm -v` |
| Git | ≥ 2.0 | `git --version` |

### 分步操作

**1. 克隆仓库**

```bash
git clone https://github.com/kingdream-cn/kingdream-cn.github.io.git
cd kingdream-cn.github.io
```

> 使用 SSH 的开发者可替换为：`git clone git@github.com:kingdream-cn/kingdream-cn.github.io.git`

**2. 安装依赖**

```bash
npm install
```

**3. 启动本地预览服务**

```bash
npm run server
```

启动成功后访问 <http://localhost:4000> 即可查看博客效果，修改文章或配置后浏览器会自动刷新。

**4. 构建静态文件（可选）**

```bash
npm run build
```

构建产物输出到 `public/` 目录，可直接上传到任意静态托管平台。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run server` | 启动本地开发服务器（默认端口 4000） |
| `npm run build` | 生成静态文件到 `public/` |
| `npm run clean` | 清理缓存（`db.json`）与 `public/` 产物 |
| `npm run deploy` | 构建并部署（使用 `_config.yml` 中的 `deploy` 配置，需具备仓库推送权限） |

---

## 📦 部署方式

### 方式一：GitHub Actions 自动部署（推荐，仓库已内置）

仓库已配置 [deploy.yml](.github/workflows/deploy.yml)，推送到 `main` 分支即自动触发：安装依赖 → `npx hexo generate` → 发布 `public/` 到 `gh-pages` 分支。

**首次启用步骤**

1. 进入仓库 **Settings → Pages**，将 **Source** 设置为 **Deploy from a branch**，分支选择 `gh-pages`、目录选择 `/ (root)`
2. 进入 **Settings → Actions → General → Workflow permissions**，选择 **Read and write permissions**（供部署步骤推送 `gh-pages` 分支）
3. 推送任意提交到 `main` 分支，等待 Actions 运行完成即可通过 <https://kingdream-cn.github.io> 访问

```bash
git add .
git commit -m "post: 新增文章"
git push origin main
```

### 方式二：本地命令部署（hexo-deployer-git）

`_config.yml` 中已配置部署目标，执行以下命令即可从本地直接发布：

```bash
npm run clean && npm run build && npm run deploy
```

对应配置如下（如需部署到自己的仓库请修改）：

```yaml
deploy:
  type: git
  repository: https://github.com/kingdream-cn/kingdream-cn.github.io.git
  branch: gh-pages
```

### 方式三：其他静态托管平台

本项目为纯静态站点，构建命令统一为 `npx hexo generate`，输出目录统一为 `public`，Node.js 版本选择 18。

| 平台 | 关键配置 |
| --- | --- |
| [Vercel](https://vercel.com/) | Framework Preset：`Other`；Build Command：`npx hexo generate`；Output Directory：`public` |
| [Netlify](https://www.netlify.com/) | Build command：`npx hexo generate`；Publish directory：`public`；环境变量 `NODE_VERSION=18` |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Build command：`npx hexo generate`；Build output directory：`public`；环境变量 `NODE_VERSION=18` |

> ⚠️ 使用自定义域名时，请在 `_config.yml` 中更新 `url` 字段，并在 `source/` 目录下新增 `CNAME` 文件（内容为你的域名）。

---

## 📖 使用说明

### 目录结构

```text
kingdream-cn.github.io/
├── .github/
│   ├── workflows/
│   │   └── deploy.yml          # GitHub Actions 自动部署工作流
│   └── dependabot.yml          # npm 依赖自动更新配置
├── scaffolds/                  # 新建文章 / 页面 / 草稿的模板
├── scripts/
│   └── section-pages.js        # 自定义生成器：「技术 / 生活」双板块列表页
├── source/                     # 站点源文件
│   ├── _posts/                 # 博客文章（Markdown）
│   ├── about/                  # 关于页
│   ├── link/                   # 友链页
│   ├── message/                # 留言板
│   ├── projects/               # 项目页
│   ├── img/                    # 站点图片资源（头像、封面、错误页等）
│   └── js/
│       └── ros-particles.js    # 首页 Canvas 粒子背景脚本
├── themes/
│   └── butterfly/              # Butterfly 主题（已内置，无需额外安装）
├── _config.yml                 # Hexo 主配置（站点信息、URL、部署等）
├── _config.butterfly.yml       # Butterfly 主题配置（导航、样式、评论、注入等）
├── package.json                # 依赖与 npm 脚本
└── README.md
```

### 核心配置项

| 配置项 | 所在文件 | 说明 |
| --- | --- | --- |
| `title` / `subtitle` / `description` / `author` | `_config.yml` | 站点标题、副标题、描述与作者信息 |
| `url` | `_config.yml` | 站点域名，影响永久链接与 SEO，换域名时必须修改 |
| `permalink` | `_config.yml` | 文章永久链接格式，当前为 `:year/:month/:day/:title/` |
| `per_page` | `_config.yml` | 首页与列表页每页文章数，当前为 6 |
| `search.path` | `_config.yml` | 本地搜索索引输出路径（`search.json`） |
| `feed` | `_config.yml` | RSS 订阅源配置（`atom.xml`，最多 20 篇） |
| `deploy` | `_config.yml` | Git 部署目标仓库与分支 |
| `menu` | `_config.butterfly.yml` | 顶部导航菜单（首页 / 技术 / 生活 / 归档 / 关于 / 留言板 / 友链） |
| `social` | `_config.butterfly.yml` | 侧边栏社交链接（GitHub、Email） |
| `display_mode` / `darkmode` | `_config.butterfly.yml` | 默认配色与深浅色模式开关 |
| `search.use` | `_config.butterfly.yml` | 搜索方案，当前为 `local_search` |
| `comments.use` / `utterances` | `_config.butterfly.yml` | 评论系统类型与 Utterances 仓库配置 |
| `inject.head` / `inject.bottom` | `_config.butterfly.yml` | 全局注入的字体样式与粒子背景脚本 |
| `SECTIONS` | `scripts/section-pages.js` | 板块定义（名称、路径 slug、描述、筛选分类） |

### 自定义方法

**1. 新建文章**

```bash
npx hexo new "我的第一篇技术笔记"
```

命令会在 `source/_posts/` 下生成 Markdown 文件，并自动创建同名资源文件夹（用于存放文章配图）。在文件头填写分类即可归入对应板块：

```markdown
---
title: 我的第一篇技术笔记
tags:
  - ROS 2
categories:
  - 技术        # 技术 → /tech/；生活 → /life/
description: 一句话摘要，用于首页列表展示。
cover: 封面图地址（可选）
abbrlink: 12345
---
```

**2. 修改导航菜单与社交链接**

编辑 `_config.butterfly.yml` 中的 `menu` 与 `social` 字段，格式为 `名称: 路径 || 图标类名`：

```yaml
menu:
  首页: / || fas fa-home
  技术: /tech/ || fas fa-code
  生活: /life/ || fas fa-mug-hot
```

**3. 更换评论仓库**

评论系统基于 Utterances，需使用公开仓库并安装 [Utterances App](https://github.com/apps/utterances)，随后修改：

```yaml
utterances:
  repo: 你的用户名/你的仓库名
  issue_term: pathname
```

**4. 新增内容板块**

编辑 `scripts/section-pages.js` 中的 `SECTIONS` 数组，新增板块名称、访问路径与描述，重新构建后即可生成对应的独立列表页：

```javascript
const SECTIONS = [
  { name: '技术', slug: 'tech', desc: '学习笔记与技术知识' },
  { name: '生活', slug: 'life', desc: '感想与感悟' }
]
```

**5. 调整全局样式**

字体、标题字重、粒子背景层级等样式通过 `_config.butterfly.yml` 的 `inject.head` 注入，直接在该处的 `<style>` 中修改即可，无需改动主题源码。

---

## 📸 项目截图

> 📌 截图文件待补充。按下表将图片放入 `source/img/screenshots/` 目录后，取消下方示例代码的注释即可正常展示。

| 截图 | 建议文件路径 | 建议尺寸 | 说明 |
| --- | --- | --- | --- |
| 首页 | `source/img/screenshots/home.png` | 1920 × 1080 | 粒子背景 + 卡片式文章列表 |
| 文章详情页 | `source/img/screenshots/post.png` | 1920 × 1080 | 目录、代码块、评论区域 |
| 技术板块页 | `source/img/screenshots/tech.png` | 1920 × 1080 | `/tech/` 板块分页列表 |
| 本地搜索 | `source/img/screenshots/search.png` | 1920 × 1080 | 全文搜索弹窗效果 |
| 移动端适配 | `source/img/screenshots/mobile.png` | 750 × 1334 | 移动端响应式布局 |

图片引用格式（将路径替换为实际上传位置即可）：

```markdown
![首页](./source/img/screenshots/home.png)
![文章详情页](./source/img/screenshots/post.png)
```

---

## 🤝 贡献指南

欢迎通过 Issue 与 Pull Request 参与改进，包括但不限于：修复文章中的技术错误、优化样式与交互、补充功能实现、改进文档。

### 提交 Issue

- 提交前请先搜索 [已有 Issue](https://github.com/kingdream-cn/kingdream-cn.github.io/issues)，避免重复
- 请选择或说明类型：`Bug 报告` / `功能建议` / `内容纠错` / `其他`
- Bug 报告请包含：问题描述、复现步骤、期望结果、实际结果、运行环境（操作系统与 Node.js 版本）及相关截图

### 提交 Pull Request

**1. Fork 并创建分支**

```bash
git checkout -b feat/your-feature-name
```

分支命名建议：`feat/xxx`（新功能）、`fix/xxx`（问题修复）、`docs/xxx`（文档改进）、`style/xxx`（样式调整）。

**2. 本地开发与验证**

```bash
npm run clean && npm run build   # 确保构建通过、无报错
npm run server                   # 在 http://localhost:4000 自测效果
```

**3. 提交规范**

本项目遵循约定式提交（Conventional Commits），提交信息请使用 `类型: 描述` 格式：

```bash
git commit -m "feat: 新增文章目录折叠功能"
git commit -m "fix: 修复移动端导航栏遮挡问题"
git commit -m "post: 新增技术文章《ROS 2 话题通信实践》"
git commit -m "docs: 更新 README 部署说明"
```

**4. 发起 Pull Request**

- 目标分支为 `main`，请 rebase 到最新代码，避免合并冲突
- PR 描述中请说明改动内容、动机与验证方式，并关联相关 Issue（如 `Closes #12`）
- 涉及界面的改动请附上截图或录屏
- 提交后请关注 CI 状态与 Review 意见，通过后即可合并

---

## 📄 许可证

本项目采用以下许可策略：

- **博客原创文章与图片**：采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。转载请注明出处，禁止商业使用，衍生作品需以相同协议共享
- **Butterfly 主题**：遵循 [Apache License 2.0](https://github.com/jerryc127/hexo-theme-butterfly/blob/dev/LICENSE)，版权归主题作者 [Jerry](https://github.com/jerryc127) 所有
- **站点源码与配置**：仓库根目录暂未包含 `LICENSE` 文件。如需复用本站配置或代码，请先通过[联系方式](#-联系方式与社交链接)取得授权

---

## 📬 联系方式与社交链接

| 渠道 | 地址 |
| --- | --- |
| 🌐 博客 | <https://kingdream-cn.github.io> |
| 🐙 GitHub | <https://github.com/kingdream-cn> |
| 📡 RSS 订阅 | <https://kingdream-cn.github.io/atom.xml> |
| 💬 留言板 | <https://kingdream-cn.github.io/message/> |
| 📧 Email | <2730970347@qq.com> |

如果这个项目或其中的文章对你有帮助，欢迎给本仓库点一个 ⭐ Star，也欢迎在 [Issues](https://github.com/kingdream-cn/kingdream-cn.github.io/issues) 中交流讨论。

### 🙏 致谢

- [Hexo](https://hexo.io/) —— 高效的静态站点生成框架
- [Butterfly](https://butterfly.js.org/) —— 优雅的卡片式主题
- [GitHub Pages](https://pages.github.com/) 与 [GitHub Actions](https://github.com/features/actions) —— 免费且稳定的托管与 CI/CD 能力