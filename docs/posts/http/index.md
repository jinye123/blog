---
title: 计算机网络
description: TCP / HTTP / HTTPS / WebSocket / SSE 高频考点
---

# 计算机网络

## OSI 七层模型 vs TCP/IP 四层

| OSI | TCP/IP | 例子 |
| --- | --- | --- |
| 应用层 | 应用层 | HTTP / DNS / FTP / SSH |
| 表示层 | - | - |
| 会话层 | - | - |
| 传输层 | 传输层 | TCP / UDP |
| 网络层 | 网络层 | IP / ICMP |
| 数据链路层 | 网络接口层 | 以太网 / WiFi |
| 物理层 | - | 网线 / 光纤 |

## TCP 三次握手

```
客户端                      服务器
  | --- SYN(seq=x) --->     |   SYN_SENT
  |                          |
  | <-- SYN+ACK(seq=y,ack=x+1) -- |  SYN_RCVD
  |                          |
  | --- ACK(ack=y+1) -->     |  ESTABLISHED
```

**为什么三次**：
- 一次不够：服务器不知道客户端能收
- 两次不够：服务器不能确认客户端能收（"已失效的旧 SYN 突然到达"会导致服务器单方面建连接，资源浪费）
- 三次刚好：双方都确认对方的收发能力

## TCP 四次挥手

```
主动方                       被动方
  | --- FIN --->              |   FIN_WAIT_1
  | <-- ACK ---              |   CLOSE_WAIT（仍可发数据）
  | <-- FIN ---              |   LAST_ACK
  | --- ACK --->              |   TIME_WAIT（等 2MSL）
                                CLOSED
```

**为什么四次**：
- TCP 是全双工，关闭分两个方向
- 被动方收到 FIN 只能马上 ACK，但还有数据要发；发完才发 FIN

**TIME_WAIT 为什么等 2MSL**：
- 确保最后 ACK 能被对方收到（丢失对方会重发 FIN）
- 让旧报文消失，避免与新连接冲突

## TCP 可靠性

| 机制 | 作用 |
| --- | --- |
| 序号 / 确认号 | 顺序、丢失检测 |
| 超时重传 | 没 ACK 就重发 |
| 滑动窗口 | 流量控制（接收方能力） |
| 拥塞控制 | 网络能力（慢启动 / 拥塞避免 / 快重传 / 快恢复） |
| 校验和 | 数据完整性 |

流量 vs 拥塞：
- **流量控制**：基于接收方缓冲区（窗口大小）
- **拥塞控制**：基于网络状况（拥塞窗口 cwnd）

## UDP

特点：无连接、不可靠、头部 8 字节、无流控拥塞。

适用：
- 实时音视频
- DNS
- 广播 / 多播
- 游戏

可靠 UDP：QUIC（HTTP/3 底层）、KCP、WebRTC。

## GET vs POST

| 维度 | GET | POST |
| --- | --- | --- |
| 语义 | 获取 | 提交 |
| 参数 | URL（可见） | body |
| 长度 | URL 限制（约 2KB） | 无规范限制（看服务器） |
| 缓存 | 可缓存 | 默认不缓存 |
| 书签 | 可 | 不可 |
| 历史 | 保留 | 不保留 |
| 编码 | URL 编码 | 多种（form / json / multipart） |
| 安全 | 暴露 URL，参数在日志中 | body 相对安全（仍需 HTTPS） |
| 幂等 | 是 | 否 |
| 是否能发 body | 协议允许，但语义不推荐 | 是 |

注意：所谓"安全"指 HTTP 语义层，HTTPS 下 body 与 URL 都加密。GET 真正的"不安全"是 URL 容易被日志、Referer 泄露。

## 常见状态码

| 码 | 含义 |
| --- | --- |
| 200 | OK |
| 201 | Created（POST 新建成功） |
| 204 | No Content |
| 206 | Partial Content（断点续传） |
| 301 | 永久重定向 |
| 302 | 临时重定向（语义不清晰，多用 307/308） |
| 304 | Not Modified（协商缓存命中） |
| 400 | Bad Request |
| 401 | Unauthorized（未登录） |
| 403 | Forbidden（已登录但无权限） |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 408 | Request Timeout |
| 413 | Payload Too Large |
| 429 | Too Many Requests（限流） |
| 500 | Internal Server Error |
| 502 | Bad Gateway（网关错误） |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

## HTTP 缓存（必考）

```
请求 → 强缓存？
        ↓ 命中
       200 from cache (memory/disk)
        ↓ 未命中
       带 If-None-Match / If-Modified-Since 请求
        ↓
       服务器对比
        ↓ 资源未变
       304 Not Modified
        ↓ 资源变了
       200 + 新内容
```

### 强缓存

- `Cache-Control: max-age=31536000`（最高优先级）
- `Cache-Control: no-cache`：跳过强缓存，走协商
- `Cache-Control: no-store`：不缓存
- `Cache-Control: public / private`
- `Cache-Control: immutable`：永不变（带 hash 的静态资源）
- `Expires`（HTTP/1.0 老字段）

### 协商缓存

- `ETag` ↔ `If-None-Match`：内容哈希（精确）
- `Last-Modified` ↔ `If-Modified-Since`：时间（秒精度，弱）

实战策略：

| 资源 | 策略 |
| --- | --- |
| HTML | `Cache-Control: no-cache`（必须走协商，否则更新拿不到） |
| 带 hash 的 JS/CSS | `Cache-Control: max-age=31536000, immutable` |
| 图片 | 较长 max-age |

## HTTP/1.1 优化

