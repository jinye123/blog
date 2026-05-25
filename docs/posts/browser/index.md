---
title: 浏览器原理
description: 渲染流水线、跨域、缓存、存储、安全、事件机制
---

# 浏览器原理

## 输入 URL 到看到页面（必考）

```
1. 解析 URL       → 提取协议、host、path
2. DNS 解析       → 域名转 IP（本地缓存 → hosts → 路由器 → 运营商 → 根域名）
3. TCP 三次握手    → 建立连接
4. TLS 握手        → HTTPS 协商对称密钥
5. 发送 HTTP 请求
6. 服务器响应
7. 浏览器解析渲染：
   a. HTML → DOM 树（边下边解析）
   b. CSS → CSSOM 树
   c. JS 执行（可能阻塞）
   d. DOM + CSSOM → Render Tree
   e. Layout（计算几何位置）
   f. Paint（填充像素，分图层）
   g. Composite（GPU 合成上屏）
8. 卸载阶段（关闭页面）：beforeunload / unload
```

每一步都可能被面试官展开追问。

## 浏览器进程架构

Chrome 多进程模型：

| 进程 | 职责 |
| --- | --- |
| Browser | 主进程：UI、网络、子进程管理 |
| Renderer | 每个 tab 一个（同站点合并）：解析、渲染、JS 执行 |
| GPU | 图形合成 |
| Plugin / Utility | 插件、网络、音频等 |

Renderer 内有多线程：
- 主线程：解析、Layout、Paint、JS
- 合成线程：处理已分层内容
- 工作线程：Worker / Service Worker
- 网络线程：fetch

## 渲染流水线（细化）

```
HTML Bytes → Tokens → Nodes → DOM
CSS Bytes  → Tokens → Rules → CSSOM
DOM + CSSOM → Render Tree
Render Tree → Layout → Layer → Paint → Composite
```

**阻塞关系**：
- CSS 不阻塞 DOM 解析，但**阻塞渲染**
- JS 阻塞 DOM 解析（除 defer/async）
- JS 执行需等待前面的 CSS 下载完成（构建 CSSOM）

优化思路：
- CSS 放头部、JS 放底部 / defer / async
- 关键 CSS 内联
- 减少阻塞资源数量

## 重排（Reflow）与重绘（Repaint）

| 概念 | 触发 | 成本 |
| --- | --- | --- |
| 重排 | 几何属性变化（宽高、位置、display） | 高（要重新 Layout） |
| 重绘 | 视觉属性变化（color、background） | 中 |
| 合成 | transform、opacity、filter | 低（GPU） |

**触发重排的常见操作**：
- 改 width / height / margin / padding / border
- 改 position / display / float
- 添加 / 删除 / 移动可见 DOM
- 获取布局信息（offsetWidth / clientHeight / scrollTop / getBoundingClientRect）→ 强制同步布局
- 改字体大小、视口尺寸变化

**优化**：
1. 批量改动（用 class 切换、DocumentFragment）
2. 离屏改动（先 display:none，改完再显示）
3. 用 transform / opacity 代替 top / left / display
4. 避免读写交替（先读完所有布局值，再写）
5. `will-change` 提示提前提升合成层（不滥用，浪费内存）
6. `content-visibility: auto` 跳过不可视内容渲染

## 跨域

**同源策略**：协议 + 域名 + 端口三者完全一致。

被同源策略限制的：
- AJAX / Fetch
- Cookie / LocalStorage / IndexedDB
- DOM 访问（iframe）

不受限制的：
- `<script src>` / `<link href>` / `<img src>` / `<video>` 等资源标签

### CORS（最常用）

**简单请求**（满足全部条件，直接发送，无预检）：
- 方法：GET / POST / HEAD
- Content-Type：`text/plain` / `multipart/form-data` / `application/x-www-form-urlencoded`
- 头部只有安全列表内的（Accept、Accept-Language、Content-Language、Content-Type 等）

**预检请求 OPTIONS**（其他情况）：
- 自定义头部 / `Content-Type: application/json` / `PUT/DELETE/PATCH`

预检流程：

