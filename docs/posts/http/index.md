# 计算机网络面试题

## 技术蛋老师的计算机网络课程
- https://space.bilibili.com/327247876/lists?sid=60187&spm_id_from=333.788.0.0

## 计算机网络模型的分层

1. 物理层
2. 链路层
3. 网络层
4. 传输层 定义了数据是以什么方式进行传输以及传输到的应用端口，是传输方式和端到端的链接，真正的传输还是需要网线。
5. 会话层
6. 表示层
7. 应用层


## 计算机的三次握手四次挥手

### TCP

三次握手过程：
1. SYN：客户端发送SYN报文（序列号x），进入SYN_SENT状态。
2. SYN-ACK：服务器回复SYN（序列号y）+ ACK（x+1），进入SYN_RCVD状态。
3. ACK：客户端发送ACK（y+1），双方进入ESTABLISHED状态。

为什么三次：
确保双方收发能力正常。两次无法防止已失效的SYN请求突然到达服务器（导致资源浪费）

四次挥手过程：
1. FIN：主动关闭方发送FIN报文，进入FIN_WAIT_1状态。
2. ACK：被动关闭方回复ACK，进入CLOSE_WAIT状态（此时仍可发送数据）。
3. FIN：被动关闭方处理完数据后发送FIN，进入LAST_ACK状态。
4. ACK：主动关闭方回复ACK，进入TIME_WAIT状态（等待2MSL后关闭）。

为什么四次：
TCP是全双工的，需双方独立关闭发送和接收通道,同时确保被动方有消息没有发送！！！。

TCP如何保证可靠传输？
- 确认应答（ACK）：接收方确认收到的数据。
- 超时重传：未收到ACK则重发数据。
- 序列号：按序重组数据，避免乱序。
- 流量控制：滑动窗口机制，防止接收方缓冲区溢出。
- 拥塞控制：慢启动、拥塞避免、快重传、快恢复。

TIME_WAIT状态的作用？为什么等待2MSL？

- 确保最后一个ACK能被对方接收（若丢失，对方会重发FIN）。
- 让旧连接的报文在网络中消失，避免与新连接冲突。

TCP的流量控制与拥塞控制的区别？

- 流量控制：基于接收方能力（通过滑动窗口大小）。
- 拥塞控制：基于网络状况（通过慢启动阈值和拥塞窗口调整）。

### UDP

特点：无连接、不可靠、头部小（8字节）、无流量和拥塞控制。

适用场景：

- 实时应用（视频通话、直播）。
- DNS查询、广播/多播通信。
- 对丢包不敏感但要求低延迟的场景。

UDP如何实现可靠传输？
1. 在应用层添加重传机制、确认应答、序列号等（如QUIC协议）。
2. 例如：KCP（快速可靠UDP协议）、WebRTC部分实现。

TCP与UDP对比
特性	    TCP	                    UDP
连接方式	面向连接（三次握手）	    无连接
可靠性	可靠（确认、重传、有序）	不可靠
传输效率	低（头部20字节，机制复杂）	高（头部8字节，无控制）
流量控制	滑动窗口	                无
拥塞控制	慢启动、拥塞避免等	        无
适用场景	文件传输、HTTP、邮件	    实时音视频、DNS、广播

- tcp会对数据分片字节流，让然后按照索引传输 但是增大开销 


## GET和POST的区别？ 
关于http本身作为浏览器和服务器的传输协议有post和get后来被广泛运用到了ajax接口上面，参数可以放在body或者query都可以但是过度的开放降低了效率所以开发者有规范 post body gey query
因为浏览器关于url的长度做了限制 以及服务端解析协议的内存大小 所以限制url参数的长度大小
对于网络安全而言http就是明文协议 没有安全 只是body对比query来讲相对更安全  

1. 安全性：GET参数暴露在URL中，POST参数在请求体中。
2. 用途性：GET更适合在在获取资源，POST更适合去做数据的提交。
3. 数据长度：GET受URL长度限制（约2KB），POST支持大数据传输。
4. 缓存：GET可被缓存，POST默认不缓存。
5. 书签：get可收藏为书签，post不可以
6. 编码类型：get为application/x-www-form-urlencode post为多种编码类型
7. 历史：get会保留在历史中，post不会保留在历史中
8. 数据类型：get为ascii码，post没有限制

## 常见HTTP状态码
- 200 OK：请求成功。
- 301 Moved Permanently：永久重定向（浏览器缓存新地址）。
- 304 Not Modified：资源未修改（协商缓存生效）。
- 404 Not Found：资源不存在。
- 500 Internal Server Error：服务器内部错误。

## HTTP缓存机制
1. 强缓存：直接使用本地副本，通过Cache-Control（优先级高）和Expires头控制。

2. 协商缓存：询问服务器资源是否更新，通过ETag（哈希值）和Last-Modified（时间戳）验证。

3. 流程：强缓存失效 → 发送请求带If-None-Match/If-Modified-Since → 服务器返回304或200。


## HTTP与HTTPS的区别
1. 加密：HTTP明文传输，HTTPS通过SSL/TLS加密。
2. 端口：HTTP默认80，HTTPS默认443。
3. 证书：HTTPS需CA颁发的数字证书验证身份。
4. 性能：HTTPS握手耗时略高（可通过会话恢复优化）。

