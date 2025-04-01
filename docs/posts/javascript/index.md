# js基础面试题

## 实现unshift

```js
Array.prototype.Myunshift = function (){
  const arr = Array.from(arguments).reverse()
  for (item of arr){
    this.splice(0,0,item)
  }
  return this.length
}
```

## 数组去重

```js
Array.prototype.unique = function (){
  // 1
  return Array.from(new Set(this))
  // 2
  const arr = []
  for (item of this){
    if (!arr.includes(item)){
      arr.push(item)
    }
  }
  return arr
}
```

## 指定范围内随机数

```js
function fn(min,max){
  // (min,max)
  return Math.round(Math.random() * (max - min - 2) + min + 1)
  // [min,max]
  return Math.round(Math.random() * (max - min) + min)
  // (min,max]
  return Math.ceil(Math.random() * (max - min) + min)
  // [min,max)
  return Math.floor(Math.random() * (max - min) + min)
}
```

## 100以内的质数

```js
// (只能被1和自身整除)


```


## 提取url的参数

```js
function quereyParrams(url){
  const params = url.split('?')[1]
  const urlSearchParams= new URLSearchParams(params)
  // const parms = urlSearchParams.values()
  const parms = Object.fromEntries(urlSearchParams.entries())
  return params
}

```

## 数组的随机排序

```js
const arr = [1,2,3,4,5,6,7,8,9]
function rundomIndex(){
  for (let i=0;i<arr.length;i++){
    const index = parseInt(Math.random() * arr.length)
    const curNum = arr[i]
    arr[i] = arr[index]
    arr[index] = curNum
  }
}
```

## 手动实现数组的flat

```js
function flat(arr){
  // 1
  while (arr.some((v)=>Array.isArray(v))){
    arr = [].concat(...arr)
  }
  return arr
  // 2
  return [].concat(...arr.map(item=>Array.isArray(item)?flat(item):''))
}
```

## 两数之和

```js
const nums = [2,7,9,11] 
const target = 9

function fn(){
  for (let i=0;i<nums.length;i++){
    const index = nums.indexOf(target-nums[i])
    
    if(index>=0 && index!==i){
      return [i,index]
    }
  }
}
```

## 在a，b请求之后请求c

```js
const arr = []
function fn(data){
  arr.push(data)
  if(arr.length===2){
    console.log(3)
  }
}

function a(){
  fn(1)
}
function b(){
  fn(2)
}
```


## 微应用怎么实现js和css的隔离

1. css隔离
   - css-module
   - 命名空间
2. js隔离
   - 沙箱 浏览器with window.proxy node vm模块

## cjs和ems的区别

1. cjs是运行时加载 ems是编译时静态
2. cjs的require同步加载 ems的import异步加载
3. cjs是浅拷贝 ems是只读不改变值


## 函数深拷贝

```js
function deepColne(obj){
  if(typeof obj === null || typeof obj !=='object'){
    return obj
  }
  
  if(Array.isArray(obj)){
    return obj.map(item=>deepColne(item))
  }
  
  const clone = {}
  for (key in obj){
    if(obj.hasOwnProperty(key)){
      clone[key] = deepColne(obj[key])
    }
  }
  
  return clone
}
```


## js延迟加载的方式
页面加载完之后再加载js，有助于提高页面的加载速度。
1. defer属性 文档解析完成 同步加载 最后执行 按顺序执行
2. async属性 文档解析未完 异步加载 立即执行 不按照顺序
3. 动态创建script引入js监听dom加载完成
4. js放在body元素的最后去加载

## 异步机制有哪些

1. 回调函数 多层嵌套，回调地狱不利于维护
2. promise 链式调用，予以不明确
3. generator 同步方式调用 书写繁琐
4. async/await generator的语法糖 有自动执行机制 遇到await 等到promise变成resolve

## 如何理解pnpm

pnpm的本质还是一个包管理器

