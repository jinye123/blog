---
title: Webpack
description: Webpack 核心概念、构建流程、Loader / Plugin、性能优化
---

# Webpack

## 核心概念

| 概念 | 说明 |
| --- | --- |
| entry | 入口 |
| output | 输出 |
| loader | 文件转换器（webpack 只认 JS，loader 帮它认识其他） |
| plugin | 插件，参与整个生命周期 |
| module | 一个文件就是一个模块 |
| chunk | 一组模块的集合，webpack 内部产物 |
| bundle | 最终输出的文件 |
| code splitting | 把代码拆成多个 bundle，按需加载 |
| HMR | 热模块替换 |

## 最小配置

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash:8].js',
    publicPath: '/',
    clean: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|jpg|webp|svg)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'public/index.html' })
  ],
  mode: 'production'
};
```

## Loader vs Plugin

| 维度 | Loader | Plugin |
| --- | --- | --- |
| 作用 | 转换文件 | 扩展能力 |
| 时机 | 模块构建阶段 | 整个生命周期都可参与 |
| 数据 | 输入：源文件字符串 → 输出：JS 字符串 | 操作 compiler / compilation 对象 |
| 配置位置 | `module.rules` | `plugins` 数组 |
| 链式 | 多个 loader 从右向左（从下到上） | 各自独立 |

## 占位符（filename 与 chunkFilename）

| 占位符 | 含义 |
| --- | --- |
| `[name]` | chunk 名 |
| `[id]` | chunk id |
| `[hash]` | 整次构建 hash（每次构建变） |
| `[chunkhash]` | 单个 chunk 的 hash（chunk 内容变才变） |
| `[contenthash]` | 文件内容 hash（最稳定，推荐） |
| `[ext]` | 后缀 |

最佳实践：

```js
output: {
  filename: 'js/[name].[contenthash:8].js',
  chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  assetModuleFilename: 'assets/[hash][ext]'
}
```

CSS（mini-css-extract-plugin）：

```js
new MiniCssExtractPlugin({
  filename: 'css/[name].[contenthash:8].css'
})
```

## 构建流程

```
1. 读取配置 / merge / 校验
2. 初始化 Compiler 对象
3. 注册所有插件 (apply(compiler))
4. 调用 compiler.run() / watch()
5. 进入 compilation 阶段：
   a. 从 entry 开始，递归构建依赖图
   b. 每个文件用对应 loader 处理
   c. 解析 import / require，加入依赖图
6. 优化（tree-shaking、分包、压缩）
7. 生成 chunk → bundle
8. emit 到输出目录
9. done 钩子触发
```

## bundle / chunk / module 区别

- **module**：一个文件
- **chunk**：webpack 构建过程的产物，是一组 module 的集合
  - 类型：entry / async（动态 import） / runtime
- **bundle**：最终写入磁盘的文件，通常一个 chunk = 一个 bundle

```js
// 一个 entry → 一个 entry chunk
entry: { app: './src/index.js' }

// 动态 import → 一个 async chunk
const About = () => import('./About.js');

// SplitChunksPlugin 把公共依赖抽成新 chunk
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /node_modules/,
        name: 'vendor',
        priority: 10
      }
    }
  }
}
```

## 提高打包速度

1. **持久化缓存**（webpack 5 内置）

```js
cache: {
  type: 'filesystem',
  buildDependencies: { config: [__filename] }
}
```

2. **限制 loader 处理范围**

```js
{ test: /\.js$/, include: path.resolve(__dirname, 'src'), use: 'babel-loader' }
```

3. **多进程**：`thread-loader`、`terser-webpack-plugin parallel`
4. **替换为更快的工具**：`esbuild-loader`、`swc-loader`、`@rspack/core`
5. **CDN externals**：减少打包内容
6. **DllPlugin**（已不推荐，持久化缓存替代）
7. **缩小 resolve 范围**：`extensions` 不要太多

## 减少打包体积

1. tree-shaking（前提 ESM）
2. 代码分割：`splitChunks` + 动态 import
3. 压缩：`TerserPlugin`（JS）、`CssMinimizerPlugin`（CSS）
4. CDN externals
5. 按需引入（antd / lodash）
6. 替换大依赖（moment → dayjs）
7. babel polyfill 按需
8. 删除 console / 注释
9. `webpack-bundle-analyzer` 持续监控

## 写一个 Loader

Loader 本质：接收源代码字符串，返回转换后的字符串。

```js
// style-loader（简化）
module.exports = function (source) {
  return `
    const style = document.createElement('style');
    style.innerHTML = ${JSON.stringify(source)};
    document.head.appendChild(style);
  `;
};

