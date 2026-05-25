---
title: 前端工程化
description: 工程化体系、构建工具、模块化、Monorepo
---

# 前端工程化

## 什么是工程化

> 用自动化、标准化、工具化的方式，把研发流程中的低效、重复、易错环节固化下来。

涵盖范围：
- 项目脚手架（团队规范固化）
- 构建工具（webpack / vite / rspack / turbopack）
- 编译工具（babel / swc / esbuild）
- 包管理（npm / yarn / pnpm + monorepo）
- 代码规范（ESLint / Prettier / commitlint / husky）
- 测试（vitest / jest / cypress / playwright）
- CI/CD（GitHub Actions / Jenkins / GitLab CI）
- 监控（错误 / 性能 / 行为埋点）
- 微前端 / 组件库 / 设计系统

## AST 是什么

**抽象语法树**，是源码的结构化表示。前端工程化的几乎所有工具底层都基于 AST：

```
源码 → 词法分析（Tokenizer）→ Token 流 → 语法分析（Parser）→ AST → 转换（Transform）→ 生成（Generator）→ 目标代码
```

应用：
- babel：JS 转译
- ESLint：代码检查（遍历 AST 找问题）
- prettier：代码格式化
- vue-template-compiler：模板 → render 函数
- webpack：分析 import/export 关系做 tree-shaking
- jscodeshift / ast-grep：大规模代码改写

## 模块化

意义：
- 避免全局变量污染、命名冲突
- 解决依赖顺序
- 私有作用域

| 规范 | 语法 | 场景 |
| --- | --- | --- |
| IIFE | `(function(){})()` | 早期，jQuery 时代 |
| CommonJS | `require` / `module.exports` | Node |
| AMD | `define([], cb)` | 浏览器异步（RequireJS） |
| CMD | `define(fn)` | 浏览器异步（SeaJS） |
| UMD | 兼容多种 | 库分发 |
| **ESM** | `import` / `export` | 现代标准 |

ESM vs CJS（重要）：
- 静态 vs 动态分析
- 引用 vs 拷贝
- 异步 vs 同步
- tree-shaking 支持

## Node 使用 ESM

三种方式：
1. 文件后缀 `.mjs`
2. `package.json` 中 `"type": "module"`
3. 启动参数 `--input-type=module`

注意：
- ESM 中没有 `__dirname` / `require`，要用 `import.meta.url`
- 顶层 await 仅 ESM 支持

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Babel

**作用**：JS 工具链，做语法转译与代码改造。

工作三阶段：

```
parse（@babel/parser）→ AST
  ↓
transform（@babel/traverse + @babel/types）→ 新 AST
  ↓
generate（@babel/generator）→ 目标代码
```

常用：
- 语法：ES6+ → ES5（`@babel/preset-env`）
- API：通过 `core-js` polyfill 补齐
- TS：`@babel/preset-typescript`
- JSX：`@babel/preset-react`
- 自定义插件：`@babel/plugin-...`

配置示例：

```js
// babel.config.json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.5%, last 2 versions",
      "useBuiltIns": "usage",
      "corejs": 3
    }]
  ]
}
```

`useBuiltIns: 'usage'` 按需引入 polyfill，比 entry 模式更省。

## SWC / esbuild / Rspack

新一代工具链，比 Babel + webpack 快 10~100x：

| 工具 | 语言 | 用途 |
| --- | --- | --- |
| esbuild | Go | 打包 + 编译（vite 预构建） |
| SWC | Rust | 编译（Next.js 默认） |
| Rspack | Rust | webpack 兼容打包 |
| Turbopack | Rust | Next.js 实验打包 |
| Rolldown | Rust | Rollup 替代（vite 未来） |
| Biome | Rust | ESLint+Prettier 替代 |

快的原因：
1. 系统语言（Go/Rust）+ 并行编译
2. 跳过类型检查（TS 类型只是擦除）
3. 跳过中间字符串拼接，直接产生最终代码

## Monorepo

| 维度 | Monorepo | Multi-repo |
| --- | --- | --- |
| 仓库数 | 1 个含多包 | N 个分散 |
| 代码共享 | 直接互引 | 通过 npm 发布 |
| 一致性 | 工具链统一 | 各自为政 |
| 版本管理 | 集中（changeset） | 各自 |
| 构建复杂度 | 高，需构建编排 | 简单 |
| 适用 | 中大型团队 | 独立小项目 |

工具：

