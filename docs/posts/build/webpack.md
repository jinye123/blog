# webpack

- https://www.bilibili.com/video/BV1cJ2mYbEb6?spm_id_from=333.788.player.switch&vd_source=d635d36f144e3f0b48df5e26c794d3eb&p=22

## 说出一些默认的配置

```js
module.export={
  entry:path.resolve(__dirname,'src/index.js'),
  output:{
    path:path.resolve(__dirname,'/dist'),
    fileName:'index[hashchunk:8].js',
    publickPath:'./'
  },
  resolve:{
    extensions:['.js','.jsx']
  },
  module:{
    rules:[
      {
        test:/\.(js|jsx)$/,
        use:{
          loader:'babel-loader',
          option:{
            persets:['@babel/preset-env']
          }
        }
      },
        
    ]
  },
  plugins:[
      new HtmlWebpackPlugin({
        template:'public/index.html'
      })
  ]
}
```

## loader和plugin的区别

1. loader 让webpack认识除js以外的文件，解析依赖关系，在固定的阶段生效（打包之前）
2. plugin 让webpack有更好的输出资源的能力，在打包的各个生命周期阶段都生效。

## 有哪些指纹占位符

1. ext 后缀名
2. name 文件名
3. path 文件相对路径
4. folder 文件所在目录
5. hash 整体提项目的hash 每次构建
6. chunkHash 当前chunk的hash 打的包
7. contentHash 文件内容的hash 静态资源的hash 图片等


## webpack的构建流程

1. 读取配置 文件进行merge 初始化各种参数
2. 开始编译 初始化compiler对象 注册插件 执行run方法
3. 构建依赖树 在entry文件开始递归遍历构建依赖树 
4. 模块构建 通过配置的 loader 加载和转换模块内容
5. 代码生成 根据模块依赖图生成最终的代码
6. 资源管理 处理如图片、字体等资源文件输出到指定目录
7. 代码输出 将生成的代码输出到指定目录 生成哈希值，用于缓存控制
8. 服务器启动（开发模式）

```js
const { Compiler } = require('webpack');

class CustomPlugin {
  apply(compiler) {
    // 编译开始
    compiler.hooks.compile.tap('CustomPlugin', (params) => {
      console.log('编译开始');
    });

    // 模块构建完成
    compiler.hooks.seal.tap('CustomPlugin', (compilation) => {
      console.log('模块构建完成');
    });

    // 代码生成完成
    compiler.hooks.emit.tap('CustomPlugin', (compilation) => {
      console.log('代码生成完成');
    });

    // 构建完成
    compiler.hooks.done.tap('CustomPlugin', (stats) => {
      console.log('构建完成');
    });
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  plugins: [new CustomPlugin()],
};
```

## bundle，chunk，module的理解

1. module 文件
2. chunk 构建依赖树流程的产物 依赖文件的聚合
3. bundle 项目构建的输出产物 打包后的输出一个包 
   bundleLess 不打包成一个包 而是多个包 方柏霓tree-shaking

## 提高webpack的打包速度 

- 多进程打包
- dllPlugin 第三方库预先打包 减少构建时间
- 使用缓存 catch-loader 一些中间件加速后续的构建
- tree-shaking
- 移除不必要的配置 不要让工具反复查找 

## 如何减少webpack的体积 性能优化

1. 代码分割  首屏加载快
2. tree-shaking 减少体积
3. 代码压缩 减少体积
4. 代码混淆 减少体积
5. 开启gzip 快速交互
6. 图片压缩  减少体积
7. cdn加速  减少包体积
8. 预加载技术
9. 懒加载技术
10. 按需引入 不同的浏览器兼容引入 减少包的体积


## 写一个loader

```js
// 同步
module.exports=function styleLoader(resours,map){
  let style = `const style = document.createElement('style')
  style.innerHTML = ${JSON.stringify(resours)}
  document.head.appendChild(style)`
  
  return style
}
// 异步
module.exports = function lessLoader(resours,map){
  const callback = this.async()
  less.render(resours,{sourceMap:{}},function (err,res){
    const {css,map} = res
    callback(null,css,map)
  })
}
```

## 写一个plugin

```js
class ZipPlugin{
  constructor(options){
    this.options = opttions
  }
  
  apply(complier){
    
    complier.hooks.compile.tap('console',function (){
      console.log('开始编译')
    })
    
    compiler.hooks.seal.tap('console',function (compilation){
      console.log('模块构建完成')
    })
    
    compiler.hooks.emit.tap('console',function (compilation){
      console.log('代码生成完成')
    })
     
     complier.hooks.done.tap('console',function (stats){
       console.log('构建统计信息',stats.toJSON())
     })
  }
}
```


## webpack5和4的区别

1. tree-shaking更快了
2. 模块联邦 
3. 持久化缓存
4. 引入静态资源模块 不在需要引入 file-loader 


