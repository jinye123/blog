# 性能优化

## 如何给spa做seo

1. ssr
2. 静态化
   - 动态页面抓为静态取保持在服务端硬盘中
   - web服务器url重定向内部url
3. nginx针对爬虫处理
   - node server 解析html

## 如何给spa做首屏加载
两大类
- 资源加载
- 页面渲染
文件大小、网络原因、网络缓存、js执行阻塞

1. 减少入口文件体积
    - 代码分割
2. 静态资源缓存
    - storage
    - etag
    - catch-control
    - service-worker
3. 按需加载 tree-shaking
4. 图片资源压缩
5. gzip
6. ssr