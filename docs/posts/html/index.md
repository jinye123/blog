---
title: HTML 面试题
description: HTML 高频面试题与深度解读
---

# HTML 面试题

## 语义化的理解

定义：用具有明确含义的标签描述页面结构（如 `header`、`nav`、`article`、`section`、`aside`、`footer`），让标签即文档。

价值：
1. **SEO 友好**：搜索引擎更易理解页面主题与权重
2. **可访问性**：屏幕阅读器可正确朗读结构，提升无障碍体验
3. **结构清晰**：团队协作时代码可读性更高，CSS 没加载也能看出层级
4. **设备适配**：阅读模式、外链卡片等场景依赖语义标签

注意：HTML5 语义标签不会"加快 DOM 解析"，这是常见误区。

## DOCTYPE 的作用

`<!DOCTYPE html>` 告诉浏览器采用 **标准模式（Standards Mode）** 渲染，缺失则进入 **怪异模式（Quirks Mode）**，盒模型计算与 CSS 行为会回退到 IE5 的实现。

## meta 标签关键用法

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="description" content="..." />
<meta name="keywords" content="..." />
<meta name="robots" content="index,follow" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'" />
<meta http-equiv="refresh" content="3;url=https://x.com" />
```

`viewport` 是移动端适配第一道关，`charset` 必须在前 1024 字节内。

## 行内元素 vs 块级元素 vs 行内块

| 类别 | 典型 | 特点 |
| --- | --- | --- |
| 块级 | `div p h1-h6 ul li form` | 独占一行，可设宽高 |
| 行内 | `span a strong em img input` | 不独占，width/height 无效（替换元素除外） |
| 行内块 | `img input button` | 行内排布，可设宽高 |

注意：`img/input/iframe` 是 **替换元素**，行内元素也能有宽高。

## defer vs async

```html
<script src="a.js"></script>          <!-- 阻塞解析 -->
<script src="a.js" defer></script>     <!-- 并行下载，文档解析完后按顺序执行（DOMContentLoaded 前） -->
<script src="a.js" async></script>     <!-- 并行下载，下载完立即执行，可能阻塞解析；不保证顺序 -->
<script src="a.js" type="module"></script>  <!-- 默认 defer 行为 -->
```

`defer` 适合依赖 DOM 的常规脚本，`async` 适合无依赖的统计/广告脚本。

## script 加载与执行的优先级

`async` > `defer` > 默认。多个 `defer` 之间保持顺序，多个 `async` 不保证顺序。

## HTML5 新特性

- 语义标签：`header / nav / main / article / section / aside / footer`
- 表单增强：`type=email/date/range/color`、`placeholder`、`autofocus`、`required`、`pattern`
- 多媒体：`<video>`、`<audio>`
- 图形：`<canvas>` / `<svg>`
- 离线与存储：`localStorage` / `sessionStorage` / IndexedDB / ApplicationCache（已废弃）
- 通信：WebSocket、SSE、postMessage、Channel Messaging
- 设备：Geolocation、deviceOrientation
- 多线程：Web Worker、Service Worker
- 拖拽 API、History API（pushState/replaceState）

## canvas vs svg

| 维度 | canvas | svg |
| --- | --- | --- |
| 渲染机制 | 位图（像素） | 矢量（XML） |
| 缩放 | 失真 | 不失真 |
| 性能 | 适合大量元素、游戏 | 适合少量元素、可交互图标 |
| 事件 | 不支持单图形事件，要自己实现 | 每个元素是 DOM，原生事件 |
| DOM | 一个节点 | 元素树 |

## iframe 的优缺点

优：内容隔离、第三方嵌入、沙箱安全。
缺：阻塞主页面 onload、SEO 不友好、移动端兼容差、与主页面通信麻烦（postMessage）、内存大。

替代方案：Shadow DOM、Web Components、micro-app 等微前端方案。

## cookie / localStorage / sessionStorage / IndexedDB 对比

| 维度 | cookie | localStorage | sessionStorage | IndexedDB |
| --- | --- | --- | --- | --- |
| 大小 | 4KB | 5-10MB | 5-10MB | 250MB+ |
| 生命周期 | Expires/Max-Age | 永久（手动清） | 标签页关闭 | 永久 |
| 与服务端 | 每次请求自动携带 | 不携带 | 不携带 | 不携带 |
| 通信 | 跨域有 SameSite 限制 | 同源 | 同源 + 同标签页 | 同源 |
| API | document.cookie 字符串 | 同步 KV | 同步 KV | 异步、事务、索引 |

cookie 选项：`HttpOnly`（防 XSS 读取）、`Secure`（仅 HTTPS）、`SameSite`（防 CSRF）。

## Web Worker vs Service Worker

| 维度 | Web Worker | Service Worker |
| --- | --- | --- |
| 用途 | CPU 密集计算 | 网络代理、离线缓存、推送 |
| 生命周期 | 跟页面 | 注册后常驻浏览器，独立于页面 |
| DOM 访问 | 不能 | 不能 |
| 拦截请求 | 不能 | 能（核心能力） |
| 通信 | postMessage | postMessage / fetch 拦截 |
| 必须 HTTPS | 否 | 是（localhost 例外） |

## 浏览器渲染流程（输入 URL 到看见页面）

1. **DNS 解析**：域名 → IP（多级缓存）
2. **TCP 三次握手**（HTTPS 还要 TLS 握手）
3. **发送 HTTP 请求**
4. **服务器响应**
5. **浏览器解析**：
   - HTML → DOM 树
   - CSS → CSSOM 树
   - DOM + CSSOM → Render Tree
   - **Layout（回流）**：计算每个节点位置和大小
   - **Paint（重绘）**：填充像素
   - **Composite（合成）**：合成层合并、上屏

阻塞点：
- CSS 阻塞渲染（不阻塞 DOM 解析）
- JS 阻塞 DOM 解析（除非 defer/async）
- JS 执行需等待前面的 CSS 下载完成（构建 CSSOM）

## 图片格式选型

| 格式 | 特点 | 场景 |
| --- | --- | --- |
| JPEG | 有损、不支持透明 | 照片 |
| PNG | 无损、支持透明、体积大 | 图标、需要透明 |
| GIF | 动图、256 色 | 简单动画 |
| WebP | Google 开发，比 JPEG 小 30% | 通用替代 |
| AVIF | 比 WebP 再小 50% | 新一代，覆盖率不全 |
| SVG | 矢量、可写 CSS | 图标、Logo |

推荐方案：

```html
<picture>
  <source srcset="img.avif" type="image/avif" />
  <source srcset="img.webp" type="image/webp" />
  <img src="img.jpg" alt="..." />
</picture>
```

## link 与 @import 的区别

- `<link>` 并行下载，无兼容问题，可被 JS 操作
- `@import` 必须等 CSS 解析才发现，存在加载延迟，不能跨域 JS 控制

## 可访问性（a11y）

- 语义化标签
- `alt` 属性
- `aria-*`：`aria-label`、`aria-hidden`、`role="button"`
- 键盘可达：tabindex、focus 样式
- 对比度：WCAG 标准
