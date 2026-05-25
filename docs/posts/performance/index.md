---
title: 前端性能优化
description: 指标 → 加载 → 运行时 → 项目实战 STAR 化
---

# 前端性能优化

> 面试 3 问：**怎么衡量？怎么优化？做过什么有数据的项目？**

## 一、指标体系（怎么衡量）

### Core Web Vitals（Google 官方）

| 指标 | 含义 | 优秀阈值 |
| --- | --- | --- |
| **LCP** Largest Contentful Paint | 最大内容绘制 | < 2.5s |
| **INP** Interaction to Next Paint（2024 取代 FID） | 交互响应延迟 | < 200ms |
| **CLS** Cumulative Layout Shift | 累积布局偏移 | < 0.1 |

辅助指标：

| 指标 | 含义 |
| --- | --- |
| FCP | First Contentful Paint，首次内容绘制 |
| TTI | Time to Interactive，可交互时间 |
| TBT | Total Blocking Time，主线程总阻塞 |
| TTFB | Time to First Byte，首字节 |
| FP | First Paint，首次绘制 |

### 采集方式

```js
// 1. PerformanceObserver
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    report({ name: entry.name, value: entry.startTime });
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });

// 2. web-vitals 库（推荐）
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
onLCP(report);
onINP(report);
onCLS(report);

// 3. Navigation Timing：页面加载阶段
const nav = performance.getEntriesByType('navigation')[0];
nav.domContentLoadedEventEnd - nav.fetchStart;  // DOMContentLoaded 时间

// 4. Resource Timing：资源加载
performance.getEntriesByType('resource').forEach(r => {
  report({ name: r.name, duration: r.duration });
});
```

### 上报方案

```js
// sendBeacon：页面卸载也能发，浏览器后台执行
navigator.sendBeacon('/log', JSON.stringify(data));

// fetch + keepalive
fetch('/log', { method: 'POST', body, keepalive: true });

// 队列 + 节流（避免太多请求）
const queue = [];
function report(data) {
  queue.push(data);
  if (queue.length >= 10) flush();
}
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
function flush() {
  if (queue.length === 0) return;
  navigator.sendBeacon('/log', JSON.stringify(queue));
  queue.length = 0;
}
```

---

## 二、加载阶段（首屏快）

### 关键渲染路径

```
HTML 下载 → 解析 DOM
CSS 下载 → 解析 CSSOM    ← 阻塞渲染
JS 下载 → 执行            ← 阻塞 DOM 解析 + 等待 CSSOM
DOM + CSSOM → Render Tree → Layout → Paint
```

优化原则：**减少阻塞资源、减小资源体积、并行下载、提前提示**。

### 资源提示（Resource Hints）

```html
<!-- DNS 预解析：节省 DNS 时间 -->
<link rel="dns-prefetch" href="//cdn.example.com">

<!-- 预连接：DNS + TCP + TLS 都先做 -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin>

<!-- 预加载：当前页面要用，下载但不执行 -->
<link rel="preload" href="hero.webp" as="image">
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预获取：下一页可能用 -->
<link rel="prefetch" href="next-page.js">

<!-- 模块预加载 -->
<link rel="modulepreload" href="module.js">
```

适用：
- LCP 候选图片：`preload`
- 字体：`preload`（避免 FOUT）
- 第三方 API：`preconnect`
- 路由懒加载下个页面：`prefetch`

### HTTP/2 与 HTTP/3

| 协议 | 关键特性 |
| --- | --- |
| HTTP/1.1 | 持久连接、队头阻塞、可管线化（但实际未用） |
| HTTP/2 | 多路复用（一个连接并发请求）、头部压缩 HPACK、Server Push（已被弃用） |
| HTTP/3 | 基于 QUIC（UDP），解决 TCP 队头阻塞、0-RTT 握手 |

迁移 HTTP/2 后：
- 不再需要"合并 CSS/JS 减少请求数"
- 雪碧图收益变小
- 域名分片可能反而变慢（多连接抢资源）

### CDN

- 静态资源就近访问，降低延迟
- 边缘缓存，源站压力小
- 配合 hash 文件名 + 长缓存：`Cache-Control: max-age=31536000, immutable`

### 压缩

- **Gzip**：通用
- **Brotli**：比 Gzip 多 15-25% 压缩率（现代浏览器都支持）
- 配置：Nginx 开启 `gzip` / `brotli`；CDN 一般开箱即用

### 代码层优化

```
代码分割（route-level / component-level）
   ↓
tree-shaking（移除未使用代码）
   ↓
压缩（terser / esbuild minify）
   ↓
动态 import（按需加载）
   ↓
externals + CDN（公共库）
   ↓
babel polyfill 按需（core-js + browserslist）
```

