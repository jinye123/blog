---
title: 场景题
description: 前端高频场景题与解决方案
---

# 场景题

## 大文件上传

完整方案：**分片 + 哈希 + 秒传 + 断点续传 + 并发控制**。

### 流程

```
1. 选择文件 → File.slice 切片（默认 5MB 一片）
2. 用 SparkMD5 增量算整文件 hash（放 Web Worker，避免阻塞）
3. 调"查询接口"：服务端是否已存在该 hash → 已存在直接秒传
4. 调"查询接口"：返回已上传的分片索引列表 → 断点续传
5. 并发上传缺失分片（一般 3~6 并发）
6. 全部完成调"合并接口"
```

### 关键点

- **hash**：增量计算（每片喂给 SparkMD5），不要一次性读整个文件
- **Worker**：大文件 hash 几十秒，必须放后台线程
- **限并发**：用 Promise pool
- **失败重试**：单分片可重试 3 次
- **进度**：每片完成更新总进度
- **服务端**：保存分片为临时文件，合并时按 index 顺序写入

```js
// 切片
function createChunks(file, size = 5 * 1024 * 1024) {
  const chunks = [];
  for (let i = 0; i < file.size; i += size) {
    chunks.push(file.slice(i, i + size));
  }
  return chunks;
}

// hash（worker 内）
import SparkMD5 from 'spark-md5';
async function calcHash(chunks) {
  const spark = new SparkMD5.ArrayBuffer();
  for (const chunk of chunks) {
    const buf = await chunk.arrayBuffer();
    spark.append(buf);
  }
  return spark.end();
}
```

## 大文件下载（流式 + 进度）

```js
const res = await fetch(url);
const total = +res.headers.get('content-length');
const reader = res.body.getReader();
let loaded = 0;
const chunks = [];
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunks.push(value);
  loaded += value.length;
  onProgress(loaded / total);
}
const blob = new Blob(chunks);
const url2 = URL.createObjectURL(blob);
// 下载
const a = document.createElement('a');
a.href = url2;
a.download = 'file';
a.click();
```

断点续传：用 `Range: bytes=start-end` 请求 + 服务器返 206。

## 拖拽

### HTML5 Drag API

```js
elem.draggable = true;
elem.addEventListener('dragstart', e => e.dataTransfer.setData('id', elem.id));
target.addEventListener('dragover', e => e.preventDefault());   // 必须
target.addEventListener('drop', e => {
  const id = e.dataTransfer.getData('id');
  target.appendChild(document.getElementById(id));
});
```

### 自定义拖拽（更灵活）

```js
function makeDraggable(el) {
  let startX, startY, originX, originY;
  el.addEventListener('mousedown', (e) => {
    startX = e.clientX; startY = e.clientY;
    const rect = el.getBoundingClientRect();
    originX = rect.left; originY = rect.top;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  function onMove(e) {
    el.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px)`;
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}
```

## 单点登录 SSO

### CAS 流程（企业内部）

```
1. 用户访问 A 系统 → 未登录 → 跳转 SSO 中心
2. SSO 登录页输入账号 → 校验通过 → 生成 ticket
3. SSO 重定向回 A：A.com?ticket=xxx
4. A 后端用 ticket 去 SSO 服务校验 → 拿到用户信息
5. A 写入自身 session / cookie
6. 用户访问 B 系统 → 未登录 → 跳转 SSO 中心
7. SSO 检测到已有 session（cookie），不需要再登录
8. 直接发新 ticket 给 B
9. B 重复 4-5 步
```

### JWT 方案

```
1. 登录返回 JWT（含用户信息 + 签名）
2. 前端存 cookie / localStorage
3. 后续请求带 Authorization: Bearer <token>
4. 后端验签 → 拿用户信息
```

JWT 三段：`Header.Payload.Signature`，base64 url encoded。

注意：
- localStorage 易被 XSS 偷
- cookie HttpOnly 更安全但要防 CSRF
- 短期 access token + 长期 refresh token

### 同主域 cookie

`a.example.com` 和 `b.example.com` 共享 `Domain=.example.com` 的 cookie，最简单的"单点"方式。

## 错误监控

参见 [架构与基建 - 错误监控平台](../build/architecture.md#四、错误监控平台)。

要点：
1. 全类型捕获（JS / Promise / 资源 / 接口 / 框架）
2. sourcemap 还原
3. 行为面包屑
4. 上报降级（sendBeacon → image → fetch keepalive）
5. 采样率控制
6. 分组聚合（相同 hash 合并）
7. 告警阈值

## 性能监控

```js
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
[onLCP, onINP, onCLS, onFCP, onTTFB].forEach(fn => fn(report));

// 接口性能
axios.interceptors.request.use(c => { c.meta = { start: Date.now() }; return c; });
axios.interceptors.response.use(r => {
  report({ url: r.config.url, duration: Date.now() - r.config.meta.start });
  return r;
});

// 资源
new PerformanceObserver(list => {
  list.getEntries().forEach(e => report({ type: 'resource', name: e.name, duration: e.duration }));
}).observe({ entryTypes: ['resource'] });
```

监控分位数（P50/P75/P95/P99）比平均值更有意义。

## 图片懒加载

### IntersectionObserver（推荐）

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      io.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
```

### 原生属性

```html
<img src="x.jpg" loading="lazy" />
```

## 虚拟列表

### 定高

