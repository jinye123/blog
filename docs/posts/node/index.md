---
title: Node.js
description: 运行机制、事件循环、Stream、子进程、中间件、错误处理
---

# Node.js

## Node 是什么 / 能做什么

Node.js 是基于 V8 的 JS 运行时，在浏览器之外提供了 fs / net / http / 子进程等服务端能力。

应用：
- HTTP 服务（异步非阻塞 I/O，适合高并发）
- 命令行工具、脚手架（vite-cli、create-vue）
- 实时应用（WebSocket、聊天）
- 微服务 / BFF
- SSR
- 大数据处理（Stream）
- 桌面（Electron）

## Node 架构

```
┌──────────────────────────────────────────┐
│  应用层（你的代码） + Native Modules     │
│  fs / http / path / stream / events...   │
├──────────────────────────────────────────┤
│  Bindings / C++ Modules                  │
├──────────────────────────────────────────┤
│  V8     libuv      OpenSSL   c-ares      │
│         ↑事件循环                          │
│         ↑线程池                            │
├──────────────────────────────────────────┤
│  操作系统：CPU / 文件 / 网络 / 内存       │
└──────────────────────────────────────────┘
```

- **V8**：JS 引擎
- **libuv**：跨平台异步 I/O、事件循环、线程池
- **OpenSSL**：加密
- **http-parser / llhttp**：HTTP 协议解析
- **c-ares**：DNS

## Node vs 浏览器

| 维度 | Node | 浏览器 |
| --- | --- | --- |
| 宿主 API | fs / net / process / Buffer | DOM / BOM / fetch |
| 模块 | CJS 默认，ESM 支持 | ESM |
| 事件循环 | libuv（6 阶段） | 单循环（task + microtask） |
| 全局 | global / globalThis | window / globalThis |
| this（模块顶层） | module.exports | undefined（ESM） / window |

## 事件循环（必考）

libuv 6 个阶段，循环顺序：

```
┌───────────────────────────┐
│   timers                  │  → 执行到期的 setTimeout / setInterval
├───────────────────────────┤
│   pending callbacks       │  → I/O 错误回调
├───────────────────────────┤
│   idle, prepare           │  → 内部使用
├───────────────────────────┤
│   poll                    │  → 处理 I/O 回调（核心阶段，可能阻塞）
├───────────────────────────┤
│   check                   │  → setImmediate
├───────────────────────────┤
│   close callbacks         │  → 关闭事件回调
└───────────────────────────┘
```

每个阶段之间会清空：
1. `process.nextTick` 队列（优先级最高）
2. 微任务队列（Promise.then / queueMicrotask）

注意：Node 11+ 行为对齐浏览器，每个宏任务后清微任务。Node 11 之前是每个阶段后清。

### setTimeout vs setImmediate

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// 主模块顶层：不确定（依赖系统调度）
// I/O 回调里：immediate 一定在 timeout 前
fs.readFile('x', () => {
  setTimeout(() => console.log('timeout'));
  setImmediate(() => console.log('immediate'));   // 一定先
});
```

原因：I/O 回调在 poll 阶段后，下一站是 check（immediate），再下一轮才到 timers。

### process.nextTick 与 Promise

- `process.nextTick` 优先级 > Promise（在每个阶段间执行）
- 滥用 nextTick 会饿死后续阶段

## process 全局

```js
process.argv          // 命令行参数
process.env           // 环境变量
process.cwd()         // 当前工作目录
process.platform      // 'darwin' / 'win32' / 'linux'
process.version       // node 版本
process.memoryUsage() // 内存
process.cpuUsage()    // CPU
process.exit(code)    // 退出
process.on('uncaughtException', fn)
process.on('unhandledRejection', fn)
process.on('SIGTERM', fn)
process.on('exit', fn)
```

## 子进程

| API | 特点 |
| --- | --- |
| `spawn` | 最基础，异步，stream 形式输出，**适合长进程或大量输出** |
| `fork` | spawn 特例，专为子 Node 进程，内置 IPC 通信 |
| `exec` | 异步，**buffer 输出**（超过 maxBuffer 报错），适合短小命令 |
| `execFile` | 异步，直接执行可执行文件（不走 shell，更安全） |
| `spawnSync` / `execSync` | 同步版本 |

**注意：exec 也是异步的**，所谓"同步"指的是 buffer 一次性返回（区别于 spawn 的流式）。同步版本要加 `Sync`。

```js
const { spawn, fork, exec } = require('node:child_process');

