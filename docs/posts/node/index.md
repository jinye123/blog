# NODE

## node是什么 可以做什么

nodejs是js的运行时环境，基于v8，在js语言规范的基础上封装了一些服务端的runtime接口，
它让开发人员能够创建服务器 Web 应用、命令行工具和脚本。

- 异步非阻塞io可以做web服务处理高并发
- commonjs模块规范
- 
## nodejs的架构

--------------------------------------------

Native Modules：顶层 暴漏给开发者使用的模块 是js实现 fs、path等

--------------------------------------------

Builtin Modules：中间层 让node可以获取一些更底层的操作

--------------------------------------------

| v8 | libuv | http-parser | openssl | zlib|
libuv：c编写的高性能的异步非阻塞IO库，实现了事件循环机制
http-parser：处理网络报文
openssl：处理加密算法
zlib：处理文件压缩

--------------------------------------------

cup、gpu、os、disk、ram

--------------------------------------------


## node环境和浏览器环境的区别

- 宿主环境不同提供的API不同
  - node：v8 + nodeapi => path、fs...
  - 浏览器：v8 + 浏览器api => dom + bom
- 宿主环境不同事件循环不同
  - 事件循环是由宿主环境提供的
  - 浏览器：微任务、宏任务、layout、requestIdleCallback
- 模块化的规范不同
  - commonjs
  - esm

## node运行机制
1. v8引擎解析js代码
2. libuv将不同的任务分配到不同的线程调用node api的执行，，然后进行总体的调度形成事件循环机制
3. 这个过程会以异步的方式将执行结果返回给V8引擎，再返回给用户。

## node的事件循环

1. 主要代码 
2. process.nextTick=>promise
3. timer
4. process.nextTick=>promise
5. pending callback
6. process.nextTick=>promise
7. idle parser
8. process.nextTick=>promise
9. poll
10. process.nextTick=>promise
11. check
12. process.nextTick=>promise
13. close

- timer：本阶段已经到时间 被执行的回调函数
- pending：执行系统操作回调（如TCP错误）
- idle：系统内部的调用
- poll：轮询检索新的IO事件，执行与IO相关的回调
  - 检测timer有到期的最小时间，轮询结束 重新开始执行timer
  - pending阶段执行剩余的IO回调
- check：执行setImmediate回调
- close：处理关闭事件（如socket.on('close')）


## npm的包的依赖关系

1. dependencies 
   - 项目的直接依赖
   - 项目中打包后实际会运用到的
2. devDependencies
   - 开发依赖 不会被自动下载
   - 打包是否会构建 取决于是否被声明
3. peerDependencies
   - 同版本依赖 / 插件依赖
   - 不希望核心库被重复下载
   - 运行插件的前提核心库必须安装 例如运行element-ui必须安装vue
4. bundleDependencies
   - npm pack 命令会产生压缩包 对应的bundle
5. optionsDependencies 可选依赖

## npm和yarn之间的区别

1. npm的版本lock机制差别很大
   - npm<5.0 根据package-lock文件下载
   - 5.0<npm<5.4 如果package.json有符合跟新版本，忽略package-lock，按照package.json进行安装
   - npm>5.4 如果package.json和package-lock之间兼容，根据lock进行安装，如果不兼容根据package.json进行安装，更新lock文件
2. 依赖策略
   - npm 依赖嵌套结构 v5之后扁平化策略（可能引发依赖版本冲突）
   - yarn 确定性依赖树（精确版本控制）
3. 安装机制
   - npm 串行安装（v5前） / 并行优化（v5+）
   - yarn 并行安装
4. 缓存机制
   - npm 本地缓存
   - yarn 全局缓存 + 本地缓存（更智能复用）

- 为什么Yarn安装更快？
Yarn 的并行下载机制和全局缓存策略减少了网络请求时间，同时确定性的依赖树避免了重复解析"
- pnpm 与这两者的区别？
  "pnpm 采用硬链接+符号链接的存储方式，既保证速度又节省磁盘空间，解决了npm/Yarn的幽灵依赖问题"

##  process是什么

1. process是node应用的程序，可以获取到node应用时的各种环境
2. 主要用在命令行工具、脚手架等开发 

##  如何创建子进程以及crash之后如何重启

1. child_process模块去创建子进程
```js
const child_process = require('child_process')
const master = child_process('path')
master.send('hello')
master.on("message",()=>{})
```
```js
process.on("message",()=>{})
```

使用pm2做进程守护工具，对进程做健康检查，定时重启一个进程，人如果进程退出就去重新启动。

## 对nodejs多进程架构的理解

- 多进程架构又称master-worker架构 主从架构
  - 主进程 工作进程
  - 主进程用来管理子进程 调度任务
  - 子进程一般用来处理业务逻辑
- node通过fork复制出子进程，需要30ms和10mb的内存空间
- 通信上node中有通道的概念，由libuv提供，在应用上使用message和send收发消息

## node中子进程的方式有哪些

