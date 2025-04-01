# js的场景面试题

## js实现大文件上传

1. 创建分片 可以依据大小或者分数
   - 文件的分片file或者blob，只保存文件的基本信息name、size、type、位置信息等，并不保存文件的真实数据，所以文件分片速度很快。
   - 读取文件真实数据需要使用fileReader去读取
2. 创建哈希 根据文件内容创建哈希 来让服务端确定上传的主体
   - 使用web-work去计算，因为是大量的异步调用计算
   - 组织上传数据的名字、hash、index等基础数据，方便用来后期的数据组装和确定文件索引
   - 计算hash的时候使用增量计算，使用分片的结果一次计算一部分累加所有的
3. 服务器需要提供上传接口、查询接口、完成接口等三个接口
   - 上传接口为了提供文件的上传
   - 查询接口为了实现秒传断点续传等，当上传中间失败再次上传可以获取到上传过哪些文件实现秒传以及剩余文件的断点续传
   - 完成接口为了实现当客户端上传之后，服务端进行数据拼接组装，同时可以返回哪些数据需要重新上传


## 页面截图

前端实现主要围绕canvas
1. canvas
2. 无头浏览器
3. html2canvas

## pc和mobil的重定向

1. 使用user.agent确定哪个端
2. 进行302重定向
3. 采用媒体查询进行响应式布局

## 前端实现进度条

1. axios 使用onUploadProgress函数获取进度
2. 遍历html上面的link的url和script的src标签添加loaded事件头痛及总数类似promise.all

## 在js中怎么去捕获错误

1. try...catch 基础错误捕获方式
   - 用途：捕获同步代码块中的错误。
   - 局限：无法捕获异步错误（如 setTimeout、Promise）。
2. window.onerror
   - 用途：捕获全局未处理的同步错误和异步错误。
   - 局限：无法捕获资源加载错误（如图片、脚本加载失败）
3. window.addEventListener('error')
   - 用途：更强大的全局错误监听，可捕获资源加载错误。
   - 注意：需设置 capture 为 true 来捕获资源错误。
4. unhandledrejection
   - 捕获未处理的 Promise 拒绝（reject）。
5. 最佳实践
   - 分层处理：优先在局部使用 try...catch，再用全局监听兜底。
   - 错误上报：在全局错误监听中上报错误到服务器（如 Sentry、Bugsnag）。
   - 资源错误监控：通过 PerformanceObserver 监控资源加载性能。

## 前端实现水印

1. 使用canvas去画图
2. 使用point-event设置事件穿透
3. 使用mutationObserve监听dom变化防止篡改


## js的大数运算


## 设计一个全站请求耗时监控

就是前端性能监控工具


## webWork和serviceWork的区别

1. webWork和serviceWork的生命周期不一样
   - serviceWork是注册之后一直运行在浏览器后台
   - webWork是跟随当前页面的生命周期
2. serviceWork可以拦截请求实现一些资源的缓存 区别于etag和catch-control
3. webWork主要用于一些cpu密集型的运算 可以形成多个线程
4. serviceWork可以用来开发浏览器插件 在后台监听任务
5. 都是可以和主进程进行交互事件监听 postMessage、port等 都是通通过浏览器自带的api 引用一个js文件后开启 self变量代指当前线程