- **Keep-Alive**：默认开启，TCP 复用
- **管线化**：批量发请求（但响应必须按序，存在队头阻塞，实际很少启用）

## HTTP/2

| 特性 | 含义 |
| --- | --- |
| 多路复用 | 一个 TCP 连接上并发多个请求，解决队头阻塞 |
| 二进制分帧 | 用二进制帧替代文本，性能更好 |
| 头部压缩 HPACK | 重复 header 字典压缩 |
| 流优先级 | 客户端可指定优先级 |
| 服务器推送 | Push 静态资源（已废弃，浏览器普遍不支持） |

注意：HTTP/2 队头阻塞仍存在于 TCP 层（一个包丢了整个连接卡住），HTTP/3 解决。

## HTTP/3 + QUIC

- 基于 **UDP**，避免 TCP 队头阻塞
- 握手与 TLS 1.3 合并，**0-RTT** 重连
- 内置加密
- 连接迁移（手机切 WiFi 不断）

## HTTPS

### HTTPS = HTTP + TLS

- 端口 443
- 数据加密（防窃听）
- 完整性校验（防篡改）
- 身份认证（防中间人）

### TLS 握手（RSA 算法，简化）

```
1. Client Hello：客户端支持的算法、随机数 R1
2. Server Hello：选定算法、随机数 R2、证书（含公钥）
3. 客户端验证证书（CA / 域名 / 有效期 / 撤销列表）
4. 客户端生成 pre-master，用公钥加密发给服务器
5. 双方用 R1 + R2 + pre-master 算出会话密钥（对称密钥）
6. 后续用对称加密通信（AES）
```

### ECDHE（现代主流）

RSA 的问题：私钥泄露后历史流量也能解密（无前向保密）。

ECDHE 用临时密钥协商，每次会话密钥不一样，私钥泄露也无法解密历史流量。

### 非对称 vs 对称

| 类型 | 速度 | 用途 |
| --- | --- | --- |
| 非对称（RSA / ECC） | 慢 | 握手阶段交换密钥、签名 |
| 对称（AES / ChaCha20） | 快 | 数据传输 |

HTTPS 的智慧：用非对称解决密钥分发，用对称完成大量数据加密。

## HSTS

服务端响应 `Strict-Transport-Security: max-age=31536000; includeSubDomains`，告诉浏览器后续必须走 HTTPS（防降级攻击）。

## WebSocket

### 特点
- 全双工
- 长连接
- HTTP 101 协议升级
- 文本 + 二进制
- 较小开销（帧头 2-14 字节）

### 握手

```
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: <base64>
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: <key 处理后的值>
```

### 保活

```js
let pingTimer;
function startPing(ws) {
  pingTimer = setInterval(() => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }));
  }, 30000);
}
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'pong') resetIdleTimer();
};
```

### 重连（指数退避）

```js
let attempts = 0;
function connect() {
  const ws = new WebSocket(url);
  ws.onopen = () => { attempts = 0; };
  ws.onclose = () => {
    if (attempts < 5) {
      setTimeout(connect, 1000 * 2 ** attempts);
      attempts++;
    }
  };
  return ws;
}
```

### 安全

- 用 `wss://`（TLS 加密）
- 校验 `Origin` 头防 CSWSH
- 限制连接频率、消息频率
- 鉴权（建连前 token 校验）

## SSE（Server-Sent Events）

单向（服务端 → 客户端）的 HTTP 长连接。

```js
const es = new EventSource('/updates');
es.onmessage = (e) => console.log(e.data);
es.addEventListener('status', (e) => console.log('status', e.data));
```

服务端响应：

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: hello
id: 1

event: status
data: {"online": true}
id: 2
retry: 5000
```

### vs WebSocket

| 维度 | SSE | WebSocket |
| --- | --- | --- |
| 方向 | 单向 | 双向 |
| 协议 | HTTP | 升级协议 |
| 二进制 | 不支持 | 支持 |
| 自动重连 | 内置 | 自己实现 |
| 兼容 | IE 不支持 | 现代浏览器 |
| 适用 | LLM 流式输出、通知、行情 | 聊天、协作 |

## CORS 预检

参见 [浏览器原理 - 跨域](../browser/index.md#cors-最常用)。

## 其他常考

### DNS 解析

```
浏览器 DNS 缓存
  → 系统缓存（hosts）
  → 路由器缓存
  → 运营商 DNS
  → 根域名 → 顶级域 → 权威 DNS
```

`dns-prefetch` 提前解析。

### CDN 工作原理

1. 用户请求资源域名
2. 智能 DNS 返回最近的边缘节点 IP
3. 边缘节点：命中缓存直接返回；未命中回源
4. 源站返回 + CDN 缓存

### 长轮询 / 短轮询 / WebSocket / SSE 对比

| 方案 | 实时性 | 服务器开销 | 实现 |
| --- | --- | --- | --- |
| 短轮询 | 差 | 高（频繁请求） | setInterval + fetch |
| 长轮询 | 中 | 中（连接保持） | 服务端挂起 + 超时再发 |
| SSE | 好 | 低 | EventSource |
| WebSocket | 极好 | 低 | new WebSocket |

LLM 应用：基本都走 SSE 流式输出。

## 安全综合

| 威胁 | 防御 |
| --- | --- |
| 窃听 | HTTPS |
| 中间人 | HTTPS + HSTS + 证书校验 |
| 重放 | 时间戳 + nonce + 签名 |
| CSRF | SameSite cookie + token + Referer/Origin |
| XSS | 输出转义 + CSP + HttpOnly |
| 点击劫持 | `X-Frame-Options` / CSP frame-ancestors |
| 暴力破解 | 限流 + 验证码 + 锁定 |