```js
// 路由懒加载（Vue/React 通用）
const About = () => import(/* webpackChunkName: "about" */ './About.vue');

// 第三方库 CDN
// webpack:
externals: { vue: 'Vue', 'vue-router': 'VueRouter' }
// HTML 引：<script src="https://cdn/vue.min.js"></script>
```

### 图片优化

| 格式 | 适用 |
| --- | --- |
| WebP | 通用替代 JPEG/PNG，节省 25-35% |
| AVIF | 下一代，节省更多但兼容性弱 |
| SVG | 图标 / 矢量 |

技术：
- `<picture>` + `<source>` 多格式回退
- `srcset` + `sizes` 响应式（不同 DPR 加载不同大小）
- 懒加载：`<img loading="lazy">` 或 `IntersectionObserver`
- LQIP（低质量占位图）/ BlurHash
- 雪碧图 / iconfont / SVG sprite

```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img
    src="hero.jpg"
    srcset="hero-320.jpg 320w, hero-640.jpg 640w, hero-1280.jpg 1280w"
    sizes="(max-width:600px) 100vw, 50vw"
    loading="lazy"
    decoding="async"
    alt="...">
</picture>
```

### 字体优化

```css
@font-face {
  font-family: 'Custom';
  src: url('font.woff2') format('woff2');
  font-display: swap;       /* FOUT 而非 FOIT */
  unicode-range: U+0020-007F; /* 子集化 */
}
```

- WOFF2 优先（比 WOFF 小 30%）
- `font-display: swap`：先显示降级字体，加载完替换
- 子集化（fontmin / glyphhanger）：只打包用到的字符
- 自体内联（极小图标字体）

### 渲染模式选型

| 模式 | 首屏 | SEO | 服务器压力 |
| --- | --- | --- | --- |
| CSR | 慢 | 差 | 低 |
| SSR | 快 | 好 | 高 |
| SSG | 极快 | 好 | 极低 |
| ISR（Next） | 快 + 数据新鲜 | 好 | 中 |
| Streaming SSR | 渐进出现 | 好 | 中 |
| Islands（Astro/Fresh） | 极快 | 好 | 低 |

选择：
- 营销页 / 文档 → SSG
- 内容站 / 电商 → SSR / ISR
- 后台管理 → CSR

---

## 三、运行时（流畅）

### 长列表

- **虚拟滚动**：只渲染可视区（react-window / react-virtuoso / vue-virtual-scroller）
- **`content-visibility: auto`**：跳过屏外渲染（CSS 内置虚拟化）
- **`contain: layout style paint`**：限制重排范围
- **分批渲染**：requestIdleCallback 分块插入

```css
.row {
  content-visibility: auto;
  contain-intrinsic-size: 60px;   /* 占位高度 */
}
```

### 渲染节流

- **防抖**：搜索、resize、表单校验
- **节流**：滚动、拖拽、`mousemove`
- **`requestAnimationFrame`**：动画、滚动联动
- **`requestIdleCallback`**：低优先级（埋点）

### Web Worker

CPU 密集计算放 Worker，避免阻塞主线程：
- 大文件 hash 计算
- 大数据排序、过滤
- 图片处理
- 加解密

```js
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ type: 'hash', file });
worker.onmessage = (e) => console.log(e.data);

// worker.js
self.onmessage = (e) => {
  if (e.data.type === 'hash') {
    const hash = spark.hash(e.data.file);
    self.postMessage(hash);
  }
};
```

### OffscreenCanvas

把 canvas 放 worker 中绘制：

