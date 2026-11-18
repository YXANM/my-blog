# 云兮安梦

个人博客，基于 [Fuwari](https://github.com/saicaca/fuwari) 主题（Astro + Tailwind CSS）二次定制。

线上地址：<https://YXANM.github.io/my-blog/>

## 相对上游的定制

| 功能 | 说明 | 相关文件 |
| --- | --- | --- |
| 网易云音乐播放器 | 侧边栏播放指定歌单，支持播放/暂停/切歌/播放列表 | `src/components/widget/MusicPlayer.astro` |
| Banner 取景可调 | 位置支持任意 CSS `object-position`，并新增缩放参数 | `src/config.ts`、`src/components/misc/ImageWrapper.astro` |

## 技术栈

- Astro 5 + TypeScript
- Tailwind CSS 3 + `@tailwindcss/typography`
- Svelte 5（交互组件）
- Swup（无刷新页面过渡）
- Expressive Code（代码块增强）
- Pagefind（全文搜索）

## 目录结构

```
├── scripts/
│   └── new-post.js           # 新建文章
├── src/
│   ├── assets/images/        # 站点图片资源（banner、头像等）
│   ├── components/
│   │   ├── misc/             # ImageWrapper 等通用组件
│   │   └── widget/           # 侧边栏组件（Profile、MusicPlayer、Categories…）
│   ├── content/
│   │   └── posts/            # 文章目录
│   ├── layouts/
│   ├── styles/
│   ├── types/config.ts       # 配置项类型定义
│   └── config.ts             # 站点配置入口
├── astro.config.mjs
└── .github/workflows/deploy.yml
```

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 本地开发 http://localhost:4321
pnpm build            # 构建静态站点并生成搜索索引
pnpm preview          # 预览构建产物
pnpm new-post <名称>  # 新建文章
pnpm check            # 类型与模板检查
pnpm format           # Biome 格式化
```

## 站点配置

所有配置集中在 `src/config.ts`，类型定义在 `src/types/config.ts`。

### Banner

```ts
banner: {
    src: "assets/images/banner.jpg",
    position: "top",  // 'top' | 'center' | 'bottom'，或任意 object-position，如 "50% 20%"、"left 30%"
    scale: 1,         // 缩放倍数，以 position 焦点为中心放大，如 1.2
}
```

`position` 的第一值是横轴、第二值是纵轴。`scale` 的 `transform-origin` 会跟随 `position`，所以放大后焦点仍在画面内。

### 音乐播放器

```ts
musicPlayerConfig: {
    id: "18528691361",  // 网易云歌单 ID
    auto: false,        // 自动播放（浏览器通常拦截，建议保持 false）
}
```

歌单 ID 从歌单分享链接里取：`https://music.163.com/#/playlist?id=<这里>`。

## 写文章

### 普通文章

单个 `.md` 文件放进 `src/content/posts/`，或使用「文件夹 + index.md」结构（URL 更干净，且便于就近存放图片）：

```
src/content/posts/文章名/
├── index.md
└── 配图.jpg
```

frontmatter：

```yaml
---
title: 文章标题
published: 2026-11-07
description: 一句话摘要
image: ./cover.jpg
tags:
  - 标签
category: 分类
draft: false
---
```

### 插入图片

图片路径**相对 md 文件所在目录**解析，用正斜杠 `/`：

```md
![说明](./配图.jpg)
```

Astro 会自动优化（转 webp/avif、压缩、补宽高防抖动）。放在 `src/assets/images/` 的公共图片要写相对路径：

```md
![说明](../../../assets/images/pet.png)
```

`public/` 目录下的图片不会被处理，且**必须手写 base 前缀**，否则部署后 404：

```md
![说明](/my-blog/images/foo.jpg)
```

## 部署

推送到 `main` 分支触发 `.github/workflows/deploy.yml`，使用 `withastro/action` 在 GitHub Actions 上全量构建并发布到 GitHub Pages。

因为 `dist/` 在 `.gitignore` 里，本地不需要预先构建，CI 每次都是干净重建。但建议推送前先本地跑一次 `pnpm build`——它和 CI 流程完全一致，图片路径写错之类的问题会在本地提前暴露。

`astro.config.mjs` 中的部署相关配置：

```js
site: "https://YXANM.github.io",
base: "/my-blog",
```

## 许可

主题部分遵循 MIT License；文章内容遵循 CC BY-NC-SA 4.0。
