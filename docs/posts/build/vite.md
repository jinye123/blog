---
title: Vite
description: Vite 核心原理、bundle-less、HMR、构建流程
---

# Vite

## 一句话

Vite 利用浏览器原生 ESM 实现 **dev 阶段不打包**，借用 **esbuild 预构建第三方依赖**，生产用 **Rollup 打包**。

## 为什么需要 Vite

webpack 时代的痛点：
- 启动慢：必须先打包全量代码才能起 dev server
- HMR 慢：项目大了后单次更新也要全量 walk 依赖图
- 配置复杂：loader / plugin / 各种 hash 占位

Vite 的策略：
- 开发阶段不打包，按需编译
- 借用浏览器原生 ESM
- 用 Go 写的 esbuild 做预编译，比 JS 写的 webpack 快 10~100 倍

## 模块化规范

| 规范 | 场景 |
| --- | --- |
| CommonJS | Node 默认 |
| AMD | 早期浏览器（RequireJS） |
| CMD | SeaJS |
| UMD | 兼容前两者 |
| **ESM** | 现代标准，浏览器和 Node 原生支持 |

ESM 关键特性：
- 静态分析（编译时解析依赖）
- 异步加载
- 顶层 await
- 浏览器原生 `<script type="module">`

## bundle 与 bundle-less

**bundle**：webpack 时代，把所有依赖打包成几个文件，浏览器加载几个 bundle。

**bundle-less**：vite 时代，让浏览器直接加载源文件，按需解析。

bundle-less 优势：
- 启动复杂度 O(1)（不依赖项目大小）
- HMR 快（只编译单个文件）
- 调试直观（每个文件可独立看）

## Vite 核心特点

1. **使用简单**：开箱即用，预设 vue / react / ts 模板
2. **启动快**：依赖预构建（esbuild） + 源码按需编译
3. **HMR 快**：基于 ESM，只发改动文件
4. **生态丰富**：兼容 Rollup 插件 + 自身插件 API

## 依赖预构建

浏览器原生 ESM 不会自动解析 `node_modules`，且很多包是 CJS。Vite 启动时：

1. 扫描 `package.json` 找依赖
2. 用 **esbuild** 把 CJS / UMD 转 ESM
3. 把分散的子文件打包为单文件（如 lodash 100+ 文件 → 1 个）
4. 产物存到 `node_modules/.vite/deps`

收益：
- 解决 CJS 兼容性
- 减少浏览器请求数（lodash 不会发 100 个请求）

## 开发服务器

```
浏览器 → http://localhost:5173/src/main.ts
         ↓
Vite Dev Server（connect 框架）
         ↓
1. 中间件链：
   a. 处理 HTML（注入 client.js）
   b. 处理静态资源
   c. 转换源码（.vue / .tsx / .css 等）
2. 拦截 import：
   - 第三方包：重写为 /node_modules/.vite/deps/xxx
   - 源码：转译后返回
3. 缓存：源码 metadata 缓存
```

## HMR 原理

```
1. 启动时建立 WebSocket
2. 修改文件 → 文件系统监听
3. Vite 计算受影响的模块（沿 import 链向上）
4. 找到第一个 accept HMR 的边界（vue 文件、react-refresh）
5. WS 推送 update 消息
6. 浏览器拉取新版本模块代码，执行 import.meta.hot 回调
7. 框架（Vue/React）局部重新渲染
```

`import.meta.hot` API：

```js
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // 接收自身更新
  });
  import.meta.hot.accept('./dep.js', (newDep) => {
    // 接收依赖更新
  });
  import.meta.hot.dispose(() => {
    // 卸载前清理
  });
}
```

## 生产构建

为什么生产环境还要打包？
- 浏览器原生 ESM 在生产是灾难（每个文件一个请求）
- 需要 tree-shaking、压缩、code splitting

Vite 用 **Rollup** 做生产构建：

```
入口 → 解析依赖 → 应用插件 transform → tree-shaking → 代码分割 → 压缩 → 输出
```

为什么不用 esbuild 做生产？
- esbuild 不处理 dts、code splitting 不完善
- esbuild 默认不降级到 ES5
- Rollup 输出更精简、tree-shaking 更彻底

## 构建产物处理

不同文件类型的编译工具：

| 类型 | 工具 |
| --- | --- |
| JS / TS / JSX | esbuild |
| CSS / Less / Sass | postcss + esbuild minify |
| Vue / Svelte | 对应插件（@vitejs/plugin-vue） |
| 图片 / 字体 | 内置 asset 处理 |

## 插件系统（兼容 Rollup）

Rollup 钩子大类：

| 钩子 | 触发时机 |
| --- | --- |
| options | 启动 |
| buildStart | 构建开始 |
| resolveId | 解析模块 ID |
| load | 加载模块 |
| transform | 转换代码 |
| buildEnd | 构建结束 |
| generateBundle | 生成 bundle |
| writeBundle | 写入文件 |
| closeBundle | 关闭 |

Vite 扩展钩子：

| 钩子 | 时机 |
| --- | --- |
| config | 解析配置 |
| configResolved | 配置解析完成 |
| configureServer | 配置 dev server |
| transformIndexHtml | 处理 index.html |
| handleHotUpdate | 处理 HMR |

写一个简单插件：

```js
export default function myPlugin() {
  return {
    name: 'my-plugin',
    enforce: 'pre',           // pre / post
    apply: 'build',           // build / serve

    config(config, env) {},

    transform(code, id) {
      if (id.endsWith('.vue')) {
        return { code: code.replace('foo', 'bar'), map: null };
      }
    }
  };
}
```

## Vite vs webpack

| 维度 | webpack | vite |
| --- | --- | --- |
| 启动 | 全量打包后启动 | 启动即可用，按需编译 |
| HMR | 依赖图重算 | 基于 ESM，单文件 |
| 配置 | 自由度高，但复杂 | 预设多，开箱即用 |
| 生态 | 庞大成熟 | 兼容 Rollup 插件 |
| 生产构建 | webpack | Rollup |
| 适用 | 老项目、定制度高 | 新项目、Vue/React/Svelte |

## Vite 4 / 5 / 6 关键变化

- 4：默认 Rollup 3
- 5：废弃 CJS Node API、提升 SSR 支持
- 6：引入 **Environment API**（多环境构建），为未来 Rolldown 铺路

## Rolldown（未来）

Rollup 的 Rust 重写版，由 Vite 团队主导，目标：
- 用 Rolldown 替换 esbuild + Rollup 双引擎，统一开发与生产
- 性能再提升一个量级

## 设计一个构建工具的关键点

1. **入口与依赖分析**：找到所有需要打包的代码
2. **加载与转换**：根据文件类型挂载对应处理器
3. **插件系统**：暴露钩子，让生态扩展
4. **优化**：tree-shaking / code split / minify / source map
5. **输出**：写入磁盘 + manifest
6. **开发模式**：dev server + HMR
7. **缓存**：避免重复处理
