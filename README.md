# MoonJagger|Blog

个人博客，基于 [AstroPaper](https://github.com/satnaing/astro-paper) 主题（Astro 框架）。

在线地址：<https://moonjagger.github.io/>

## 技术栈

- [Astro](https://astro.build/) 静态站点框架
- [AstroPaper](https://github.com/satnaing/astro-paper) 主题（v6.1.0，含中文语言包、Pagefind 本地搜索）
- [GitHub Actions](.github/workflows/deploy.yml) 自动构建部署到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev        # 开发预览 http://localhost:4321
npm run build      # 构建（含类型检查 + Pagefind 搜索索引）
npm run preview    # 预览构建产物
```

## 站点结构

```
src/content/posts/          # 文章（Markdown）
  └── YYYY/MM/DD/文章名.md   # 按日期分目录，路径决定文章 URL
public/pic/                 # 图片资源
scripts/extract_posts.mjs   # 旧站文章还原脚本（local-search.xml → Markdown）
scripts/new-post.sh         # 新文章模板生成脚本
scripts/publish.sh          # 一键提交推送脚本
```

## 写文章并发布（三步）

```bash
# 1. 生成文章模板（自动按日期建目录 + front-matter）
bash scripts/new-post.sh "文章标题"

# 2. 编辑文章（Markdown），本地预览
npm run dev          # 打开 http://localhost:4321 实时预览

# 3. 一键发布（提交 + 推送，自动部署 GitHub Pages + Cloudflare Pages）
bash scripts/publish.sh "提交说明"
```

图片放到 `public/pic/`，正文用 `![描述](/pic/xxx.jpg)` 引用。

## 文章 front-matter

```yaml
---
title: 文章标题
pubDatetime: 2024-08-26T09:37:00+08:00   # 发布日期（含时区）
description: 文章摘要
tags: [标签1, 标签2]
categories: [分类1, 分类2]   # 自定义扩展字段（主题默认只有 tags）
---
```

## 自定义功能

- Footer 站点运行倒计时（2024-08-26 起）+ busuanzi 访问统计
- `/categories/` 分类聚合页（扩展了内容 schema）
- 旧站 URL 301 重定向（见 `astro.config.ts` 的 `redirects`）
