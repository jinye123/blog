# 工程化 

## 什么是工程化 做过哪些工程化相关的东西？
概念：自动化、脚本化的方法，结合一些工具的能力解决一些纯人工处理的低消的、重复的问题。

1. webpack插件
2. 各种loader
3. babel插件

## AST是什么？

抽象语法树，是一个描述语言内容的树形语法结构
- 是前端基建和工程化的基石


## babel是什么
babel是一个工具链，用来处理源码的转译工作 babelRc babel.config
1. 代码的转译
   - es6=>es5
   - ts=>js
2. 代码的转换
   - jsx=>function
   - uni-app=>小程序

## babel的工作原理

1. parser 语法分析 词法分析 转为 ast
   - parser
2. transform 遍历ast 对节点进行转换
   - travers 遍历
   - types 增删改查
3. generator 改造后的代码生成 目标代码 
   - generator

## 模块化
1. 避免全局的变量污染，命名冲突。
2. 解决依赖顺序问题
3. 私有化变量

## node使用ems

1. 文件后缀名mjs
2. type：module
3. 新版本node支持

## 什么是monorepo？

- mono-repo 多个独立工程在一个仓库下面
- multi-repo 多个独立工程在多个仓库下面

优缺点
1. 更好的代码复用逻辑 易于抽象一些公用的组件
2. 不利于独立性，公共部分的复杂度很高
3. 整体构建协作少
4. 公共模块安全性比较差

## monorepo的构建方式有哪些？

1. lerna 更擅长版本的管理能力 没有库与库之间的链接需要自己link
2. npm、yarn、pnpm 没有严格的包管理 自动做软连接
   - pnpm init
   - pnpm-workSpace package 包的查找路径
   - pnpm i module --filter app

## react和vue的差别

- react
  1. 运行时框架 jsx => creatElement 其他的逻辑都是基于js运行到哪里 做对应处理的
  2. 灵活性强一点 生成列表 map filter 执行函数
  3. 重新执行render 根节点对比 因为灵活性没法优化
- vue
  1. 编译时框架 .vue => h 里面的逻辑以及被编译为固定的运行代码
  2. 灵活性弱一点 生成列表 v-for
  3. 发布订阅执行 更精准的对比 在模版编译阶段做了优化 因为固定的模版语法

## 如何选型 
1. 技术壁垒 一个能 一个不能
2. 技术储备 团队的技术成员
3. 和其他应用的联动 版本功能对齐和集成


## tree-shaking的原理

1. webpack对代码分析的时候会标记所有的import和export
2. webpack同时也会对没有导入的模块进行清除标记 同时会递归清除确保不存在

tree-shacking是在代码的编译阶段执行的
- import只能在最顶层
- import模块名只能是字符串常量
- import的绑定是不可变的
ems具备静态分析的能力，而cjs是执行后确定依赖关系，所以只能在ems去实现tee-shaking


## 提高webpack的打包速度

1. 利用缓存的能力避免重复构建 dllplugin
2. 使用多线程去处理减少构建时间 thread-loader 


## 减少打包体积

1. tree-shaking
2. 代码分割
3. 代码压缩和uglify
4. 静态资源压缩
5. 常见三方包cdn的方式
6. babel polyfill的build：inuse 保证浏览器的最小代码量加载 首屏优化

## pnpm为什么比npm快一点

1. 并行下载的能力 减少下载安装时间
2. 依赖管理的方式
3. 文件存储空间 对包的软连接 

## 软连接和硬链接的区别

- 硬链接 js的引用对象 的垃圾回收的引用计数
  - 不会生成新的文件节点
  - 指向源文件的一个链接
  - 全部删除才删除源文件
- 软连接 vue的代理proxy
  - 生成新的文件节点
  - 文件内容指向源文件
  - 删除源文件 软连接不会删除 只不过打不开

## pnpm的原理

1. 解析项目依赖，执行安装全局没有安装过的依赖，使用内容寻址文件系统（hash）作为名字管理依赖，避免重复安装
2. 项目所需的依赖在.pnpm下硬链接到全局的仓库依赖，节省磁盘空间，全局共享依赖。
3. 项目赖树的包，软连接到.pnpm中，解决友邻依赖问题
4. 生成lock文件，保持依赖一致性解决冲突和兼容问题