1. spawn 最基础的方式 其他都是派生自spawn方法 异步的
2. fork 在源码里加一个rpc通信 默认只能走rpc通信
3. execFile 专门用于执行一个可运行文件
4. exec 能拿到系统环境 将参数格式化 同步的


## 如何使用cluster实现多进程

cluster是node提供的模块，允许在多个子进程中运行不同的node程序


## 如何实现一个require

```js
const {resolve} = require('path')
function myRequire(fileName){
  const file = readFileSync(resolve(__dirname,fileName))
  
  const wraper = `function(require,module,exports){
    ${file}
  }`
  
  const scripts = new Script(wraper,{
    fileName:'index.js'
  })
  
  const module = {
    exports:{}
  }
  
  const fun = scripts.runInThisContext()
  
  fun(myRequire,module,module.exports)
  
  return module.exports
}

```

## readFile和createStream的区别是什么

- readFile是异步的文件读取，读取是一次性的存储在内存中。
- createStream可读流，逐读取文件而不是一次性全放在内存。

createStream使用更少的时间和内存来优化读取文件操作。

通过on data事件来监听数据流 on end事件结束数据流


## 场景的后端框架有哪些

- koa 个轻量级的NodeJS框架，代码非常的简洁，比较容易进行插件的扩展。
- Express:一个轻量级的NodeJS框架，封装了很多相关的中间件
- Eggjs: 阿里出品，是一整套的 node 的解决方案，封装了一些装饰器(reflect-metadata)
- fastify restify :常用来做一些API网关
- Nestjs，基于ts，提供了Graph QL,MO，微服务等多种解决方案，比较适合大型的系统开发

## Node.js 中的中间件是什么？

中间件是Node.js中处理 HTTP 请求的流水线函数，通过 next() 控制权传递，形成请求处理链。
输入=> 中间件... =>输出

想象一个快递分拣中心的流水线：
1. 包裹扫描仪（记录快递信息 → 日志中间件）
2. 安检机（检查违禁品 → 身份验证中间件）
3. 分拣机器人（按地区分类 → 路由中间件）
4. 打包机（封装响应数据 → 响应格式化中间件）

关键规则：
- 顺序敏感：中间件按 app.use() 顺序执行
- 响应终止：若中间件未调用 next() 或发送响应，请求会"卡住"
- 错误冒泡：错误通过 next(err) 跳过后面的中间件，直达错误处理器

中间件三大类型

类型	       |  典型特征 | 示例

----------------------------------

应用级中间件  |	通过 app.use() 全局生效	| 日志、跨域、body-parser

---------------------------------

路由级中间件	绑定到具体路由	权限校验、参数验证

---------------------------------

错误处理中间件	有四个参数 (err, req, res, next)	统一异常处理

---------------------------------

next() 函数具体做了什么？
- next() 将控制权交给下一个中间件，本质上是调用当前中间件队列中的下一个函数

## node中对错误的捕获

1. Child Process，可以通过监听 .on('error', callback) 捕获错误。
2. unhandledRejection和未捕获的异常（uncaughtException）可以通过全局事件监听器捕获。
3. try catch
4. promise catch

## ems和cjs的区别

1. 模块输出类型
   - cjs 值的拷贝
   - esm 值的引用
2. 加载方式
   - 同步加载（运行时 执行到的时候加载相关代码） 
   - 异步加载（编译时静态分析 执行到的时候已经有可用代码） tree shaking
3. 循环引用处理差异
   - CJS 循环引用（存在陷阱）
   - ESM 循环引用（安全处理）

## koa和express的中间件的差异

1. 中间件 API 设计
   - Express 的中间件直接操作 req 和 res 对象，这可能使得中间件之间的状态共享变得复杂
   - Koa 提供了一个统一的上下文对象 ctx，它封装了请求和响应的相关信息，如 ctx.request、ctx.response、ctx.body 等，使得中间件的开发更加简洁和直观。
2. 中间件处理机制
   - Express 的中间件是同步和异步的混合体，Express 的中间件通常通过回调函数 next() 来传递流程控制
   - Koa 基于 Promise 的异步中间件：Koa 的中间件基于 Promise 和 async/await，中间件可以双向处理请求和响应
   - Koa 的中间件遵循洋葱模型，中间件可以双向处理请求和响应，Express是单向流水线。

洋葱模型的三大优势
- 统一错误处理
- 响应后处理能力
- 全链路控制能力

next() 返回的是什么？
- 洋葱模型next() 返回的是Promise对象，因此可以用await等待后续中间件执行完成

为什么Koa能实现洋葱模型而Express不行？
- Koa基于async/await的中间件机制，通过递归调用实现控制权传递；Express使用回调函数链，执行后无法回溯"

## 如何通过集群提高node的性能
node的cluster利用多核处理 允许你创建多个子进程，每个子进程运行在单独的 CPU 核心上，从而充分利用多核 CPU 的优势。

## node的缓冲区

是指的开辟一块流式的内存 知道被消耗完