| 工具 | 特点 |
| --- | --- |
| pnpm workspace | 包管理基础，软硬链接最省 |
| yarn workspace | npm 系老牌 |
| Lerna | 老牌，专注版本发布 |
| **Turborepo** | Vercel 出品，远程缓存，配置简单 |
| **Nx** | 大而全，依赖图、影响范围分析 |
| Rush | 微软出品，企业级 |
| Changesets | 多包版本管理、自动 changelog |

`pnpm-workspace.yaml`：

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

跨包引用：

```bash
pnpm i lodash --filter @org/ui          # 给指定包加依赖
pnpm i @org/utils --filter @org/web --workspace  # 内部包引用
pnpm -r build                            # 递归构建
pnpm --filter @org/web build             # 只构建一个
```

## tree-shaking

**前提**：ESM 静态可分析。

**原理**：
1. 构建时分析所有 `import / export`
2. 标记被使用的 export
3. 标记副作用（package.json 的 `sideEffects`）
4. 压缩阶段（terser）真正删掉死代码

**配合**：
```json
// package.json
{
  "sideEffects": false,                  // 整个包无副作用
  // 或精确指定有副作用的文件
  "sideEffects": ["*.css", "./polyfill.js"]
}
```

不能 tree-shake 的情况：
- CJS（动态导入）
- 副作用代码（顶层执行）
- 整体 import：`import * as _ from 'lodash'` → `import _ from 'lodash/isEmpty'`
- 动态访问：`const m = require(name)`

## 提升构建速度

| 方向 | 手段 |
| --- | --- |
| 减少处理量 | exclude node_modules、`thread-loader`、`cache-loader`、持久化缓存 |
| 并行 | `thread-loader`、`terser-webpack-plugin parallel` |
| 跳过 | `DllPlugin`（已过时）、CDN externals |
| 增量 | 持久化缓存（webpack 5 内置 `cache: { type: 'filesystem' }`）|
| 换工具 | esbuild-loader、swc-loader、Rspack |

## 减少打包体积

1. **tree-shaking**（前提 ESM）
2. **代码分割**：路由级 / 组件级 lazy
3. **压缩**：terser / esbuild minify / brotli
4. **CDN externals**：vue / react / lodash 等
5. **按需引入**：antd / lodash-es / dayjs
6. **替换大依赖**：moment → dayjs / luxon
7. **babel polyfill 按需**：`useBuiltIns: 'usage'` + `core-js`
8. **去掉 sourcemap**（生产环境，但保留上传到监控）
9. **`bundle-analyzer`** 持续监控

## React vs Vue（工程视角）

- **React**
  - 运行时框架，JSX → React.createElement
  - 灵活：render 函数能用 JS 全能力
  - 默认全量比对，需手动 memo 优化
  - 生态以社区为主
- **Vue**
  - 编译时框架，模板编译为虚拟节点
  - 灵活性弱（但模板有 PatchFlag 等编译优化）
  - 响应式 + 模板编译可做精准更新
  - 生态官方主导，开箱即用

选型考虑：
- 团队熟悉度
- 项目规模与复杂度
- 与现有系统兼容
- 招聘市场

## pnpm 原理

1. **全局 store**：所有版本只下载一次，存 `~/.pnpm-store`，内容寻址（hash 命名）
2. **硬链接**：项目 `node_modules/.pnpm` 下用硬链接指向 store（同一物理文件）
3. **软链接**：项目 `node_modules` 中各包是软链接，指向 `.pnpm` 下的真实位置
4. **依赖隔离**：项目里只能访问 `package.json` 中声明的依赖（解决幽灵依赖）

收益：
- 速度（不重复解压）
- 磁盘（多项目共享）
- 安全（严格依赖树）

## 软链接 vs 硬链接

| 维度 | 硬链接 | 软链接（符号链接） |
| --- | --- | --- |
| 本质 | 同一 inode 的多个名字 | 一个新文件，内容是路径 |
| 删除源 | 仍可用（计数减一） | 失效（指向死链） |
| 跨文件系统 | 不能 | 能 |
| 链接目录 | 一般不能 | 能 |
| 占空间 | 不占 | 占少量元数据 |

npm 是软链接，pnpm 用硬链接 + 软链接组合。

## 选型建议

- 新项目首选 **vite + pnpm**
- 大型 monorepo：**pnpm workspace + Turborepo / Nx**
- 老 webpack 项目：迁移 **Rspack**（API 兼容）
- SSR 框架：**Next（React） / Nuxt（Vue） / SvelteKit / Astro**
- 编译器：**SWC（生产） / esbuild（开发）**
- Lint：**Biome / ESLint + Prettier**
- 测试：**Vitest（单测） + Playwright（E2E）**