// spawn
const ls = spawn('ls', ['-la']);
ls.stdout.on('data', d => console.log(d.toString()));
ls.on('close', code => console.log(code));

// fork：父子 IPC
const worker = fork('./worker.js');
worker.send({ task: 'hash' });
worker.on('message', result => console.log(result));

// exec
exec('git log --oneline -5', (err, stdout) => console.log(stdout));
```

### 进程崩溃重启

- 用 PM2 / Forever / systemd / Docker 做守护
- 监控 `worker.on('exit', restart)`

## 多进程（cluster）

```js
const cluster = require('node:cluster');
const os = require('node:os');

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) cluster.fork();
  cluster.on('exit', (worker) => cluster.fork());   // 自动重启
} else {
  http.createServer((req, res) => res.end('hi')).listen(3000);
  // 多个 worker 监听同一端口，主进程负载均衡
}
```

应用：CPU 密集业务、提高吞吐。建议生产环境用 PM2 cluster 模式，开箱即用。

## Stream

四种类型：
- **Readable**：可读流（fs.createReadStream、http req）
- **Writable**：可写流（fs.createWriteStream、http res）
- **Duplex**：双工（TCP socket）
- **Transform**：转换（gzip、加密）

```js
// 文件流式 + 转换
fs.createReadStream('big.log')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('big.log.gz'));
```

### readFile vs createReadStream

| 维度 | readFile | createReadStream |
| --- | --- | --- |
| 加载方式 | 一次性读到内存 | 分块流 |
| 内存 | 大文件爆 | 恒定低 |
| 适用 | 小文件 | 大文件 / 边读边处理 |

事件：`data` / `end` / `error` / `close`。

## Buffer

二进制数据容器，处理 TCP 流、文件、二进制协议。

```js
const buf = Buffer.from('hello');
buf.toString('utf8');         // 'hello'
buf.toString('base64');
Buffer.alloc(10);              // 10 字节零
Buffer.concat([buf1, buf2]);