```js
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

### 避免重排

- 用 transform / opacity 代替 top/left/display
- 批量改动（class 切换、DocumentFragment）
- 读写分离（先批量读 offsetWidth，再批量写）
- `will-change` 提前提升合成层（谨慎使用）

### React 性能优化

- `React.memo` + 稳定引用
- `useMemo` / `useCallback` 不滥用
- `useTransition` / `useDeferredValue` 标记非紧急
- `startTransition` 包裹大状态更新
- Profiler 排查瓶颈

### Vue 性能优化

- `v-once` / `v-memo`
- `shallowRef` / `shallowReactive` 大对象
- `defineAsyncComponent` 异步组件
- `Suspense` 优雅加载
- keep-alive 缓存路由组件

---

## 四、项目实战案例（**面试讲故事用**）

> 用 STAR 结构（Situation / Task / Action / Result）讲，**必带数据**。

### 案例 1：首屏 LCP 从 4.2s → 1.1s

**背景（S）**：业务后台首页加载慢，用户进入后白屏 3-4 秒，老板拍桌。

**任务（T）**：把 LCP 压到 1.5s 以内，移动端 4G 网络下达标。

**行动（A）**：
1. Lighthouse + Performance 面板定位：
   - 主 bundle 1.8MB（vendor 占 1.2MB）
   - LCP 是首屏 banner 图（300KB JPG）
   - 关键 CSS 在外联 stylesheet，阻塞渲染
2. **打包优化**：
   - moment（200KB）替换 dayjs（7KB）
   - lodash 改 lodash-es + 按需 import
   - vue / element-plus / echarts CDN externals
   - vendor 拆分 + magic comment 命名
3. **资源优化**：
   - banner 图改 webp + responsive srcset（320/640/1280）
   - 关键 CSS 内联到 HTML
   - 字体 `font-display: swap` + 子集化
   - preload LCP 图片
4. **服务端配合**：
   - 开启 Brotli（gzip 已开，再省 20%）
   - HTTP/2
   - 关键资源加 `Cache-Control: immutable`

**结果（R）**：
- 主 bundle 1.8MB → 480KB（vendor CDN）
- LCP 4.2s → 1.1s
- FCP 2.8s → 0.6s
- Lighthouse 性能分 32 → 92

**思考**：先量化再动手，工具比直觉准。

---

### 案例 2：长列表表格 12fps → 60fps

**背景（S）**：财务报表 5000+ 行 × 30 列，滚动卡顿严重，PM 反复投诉。

**任务（T）**：滚动 60fps，避免任何掉帧。

**行动（A）**：
1. Performance 面板录制滚动：Layout/Paint 单帧耗时 80ms，主线程被一直占满
2. **虚拟滚动**：用 react-virtuoso 只渲染视口 + 缓冲（约 30 行）
3. **content-visibility**：单行 `content-visibility: auto; contain-intrinsic-size: 48px`
4. **行级 memo**：每行包 `React.memo`，对比时排除函数引用
5. **避免读写交替**：原来代码每行 `getBoundingClientRect`，改为统一在 effect 后批量读

**结果（R）**：
- 滚动 12fps → 稳定 60fps
- 内存占用 480MB → 80MB
- 首屏渲染时间 3.2s → 0.5s

**思考**：长列表先想虚拟滚动，CSS 层有时候比 JS 层更便宜。

---

### 案例 3：bundle 从 8.6MB → 2.1MB

**背景（S）**：B 端 SaaS 应用，全量加载，3G 网络下加载超过 1 分钟。

**任务（T）**：bundle 体积砍到 30% 以内。

**行动（A）**：
1. webpack-bundle-analyzer 分析依赖体积
2. **替换大依赖**：
   - moment → dayjs（200KB → 7KB）
   - antd@3 → 按需 + babel-plugin-import
   - echarts 全量 → 按需引入 charts/components
3. **代码分割**：
   - 路由级 lazy + magic comment 命名
   - 弹窗大组件改动态 import
4. **tree-shaking**：
   - `package.json` 加 `sideEffects: false`
   - 部分 CommonJS 包改 ESM 版本
5. **CDN externals**：vue / react / lodash / 大组件库
6. **压缩**：terser + brotli
7. **babel polyfill 按需**：targets + `useBuiltIns: 'usage'`

**结果（R）**：
- bundle 8.6MB → 2.1MB（首屏 3.4MB → 0.6MB）
- 3G 加载 60s → 12s
- LCP 6.5s → 1.8s

**思考**：体积优化是个细水长流的活，工具链 + bundle analyzer 长期监控。

---

## 五、SEO（SPA 的痛点）

SPA SEO 难点：搜索引擎抓初次 HTML 没内容。

方案：
1. **SSR**：Next / Nuxt / Vite SSR，最彻底
2. **SSG**：静态生成（Astro / VitePress / Hugo），最快
3. **预渲染**：构建时跑无头浏览器抓取关键路由（prerender-spa-plugin）
4. **动态渲染**：服务器检测爬虫 UA，返回预渲染版本，普通用户返 SPA
5. **元数据**：每页正确的 `<title>`、`<meta description>`、`og:`、JSON-LD 结构化数据
6. **sitemap.xml + robots.txt**

## 六、性能预算与监控

建立性能预算：
- 主 bundle ≤ 200KB gzip
- LCP ≤ 2s
- INP ≤ 200ms
- 第三方资源 ≤ 50KB

CI 中接入：
- Lighthouse CI（PR 阶段对比基线）
- bundlesize / size-limit（控制 bundle 增长）
- web-vitals + 自建监控平台（线上实时）

## 七、面试话术骨架

被问到"项目里做过哪些性能优化"，按这个套路：

1. **背景**：什么业务、什么场景、什么用户群体
2. **现状**：用 Lighthouse / 监控平台拿到具体数据
3. **定位**：用 Performance 面板或 webpack-bundle-analyzer 找瓶颈
4. **方案**：分加载、渲染、运行时三类系统地讲
5. **结果**：必须有量化数据
6. **思考**：踩过什么坑、哪里可以再优化

**优秀回答 = 数据驱动 + 闭环思维**。