## HTTPS加密过程（TLS握手）
1. Client Hello：客户端发送支持的加密算法和随机数。
2. Server Hello：服务器选择算法，返回随机数和证书（含公钥）。
3. 验证证书：客户端验证证书有效性（CA签发、域名匹配、未过期）。
4. 生成密钥：客户端用公钥加密预主密钥发送，双方通过随机数生成会话密钥。
5. 加密通信：后续数据使用对称加密（如AES）传输。

- 非对称加密：握手阶段交换密钥（RSA/ECC），安全但速度慢。
- 对称加密：数据传输阶段使用（AES），高效快速。
- 优势：结合两者安全性（密钥交换）与性能（数据传输）。


## HTTP进阶与优化
1. HTTP/1.1的优化
    - 持久连接：默认保持TCP连接复用（Connection: keep-alive）。
    - 管线化：批量发送请求（但响应必须按顺序，存在队头阻塞）。
2. HTTP/2核心特性
    - 多路复用：一个连接并行处理多个请求，解决队头阻塞。
    - 头部压缩：HPACK算法减少头部大小。
    - 服务器推送：主动推送CSS/JS等资源，减少请求延迟。
3. HTTP/3与QUIC协议
    - 基于UDP：避免TCP队头阻塞，更快连接建立（0-RTT）。
    - 内置加密：默认使用TLS 1.3，提升安全性

## Keep-Alive与WebSocket的长连接有什么区别？
1. Keep-Alive：仍是HTTP协议，每次请求需完整HTTP头部，服务器不能主动推送数据。
2. WebSocket：基于HTTP协议升级的双向通信协议，支持服务器主动推送，连接可长期保持。


## websocket相关

websocket是双全工通信、长连接、通过http101协议升级、初始通信后小帧传输

### WebSocket的握手过程是怎样的？
1. 客户端发起HTTP请求：通过 Upgrade 头声明协议升级
   - Connection: Upgrade
   - Upgrade: websocket
   - Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
2. 服务端响应协议升级：返回 HTTP 101 状态码。
   - HTTP/1.1 101 Switching Protocols
   - Upgrade: websocket
   - Connection: Upgrade
   - Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

### WebSocket如何保持长连接？

- 心跳机制：通过定时发送 Ping/Pong 帧检测连接活性。
- 客户端或服务端发送 Ping 帧，对方需回复 Pong 帧。
- 若未收到响应，可主动关闭连接。

### 如何保证WebSocket通信的安全性？

- 使用wss协议：基于 TLS 加密（类似 HTTPS）。
- 验证Origin头：防止跨站WebSocket劫持（CSWSH）。
- 限制连接频率：防止DDoS攻击。

### 如何处理WebSocket的异常断开？

自动重连：在 onclose 事件中实现指数退避重连。
```js
let reconnectAttempts = 0;
function reconnect() {
  if (reconnectAttempts < 5) {
    setTimeout(() => {
      new WebSocket(url);
      reconnectAttempts++;
    }, 1000 * Math.pow(2, reconnectAttempts));
  }
}
```


## SSE

定义：SSE（Server-Sent Events）是一种基于 HTTP 的单向通信协议，允许服务器主动向客户端推送数据
- 通信方向    单向（仅服务端→客户端）
- 协议       基于 HTTP（长连接）
- 数据格式	文本（text/event-stream）
- 适用场景	实时通知、股票行情、日志推送

### SSE如何建立连接？

客户端：通过 EventSource API 发起请求：
```js
const eventSource = new EventSource('/updates');
eventSource.onmessage = (event) => {
  console.log('收到消息:', event.data);
};
```
服务端：响应需包含以下头部：
```text
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### SSE的数据格式规范是什么？

```text
data: 第一条消息\n\n
id: 123\n
event: status\n
data: {"time": "2023-10-01"}\n\n
```
- data：消息内容（多行合并为单值，换行符保留）。
- id：事件ID（断线重连时通过 Last-Event-ID 头恢复）。
- event：自定义事件类型（默认触发 onmessage，指定类型触发对应事件）。
- retry：重连时间（毫秒）。

### 如何处理SSE的断线重连?

- 客户端自动重连：EventSource 默认在连接断开后尝试重连
- 自定义重试逻辑
```js
let eventSource;
function connect() {
  eventSource = new EventSource('/updates');
  eventSource.onerror = () => {
    eventSource.close();
    setTimeout(connect, 5000); // 5秒后重连
  };
}
connect();
```

### SSE的优缺点是什么？
优点：
1. 简单易用（基于 HTTP，无需额外协议）。
2. 自动重连机制（客户端内置）。
3. 轻量级，适合文本数据推送。

缺点：
1. 单向通信（无法客户端→服务端）。
2. 不支持二进制数据。
3. 浏览器兼容性限制（IE/Edge 旧版本不支持）


## CORS跨域请求的预检机制

1. 简单请求：GET/POST/HEAD，直接发送请求；
2. 复杂请求（如PUT/DELETE）：先发送OPTIONS预检请求，检查服务器支持的请求方法和头信息


## 资源预加载与懒加载
1. 预加载：<link rel="preload">提前加载关键资源；
2. 懒加载：延迟加载非视口内的图片或组件