// Buffer 池：小于 8KB 时从 Buffer.poolSize 复用
```

## 模块系统

CJS：

```js
const fs = require('node:fs');
module.exports = { foo };
exports.bar = 1;     // 不能整个赋值 exports，否则失去引用
```

ESM：

```js
import fs from 'node:fs';
export const foo = 1;
export default { bar };
```

启用 ESM：
- `.mjs` 后缀
- `package.json` `"type": "module"`
- 注意 ESM 没有 `__dirname`，用 `import.meta.url`

CJS 加载机制：
1. 解析路径（核心 / 文件 / 文件夹 / node_modules 逐层向上）
2. 检查缓存（`require.cache`）
3. 加载并编译
4. 包装成函数 `(exports, require, module, __filename, __dirname) => { ... }`
5. 执行函数
6. 缓存 `module.exports`

### 实现 require

```js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function myRequire(filename) {
  filename = path.resolve(filename);
  if (myRequire.cache[filename]) return myRequire.cache[filename].exports;

  const module = { exports: {} };
  myRequire.cache[filename] = module;

  const src = fs.readFileSync(filename, 'utf8');
  const wrapper = `(function (exports, require, module, __filename, __dirname) {
    ${src}
  })`;
  const fn = vm.runInThisContext(wrapper);
  fn(module.exports, myRequire, module, filename, path.dirname(filename));

  return module.exports;
}
myRequire.cache = {};
```

## npm / yarn / pnpm

| 维度 | npm | yarn | pnpm |
| --- | --- | --- | --- |
| 算法 | 扁平化 | 扁平化 | 软硬链接 |
| 速度 | 中 | 快（并行） | 最快 |
| 磁盘 | 多余 | 多余 | 极省（全局 store） |
| 幽灵依赖 | 有 | 有 | **无** |
| Lock 文件 | package-lock.json | yarn.lock | pnpm-lock.yaml |

## 依赖类型

```json
{
  "dependencies": {},          // 运行时必需
  "devDependencies": {},       // 开发依赖
  "peerDependencies": {},      // 同版本依赖（插件场景）
  "optionalDependencies": {},  // 可选
  "bundleDependencies": []     // npm pack 时打包进去
}
```

## koa vs express

| 维度 | express | koa |
| --- | --- | --- |
| 中间件模型 | 单向链（回调） | 洋葱模型（async/await） |
| 上下文 | req / res | ctx 统一封装 |
| 内置 | 多（router、static） | 极简 |
| 错误处理 | 错误中间件（err, req, res, next） | try/catch |
| 适合 | 中小项目 | 自由组合，骨架 |

### 洋葱模型

```js
app.use(async (ctx, next) => {
  console.log(1);
  await next();
  console.log(6);
});
app.use(async (ctx, next) => {
  console.log(2);
  await next();
  console.log(5);
});
app.use(async (ctx) => {
  console.log(3);
  ctx.body = 'hi';
  console.log(4);
});

// 输出：1 2 3 4 5 6
```

实现核心：

```js
function compose(middlewares) {
  return function (ctx, next) {
    function dispatch(i) {
      const fn = middlewares[i] || next;
      if (!fn) return Promise.resolve();
      return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
    }
    return dispatch(0);
  };
}
```

express 单向：next 不可 await，没有"回来"的阶段。

## Nest.js

- 基于 TS、装饰器
- 模块化、依赖注入（DI）
- 适合大型工程
- 内置：GraphQL、微服务、CQRS、WebSocket

## 错误处理

```js
// 同步：try/catch
try { JSON.parse(bad); } catch (e) { ... }

// Promise
fetch(url).then().catch(e => ...);
// 或 async/await + try/catch

// 子进程
worker.on('error', fn);

// 全局兜底
process.on('uncaughtException', (err) => {
  log(err);
  // 不要继续运行（状态可能不可恢复），交给守护进程重启
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  log(reason);
});
```

最佳实践：
- 局部 try/catch 优先
- 中间件统一捕获（koa try/catch in top middleware）
- 全局兜底打日志 + 退出 + 守护重启
- 用监控（PM2 + Sentry）

## 性能监控

```js
// 内存
process.memoryUsage();
// { rss, heapTotal, heapUsed, external, arrayBuffers }

// 性能钩子
const { performance, PerformanceObserver } = require('node:perf_hooks');
performance.mark('A');
heavy();
performance.mark('B');
performance.measure('A to B', 'A', 'B');

new PerformanceObserver(items => {
  items.getEntries().forEach(e => console.log(e.name, e.duration));
}).observe({ entryTypes: ['measure'] });
```

工具：
- clinic.js
- 0x（火焰图）
- v8 inspector（chrome devtools 连 Node）

## 常用框架

| 框架 | 特点 |
| --- | --- |
| Express | 老牌轻量 |
| Koa | 洋葱模型，极简 |
| Egg | 阿里出品，约定大于配置 |
| Nest | TS + 装饰器 + DI，企业级 |
| Fastify | 性能极致 |
| Hono | 边缘运行时友好（Cloudflare Workers / Deno / Bun） |

## 部署生态

- PM2：进程守护、cluster、负载均衡、日志聚合
- Docker / k8s
- 边缘运行时：Cloudflare Workers / Vercel Edge / Deno Deploy
- Bun：JS 运行时 + 包管理 + 打包器三合一，启动比 Node 快几倍
