---
title: 交互式 Git 练习教程上线：可视化理解 Git 的四个区域
tags:
  - Git
  - 教程
  - 工具
  - GitHub Pages
categories:
  - 工具
description: 介绍我基于 Git-Interactive-Tutorial 定制开发的交互式 Git 练习页，以及如何用它从零理解 Git 的四个区域和常用命令。
cover: 'https://kingdream-cn.github.io/git-practice/assets/%E6%A6%82%E8%A7%88.png'
abbrlink: 31415
date: 2026-09-09 10:00:00
---

## 为什么做这个练习页

Git 是我日常开发中最常用的工具之一，但刚接触时经常被「工作区」「暂存区」「本地仓库」「远程仓库」这几个概念绕晕：文件到底在哪个区？`git add` 和 `git commit` 到底做了什么？分支合并后又发生了什么？

为了把这些问题彻底搞明白，我基于开源项目 [Git-Interactive-Tutorial](https://github.com/woyeyao/Git-Interactive-Tutorial)（MIT 协议）定制了一个交互式 Git 练习页，把 Git 的四个区域直接可视化出来，一边敲命令一边看变化，比死记硬背命令高效得多。

![Git 练习概览](https://kingdream-cn.github.io/git-practice/assets/%E6%A6%82%E8%A7%88.png)

- 在线体验：https://kingdream-cn.github.io/git-practice/
- 源码仓库：https://github.com/kingdream-cn/git-practice

## 它能做什么

这个练习页是一个纯前端页面，零依赖、无需构建，打开就能用：

- 四个区域实时可视化：工作区、暂存区、本地仓库、远程仓库的文件状态一目了然
- 模拟终端：支持 21 个 git 命令，以及 touch、echo、cat、help 等辅助命令
- 命令补全：输入 `git ad` 再按 Tab，自动补全为 `git add`
- 命令历史：上下方向键快速调出历史命令
- 箭头动画：命令执行后显示对应的数据流向
- 结构化教程：8 章 34 张卡片，从基础到进阶，每张卡片都带一个动手任务
- 进度保存：自动保存到 localStorage，刷新页面不丢失

## 如何使用

### 方式一：在线体验

直接打开在线地址即可，推荐用电脑浏览器，体验更完整：

```
https://kingdream-cn.github.io/git-practice/
```

### 方式二：本地运行

把仓库克隆到本地，直接双击 `index.html` 在浏览器中打开：

```bash
git clone https://github.com/kingdream-cn/git-practice.git
```

## 界面说明

打开后页面分为上下两部分：

- 上半部分是四个区域：Working Directory（工作区）、Staging Area（暂存区）、Local Repository（本地仓库）、Remote Repository（远程仓库）。
- 下半部分左侧是教程目录与卡片，右侧是模拟终端。

在右侧终端输入命令后，上方的四个区域会实时刷新，文件会从一个区域移动到另一个区域，配合箭头动画就能直观看到数据流向。

## 从零开始：一个完整的最小例子

下面以「创建文件并提交」为例，走一遍完整流程：

1. 在左侧目录选择「初始化与配置」，按提示执行 `git init` 初始化仓库。
2. 执行 `git config` 设置用户名和邮箱。
3. 执行 `touch hello.txt` 创建文件，此时文件出现在工作区。
4. 执行 `git add hello.txt`，文件从工作区进入暂存区。
5. 执行 `git commit -m "first commit"`，文件进入本地仓库。
6. 配置远程仓库后执行 `git push`，文件进入远程仓库。

每一步都能在上方区域看到文件位置的实时变化，箭头动画会标明这次命令对应的数据流向。

## 教程目录

教程共 8 章 34 张卡片，覆盖了从入门到进阶的常用场景：

| 章节 | 内容 |
|------|------|
| 1. Git 是什么 | 对象模型、四个区域 |
| 2. 初始化与配置 | git init、git config、创建文件 |
| 3. 日常基础 | add、status、commit、diff、log |
| 4. 分支操作 | branch、checkout、switch、merge |
| 5. 远程协作 | SSH Key、clone、push、pull、fetch |
| 6. 撤销与修正 | reset、revert、restore |
| 7. 进阶工具 | rebase、stash、cherry-pick、tag、rm |
| 8. 工作流总览 | 日常流程、Git Flow、常见问题 |

## 关于部署

这个练习页通过 GitHub Pages 免费托管：

1. 在 GitHub 新建仓库 `git-practice`。
2. 推送代码到 `main` 分支。
3. 在仓库 `Settings → Pages` 中把 Source 设为 `main` 分支根目录。
4. 等待部署完成即可访问。

整个过程无需服务器和域名，几分钟就能上线一个可交互的页面。

## 总结

这个练习页既是我的 Git 复习笔记，也是一个可以反复练习的交互式工具。如果你也在学习 Git，建议边看教程边动手敲命令，配合四个区域的可视化，很多模糊的概念会一下子清晰起来。

欢迎在线体验，也欢迎到仓库提 issue 或 PR 一起完善。