优势：
1. 安装速度 因为已经安装过
2. 磁盘空间利用  引用软连接
3. 嵌套依赖 拍平

## 函数式编程的理解

编程范式：
1. 函数式
2. 命名式
3. 声明式

优点：
- 更好的状态管理 因为没有状态
- 更简单的复用 固定的输入/输出 无副作用对外部的影响
- 更优雅的组合
- 提高维护性

缺点：
- 过度包装 上下文切换的性能问题
- 资源占用 闭包等对垃圾回收增大压力
- 递归陷阱

## js的编译器原理

1. 原始code 
2. lexer 词法分析 进行字符串解析tokens数组
3. parser 语法分析 tokens集合语义遍历生成树形ast
4. analyzed 语义分析 把ast转换为特定语言的 语义ast
5. generator 生产code 把ast转换为可执行的 byte code字节码


## 垃圾回收与内存泄漏

1. 引用计数 内存中所有的对象是否存在引用
   - 有引用 不清除
   - 无引用 清除
   - 缺点 a和b互相引用 但同时又不被使用 无法清除
2. 标记清除 通过GC root 标记空间中的活动对象和非活动对象
   - 如果 GC root可以遍历到 那说明是活动对象
   - 如果 GC root不可以遍历到 说明是非活动对象
   - 在根节点往下一层层便利去索引 window、dom等根节点
   - 同时区别分类到新生代 老生代内存管理
   - 新生代 使用区 空闲区 使用区满的时候 遍历哪些继续使用转到老生代 不使用的清除 同时调换使用区空闲区
   - 开启辅助的线程去处理标记

堆内存：
1. 新生代
   - from-space
   - to-space
   - from和to糊掉位置扫描其中的变量不可使用的就清除掉，如果转移多次的就代表需要转去老生代
2. 老生代
   - 标记清除算法 赠礼内存空间变得连续

## 造成内存泄漏有哪些
- 全局的变量
- 闭包的使用
- 重复绑定监听函数

## valueOf和toString的区别

1. toString把一个引用类型的值转换为字符串的形式表示
2. valueOf把一个引用类型转换为原始类型（基础类型）

引用类型转换为字符串执行顺序：
 - 优先调用toString，返回原始类型转换为字符串
 - 调用valueOf返回原始类型转换为字符串
 - 报错

引用类型转换为数字执行顺序：
- 优先调用toString，返回原始类型转换为字符串
- 调用valueOf返回原始类型转换为字符串
- 报错

## js的防抖
在n秒内重复触发会重新计时，例如输入框

```js
function fn(cb,time){
  let timer = null;
  return function (...args){
     clearTimeout(timer)
     timer = setTimeout(()=>{
       cb.apply(this,args)
     },time)
  }
}
```

## js的节流
在n秒内重复触发会以第一次为主，如拖拽

```js
function fn(cb,time){
  let timer = null;
  return function (...args){
    if(!timer){
       cb.apply(this,args)
       timer = setTimeout(()=>{
          timer = null
       },time)
    }
  }
}
```

## 前端SSR服务的理解
1.采用Node.is部署前端SSR服务。
2.浏览器请求 URL，前端SSR服务接收到请求后，根据不同 url，前端SSR服务向后端服务请求数据。
3.请求完成后，前端SSR服务会组装一个携带了具体数据的HTML，并返回给浏览器。
4.浏览器得到HTML后开始渲染页面，同时浏览器加载并执行is，给页面元素绑定事件，让页面变得可交
当用户与浏览器页面进行交互(如点击分页器下一页)时，浏览器会执行，向后端服务请求数据获取完数据后，再次执行is，动态渲染页面。
若跳转到新的页面，则重复从SSR服务获取HTML的过程。
简单来说:初始化页面使用Node.is的SSR服务，后续交互都是通过执行s来更新页面。。优势:首屏的用户体验良好，友好支持SEO。
劣势:运维麻烦，兼容节点和浏览器两端，代码复杂度增加。