```
1. 浏览器先发 OPTIONS：
   Origin: https://a.com
   Access-Control-Request-Method: PUT
   Access-Control-Request-Headers: X-Token

2. 服务器响应：
   Access-Control-Allow-Origin: https://a.com   (不能用 * 配合 cookie)
   Access-Control-Allow-Methods: PUT,POST
   Access-Control-Allow-Headers: X-Token
   Access-Control-Max-Age: 86400                 (预检缓存秒数)
   Access-Control-Allow-Credentials: true

3. 通过后才发真实请求
```

Cookie 跨域需要：
- 服务端 `Access-Control-Allow-Credentials: true`
- 前端 `fetch(url, { credentials: 'include' })`
- Origin 不能是 `*`，必须明确域名
- Cookie 本身的 `SameSite=None; Secure`

### 其他跨域方案

| 方案 | 原理 | 限制 |
| --- | --- | --- |
| JSONP | `<script>` 不受同源限制，回调拼接 | 仅 GET、安全风险 |
| postMessage | window 之间消息传递 | 用于 iframe / 多 tab |
| document.domain | 主域相同的子域可设置 | 已废弃，仅用于过渡 |
| WebSocket | 协议本身不受同源限制 | 协议升级 |
| nginx 反向代理 | 服务端转发，前端访问同源地址 | 生产首选 |
| 开发 proxy | webpack/vite devServer | 仅本地开发 |

## 浏览器缓存（必考全流程）

```
请求资源
  ↓
本地 memory cache / disk cache？
  ↓ 有且未过期
直接用（200 from cache）
  ↓ 无或过期
带 If-None-Match / If-Modified-Since 请求服务器
  ↓
服务器对比
  ↓ 没变
返回 304，浏览器用本地
  ↓ 变了
返回 200 + 新资源
```

### 强缓存（不发请求）

- `Cache-Control: max-age=31536000`（最高优先级）
- `Cache-Control: no-cache`：不用强缓存，但可协商缓存
- `Cache-Control: no-store`：完全不缓存
- `Cache-Control: public / private`：可被代理缓存 / 只能浏览器
- `Cache-Control: immutable`：标记永不变化（带 hash 的资源）
- `Expires: <绝对时间>`（HTTP 1.0，被 max-age 覆盖）

### 协商缓存（发请求 + 304）

- `ETag` ↔ `If-None-Match`：内容哈希
- `Last-Modified` ↔ `If-Modified-Since`：时间戳（秒精度，弱）

ETag 优先级高于 Last-Modified。

### 实战缓存策略

| 资源 | 策略 |
| --- | --- |
| HTML | `Cache-Control: no-cache`（要走协商，否则更新拿不到） |
| 带 hash 的 JS/CSS | `Cache-Control: max-age=31536000, immutable` |
| 图片 | 较长 max-age |
| API | 一般不缓存（或专门设计） |

## Storage 对比

| 维度 | cookie | localStorage | sessionStorage | IndexedDB | Cache Storage |
| --- | --- | --- | --- | --- | --- |
| 容量 | 4KB | 5~10MB | 5~10MB | 250MB+ | 浏览器限额 |
| 生命 | 自设 | 永久 | 标签页关闭 | 永久 | 永久（Service Worker） |
| 自动随请求 | 是 | 否 | 否 | 否 | 否 |
| 通信 | 同域 | 同源 | 同标签页 | 同源 | 同源 |
| API | 字符串 | 同步 KV | 同步 KV | 异步事务 | Request/Response |
| SSR | 是 | 否 | 否 | 否 | 否 |

### cookie 关键字段

```
Set-Cookie: token=abc;
  Domain=example.com;
  Path=/;
  Expires=Wed, 25 May 2027 12:00:00 GMT;
  Max-Age=3600;
  HttpOnly;
  Secure;
  SameSite=Lax
```

- `HttpOnly`：JS 不能读（防 XSS 窃取）
- `Secure`：只在 HTTPS 下发送
- `SameSite`：
  - `Strict`：完全禁止第三方
  - `Lax`（现代默认）：导航 GET 允许，其余禁止
  - `None`：允许跨站（必须配 Secure）

## XSS（跨站脚本攻击）

| 类型 | 原理 | 例子 |
| --- | --- | --- |
| 反射型 | 恶意脚本在 URL 中，服务器返回到页面 | `?q=<script>...</script>` |
| 存储型 | 恶意脚本存数据库，多人受害 | 留言板插脚本 |
| DOM 型 | 前端解析 URL / 输入直接插入 DOM | `innerHTML = location.hash` |