// 异步 loader（如 less）
module.exports = function (source) {
  const callback = this.async();
  less.render(source, (err, result) => {
    if (err) return callback(err);
    callback(null, result.css, result.map);
  });
};

// 拿配置
module.exports = function (source) {
  const options = this.getOptions();
  return source;
};
```

执行顺序：从右往左（数组从后往前），可用 `enforce: 'pre' / 'post'` 改变。

## 写一个 Plugin

Plugin 是一个有 `apply(compiler)` 方法的类。

```js
class ZipPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    // 编译开始
    compiler.hooks.compile.tap('ZipPlugin', () => {
      console.log('开始编译');
    });

    // 资源产出前（可修改资源）
    compiler.hooks.emit.tapAsync('ZipPlugin', (compilation, callback) => {
      // compilation.assets 是所有要输出的资源
      const zip = new JSZip();
      for (const filename in compilation.assets) {
        zip.file(filename, compilation.assets[filename].source());
      }
      zip.generateAsync({ type: 'nodebuffer' }).then(content => {
        compilation.assets[this.options.filename || 'bundle.zip'] = {
          source: () => content,
          size: () => content.length
        };
        callback();
      });
    });

    // 全部完成
    compiler.hooks.done.tap('ZipPlugin', (stats) => {
      console.log('构建完成');
    });
  }
}
```

钩子分类：
- `compiler` 钩子：构建生命周期（init → run → compile → emit → done）
- `compilation` 钩子：单次构建过程内（buildModule → seal → optimize）

Tap 方式：
- `.tap`：同步
- `.tapAsync`：异步（回调）
- `.tapPromise`：异步（Promise）

## HMR 原理

```
1. 启动 webpack-dev-server，建立 WebSocket
2. 修改文件 → webpack 重新编译，但只生成补丁（manifest + 更新模块）
3. 通过 WS 推送更新 hash 到浏览器
4. 浏览器 HMR runtime 请求补丁
5. 模块被替换：
   a. 找到旧模块、新模块的 module.hot.accept 回调
   b. 执行旧模块的 dispose 清理
   c. 加载新模块代码
   d. 调用 accept 回调让框架重新渲染
6. 状态保留（React/Vue HMR 配合框架实现）
```

框架支持：
- `react-refresh-webpack-plugin`
- `vue-loader` 内置 HMR

## webpack 5 关键变化

1. **持久化缓存**：`cache: { type: 'filesystem' }`，二次构建快几十倍
2. **模块联邦 Module Federation**：跨应用共享模块
3. **资源模块**：内置 `asset`、`asset/inline`、`asset/resource`、`asset/source`，不再需要 `file-loader` / `url-loader`
4. **tree-shaking 增强**：支持 commonjs 部分情况
5. **改进 long-term caching**：稳定的 chunk id

## 模块联邦

```js
// 远程应用
new ModuleFederationPlugin({
  name: 'app1',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/Button'
  },
  shared: ['react', 'react-dom']
})

// 宿主应用
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    app1: 'app1@http://app1.com/remoteEntry.js'
  },
  shared: ['react', 'react-dom']
})

// 使用
const Button = React.lazy(() => import('app1/Button'));
```

价值：
- 真正运行时共享（不是构建时）
- 微前端的另一种实现思路

## webpack vs vite

参见 [vite 文档](./vite.md)。