```jsx
function VirtualList({ items, itemHeight = 40, containerHeight = 400 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={e => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>{item.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 不定高
- 估算每项高度
- 渲染后用 ResizeObserver 测真实高度
- 记录已知高度做累积计算
- 库：react-virtuoso、tanstack-virtual

## 权限管理

### 三层
1. **菜单权限**：动态生成路由 / 隐藏菜单项
2. **按钮权限**：v-permission 指令 / 自定义 Hook
3. **接口权限**：后端校验（前端只是 UX，不可信）

### 动态路由

```js
const allRoutes = [...];
const userPermissions = ['user.list', 'user.edit'];

function filterRoutes(routes, perms) {
  return routes
    .filter(r => !r.meta?.permission || perms.includes(r.meta.permission))
    .map(r => ({ ...r, children: r.children ? filterRoutes(r.children, perms) : undefined }));
}

router.addRoute(filterRoutes(allRoutes, userPermissions));
```

### 按钮权限

```vue
<el-button v-permission="'user.edit'">编辑</el-button>

<script>
app.directive('permission', {
  mounted(el, binding) {
    const perms = store.state.user.permissions;
    if (!perms.includes(binding.value)) el.remove();
  }
});
</script>
```

## 水印

```js
function watermark(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.rotate(-Math.PI / 12);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillText(text, 20, 60);

  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed; inset: 0;
    pointer-events: none;
    z-index: 9999;
    background: url(${canvas.toDataURL()});
  `;
  document.body.appendChild(div);

  // 防删除
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if ([...m.removedNodes].includes(div)) document.body.appendChild(div);
    }
  }).observe(document.body, { childList: true });
}
```

## 截图（前端）

- **html2canvas**：把 DOM 转 canvas（不完美，部分 CSS 不支持）
- **dom-to-image**：类似
- **服务端 puppeteer**：最准
- **现代浏览器原生**：`navigator.mediaDevices.getDisplayMedia` 录屏 / 截屏

## PC / 移动端重定向

```js
const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
if (isMobile && !location.pathname.startsWith('/m')) location.replace('/m' + location.pathname);
```

更优：服务端 302（避免闪烁）+ Vary: User-Agent 缓存。

## 进度条

### 接口上传 / 下载

```js
axios.post(url, formData, {
  onUploadProgress: (e) => setPercent(e.loaded / e.total)
});
```

### 资源加载（首屏 progress）

```js
const scripts = document.querySelectorAll('script[src]');
const links = document.querySelectorAll('link[rel=stylesheet]');
const total = scripts.length + links.length;
let loaded = 0;
[...scripts, ...links].forEach(el => {
  if (el.complete) loaded++;
  else el.addEventListener('load', () => updateProgress(++loaded / total));
});
```

## 错误捕获

| 类型 | 方式 |
| --- | --- |
| 同步异常 | try/catch |
| Promise reject | `.catch` / `unhandledrejection` |
| 全局未捕获 | `window.onerror` |
| 资源加载失败 | `window.addEventListener('error', fn, true)` |
| Vue | `app.config.errorHandler` |
| React | Error Boundary |
| 跨域脚本 | `<script crossorigin>` + 服务器 `Access-Control-Allow-Origin` |
| 网络 | axios 拦截器 |

## Web Worker vs Service Worker

| 维度 | Web Worker | Service Worker |
| --- | --- | --- |
| 用途 | CPU 密集 | 网络代理、缓存、离线、推送 |
| 生命周期 | 跟页面 | 注册后常驻 |
| DOM | 不能访问 | 不能访问 |
| 拦截请求 | 不能 | 能 |
| HTTPS | 否 | **必须** |
| 多线程 | ✓ | 单实例代理多 tab |

## 大数运算

```js
// BigInt
const a = 9007199254740992n;
const b = 1n;
a + b;            // 9007199254740993n

// 字符串相加（兼容老环境）
function bigAdd(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0, result = '';
  while (i >= 0 || j >= 0 || carry) {
    const sum = (+a[i] || 0) + (+b[j] || 0) + carry;
    result = (sum % 10) + result;
    carry = Math.floor(sum / 10);
    i--; j--;
  }
  return result;
}
```

注意：JSON 大数字会损失精度，后端最好返回 string。

## 富文本编辑器

技术：`contenteditable` + Selection / Range API。

主流库：
- **TinyMCE / CKEditor**：老牌，重
- **Quill**：API 简洁
- **TipTap / ProseMirror**：现代，基于结构化文档模型
- **Slate / Lexical**：自定义渲染层

要点：
- 一定要解决粘贴 Word / Excel 内容
- 抗 XSS：上传前后端双重过滤
- 协作编辑：Y.js / Automerge（CRDT）

## 防刷接口

- 前端：防抖 / 节流 / loading 期间禁点
- 鉴权：token 时效 + refresh
- 网关：限流（漏桶 / 令牌桶）+ 黑名单
- 验证码：图形 / 滑动 / 短信
- 风控：行为分析（停留时间、鼠标轨迹）

## 浏览器多 tab 通信

| 方案 | 适用 |
| --- | --- |
| BroadcastChannel | 现代浏览器，同源各 tab 即时通信 |
| localStorage + storage 事件 | 兼容性好 |
| SharedWorker | 独立线程统一管理 |
| Service Worker | 拦截请求层面 |
| WebSocket（服务端中转） | 跨源 / 跨设备 |

```js
// BroadcastChannel
const ch = new BroadcastChannel('app');
ch.onmessage = (e) => console.log(e.data);
ch.postMessage({ type: 'logout' });

// localStorage 事件（自身 tab 不触发，仅其他 tab）
localStorage.setItem('event', JSON.stringify({ type: 'logout', ts: Date.now() }));
window.addEventListener('storage', (e) => { if (e.key === 'event') ... });
```
