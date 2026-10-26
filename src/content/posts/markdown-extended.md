---
title: Markdown 扩展功能
published: 2024-05-01
updated: 2024-11-29
description: '了解更多 Fuwari 中的 Markdown 功能'
image: ''
tags: [演示, 示例, Markdown, Fuwari]
category: '示例'
draft: false 
---

## GitHub 仓库卡片
你可以添加链接到 GitHub 仓库的动态卡片，页面加载时，仓库信息会从 GitHub API 中获取。 

::github{repo="Fabrizz/MMM-OnSpotify"}

使用代码 `::github{repo="<owner>/<repo>"}` 创建 GitHub 仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## 提示块

支持以下类型的提示块：`note` `tip` `important` `warning` `caution`

:::note
高亮显示用户应注意的信息，即使只是快速浏览。
:::

:::tip
帮助用户更顺利使用的可选信息。
:::

:::important
用户成功所必需的关键信息。
:::

:::warning
因潜在风险而需要用户立即关注的紧要内容。
:::

:::caution
某项操作可能带来的负面后果。
:::

### 基本语法

```markdown
:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::
```

### 自定义标题

提示块的标题可以自定义。

:::note[我的自定义标题]
这是一个带有自定义标题的笔记。
:::

```markdown
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub 语法

> [GitHub 语法](https://github.com/orgs/community/discussions/16925) 同样受支持。

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```

### 隐藏内容

你可以在文本中添加隐藏内容。隐藏内容也支持 **Markdown** 语法。

这段内容 :spoiler[被隐藏了 **嘿**]！

```markdown
The content :spoiler[is hidden **ayyy**]!

```