**防御**：
1. **输出转义**：根据上下文（HTML / 属性 / URL / JS / CSS）选择不同转义
2. **CSP**：`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xxx'`
3. **HttpOnly Cookie**：脚本拿不到 token
4. **避免 innerHTML / dangerouslySetInnerHTML**，用 textContent
5. **现代框架默认转义**（Vue/React 内置防御，除非用 v-html / dangerouslySetInnerHTML）

## CSRF（跨站请求伪造）

原理：用户已登录 A 站，被诱导访问 B 站，B 站偷偷向 A 站发请求，浏览器自动带上 A 站 cookie。

**防御**：
1. **SameSite cookie**（最有效的现代方案，Lax 即可挡大部分）
2. **CSRF Token**：服务端下发随机 token，前端每次请求带上
3. **Referer / Origin 校验**
4. **关键操作二次确认**（密码、短信验证）
5. **避免 GET 修改数据**

## CSP（内容安全策略）

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-abc123' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
  report-uri /csp-report
```

效果：
- 阻止内联脚本（除非 nonce/hash）
- 阻止 eval
- 限制资源来源
- 防 clickjacking（frame-ancestors）

## 浏览器事件机制

三阶段：

```
Window → Document → ... → 目标
              ↓ capture（捕获，从外到内）
              ↓ target（目标）
              ↓ bubble（冒泡，从内到外）
```

`addEventListener(type, fn, { capture, once, passive })`：
- `capture: true`：在捕获阶段触发
- `once: true`：只触发一次
- `passive: true`：承诺不调用 `preventDefault`，让浏览器优化（重要：滚动事件加 passive 显著提升滚动流畅度）

### 事件委托

把子元素的事件统一绑到父元素，利用冒泡。

```js
ul.addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    handleItem(e.target);
  }
});
```

收益：
- 减少绑定数量（节省内存）
- 动态新增子元素无需重新绑定

### React 合成事件

- React 把所有事件代理到 React 根容器（17 起，之前是 document）
- 事件对象包装为 `SyntheticEvent`，跨浏览器一致
- 与原生事件可能有冲突（注意 stopPropagation 不影响原生）
- 受控组件依赖合成事件触发 setState

## requestIdleCallback / requestAnimationFrame

- `requestAnimationFrame`：每帧绘制前调用，动画首选
- `requestIdleCallback`：浏览器空闲时调用，低优先级任务（埋点、统计、预渲染）

React 18+ 不用 idle callback，而是用 MessageChannel + 5ms 时间片，更可控。

## Web Worker / Service Worker

参见 [HTML 板块](../html/index.md#web-worker-vs-service-worker)。

补充 Service Worker 的常见缓存策略：

| 策略 | 行为 |
| --- | --- |
| Cache First | 先查缓存，命中直接用，未命中走网络 |
| Network First | 先走网络，失败再用缓存 |
| Stale While Revalidate | 用缓存，同时后台更新 |
| Cache Only | 只用缓存 |
| Network Only | 只走网络 |

## 安全总结

| 威胁 | 防御 |
| --- | --- |
| XSS | 输出转义、CSP、HttpOnly、框架默认转义 |
| CSRF | SameSite、Token、Referer 校验 |
| 点击劫持 | `X-Frame-Options: DENY` / CSP frame-ancestors |
| 中间人 | HTTPS + HSTS |
| SQL 注入 | 后端事，但前端要做基础校验 |
| 上传木马 | 文件类型校验、扫描、隔离域名 |
| 信息泄露 | 不在前端放敏感配置（key 必须在后端） |
| 越权 | 接口鉴权（前端只是辅助） |

## 浏览器性能 API

```js
// 1. Navigation Timing：页面加载时间
performance.getEntriesByType('navigation');

// 2. Resource Timing：资源加载
performance.getEntriesByType('resource');

// 3. Paint Timing：首次绘制 / 首次内容绘制
performance.getEntriesByType('paint');

// 4. PerformanceObserver：监听各类指标
new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => report(entry));
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

## 总结

浏览器原理是面试**深挖区**，建议把"输入 URL 到看到页面"作为主线，能展开讲到 DNS、TCP、HTTP 缓存、渲染流水线、重排重绘、跨域、安全、事件机制——这是一道串起整个前端体系的题。
