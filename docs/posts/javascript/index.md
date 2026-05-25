---
title: JavaScript 基础
description: JS 高频面试题与深度解读
---

# JavaScript 基础

## 数据类型

8 种：`undefined / null / boolean / number / string / symbol / bigint` + `object`。

判断方式：

```js
typeof undefined  // 'undefined'
typeof null       // 'object'  ← 历史 bug
typeof []         // 'object'
typeof (()=>{})   // 'function'
[] instanceof Array  // true
Object.prototype.toString.call(null)  // '[object Null]'
```

`Object.prototype.toString.call(x)` 是最准确的类型判断，因为内部 `[[Class]]` 属性不会被改写。

## == 与 === 区别

`===` 类型不同直接 false；`==` 触发类型转换。

七条规则（简化版）：

1. 类型相同 → 走 `===`
2. `null == undefined` → true（其它对比都是 false）
3. 数字与字符串 → 字符串转数字
4. boolean → 转数字（true=1, false=0）
5. 对象与基本类型 → 对象先 `ToPrimitive`（先 valueOf，失败再 toString）

经典面试题：

```js
[] == ![]     // true
// 步骤：![] = false → [] == false → [] == 0 → '' == 0 → 0 == 0
[] == 0       // true（[] → '' → 0）
null == 0     // false（null 只与 undefined 相等）
NaN == NaN    // false（NaN 不等于任何东西）
```

## valueOf 与 toString

引用类型转**字符串**时：先 `toString`，失败再 `valueOf`。
引用类型转**数字**时：先 `valueOf`，失败再 `toString`。

```js
const obj = {
  valueOf() { return 1; },
  toString() { return 'hello'; }
};
String(obj)   // 'hello'  字符串场景
Number(obj)   // 1        数字场景
obj + ''      // '1'      + 是数学优先，先 valueOf
obj + 'x'     // '1x'
`${obj}`      // 'hello'  模板字符串走 toString
```

## 类型转换

```js
// 转字符串
String(123)       // '123'
String(null)      // 'null'
String([1,2])     // '1,2'

// 转数字
Number('')        // 0
Number(' 123 ')   // 123
Number('123abc')  // NaN
Number(null)      // 0
Number(undefined) // NaN
Number(true)      // 1
Number([])        // 0
Number([1])       // 1
Number([1,2])     // NaN
Number({})        // NaN

// 转布尔
Boolean(0)         // false
Boolean('')        // false
Boolean(null)      // false
Boolean(undefined) // false
Boolean(NaN)       // false
// 其它都是 true，包括 '0'、[]、{} 都是 true
```

## 闭包

定义：函数 + 其能访问的词法环境的引用。当内部函数被外部引用时，外部函数的作用域不会被销毁。

经典面试题：循环 + setTimeout

```js
// 打印 3 个 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

// 修复 1：let（块作用域，每次循环新建 i）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

// 修复 2：IIFE 创建闭包
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 0);
  })(i);
}
```

应用场景：
- 模块封装（私有变量）
- 防抖节流（保留 timer）
- currying / 偏函数
- React 函数组件中的 useState

副作用：
- 内存泄漏（被引用的作用域无法回收）
- 滥用可读性差

## 原型与原型链

```
function Foo() {}
const f = new Foo();

f.__proto__ === Foo.prototype                    // true
Foo.prototype.__proto__ === Object.prototype     // true
Object.prototype.__proto__ === null              // true
Foo.__proto__ === Function.prototype             // true（函数也是对象）
Function.prototype.__proto__ === Object.prototype // true
```

查找规则：访问属性时沿 `__proto__` 链向上找，找不到返回 `undefined`。

继承方式（演进史）：
1. 原型链继承：共享引用类型属性
2. 借用构造函数：解决共享，但无法继承原型方法
3. 组合继承：调用两次父构造
4. **寄生组合继承**（最优）：

```js
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}

function Parent(name) { this.name = name; }
Parent.prototype.say = function() { console.log(this.name); };

function Child(name, age) {
  Parent.call(this, name);   // 借用构造
  this.age = age;
}
inherit(Child, Parent);
```

ES6 `class extends` 等价于寄生组合继承。

## this 指向

5 种绑定（优先级从高到低）：

1. **`new` 绑定**：`new Foo()` → this 指向新对象
2. **显式绑定**：`fn.call(obj)` / `fn.apply(obj)` / `fn.bind(obj)`
3. **隐式绑定**：`obj.fn()` → this 指向 obj
4. **默认绑定**：独立调用 → 严格模式 undefined，非严格 window
5. **箭头函数**：没有自己的 this，捕获定义时所在作用域的 this

```js
const obj = {
  name: 'obj',
  foo() { return this.name; },
  bar: () => this.name,    // 箭头：this 是外层（模块/window）
};
obj.foo();              // 'obj'
const f = obj.foo;
f();                    // undefined（严格模式）

// 面试题：bind 多次以第一次为准
function fn() { return this.x; }
const b1 = fn.bind({ x: 1 });
const b2 = b1.bind({ x: 2 });
b2();                   // 1
```

## new 的本质

```js
function myNew(Constructor, ...args) {
  // 1. 创建空对象，原型指向构造函数 prototype
  const obj = Object.create(Constructor.prototype);
  // 2. 执行构造函数，this 绑定到新对象
  const result = Constructor.apply(obj, args);
  // 3. 如果构造函数显式返回对象，则用之；否则用新对象
  return (result !== null && typeof result === 'object') ? result : obj;
}
```

追问：箭头函数为什么不能 new？
- 箭头函数没有 `[[Construct]]` 内部方法
- 没有自己的 this、prototype
- 调用 new 抛 TypeError

## 事件循环

浏览器：

```
主线程 → 同步代码
     → 微任务队列（Promise.then / MutationObserver / queueMicrotask）
     → 宏任务（setTimeout / setInterval / setImmediate(node) / I/O / UI render / postMessage）

每跑完一个宏任务，清空所有微任务。然后浏览器决定是否重新渲染。
```

经典输出题：

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  return Promise.resolve();
}).then(() => console.log('4'));
console.log('5');

// 输出：1 5 3 4 2
```

`async/await` 转 Promise：

```js
async function a() {
  console.log('A1');
  await b();
  console.log('A2');     // 等价于 b().then(() => console.log('A2'))
}
async function b() {
  console.log('B1');
}
a();
console.log('main');
// A1 B1 main A2
```

Node 与浏览器差异：
- Node 11 之前：每个阶段执行完才清微任务；之后每个宏任务后清
- Node 有独立阶段（timers / pending / idle / poll / check / close），setImmediate vs setTimeout 顺序在 I/O 回调里可预测

## Promise

状态：`pending / fulfilled / rejected`，**状态不可逆**。

| API | 行为 |
| --- | --- |
| `Promise.all` | 全部成功才成功，任一失败即失败 |
| `Promise.race` | 第一个 settle 的胜出（不论成功失败） |
| `Promise.any` | 任一成功即成功，全部失败才失败（AggregateError） |
| `Promise.allSettled` | 等全部 settle，返回结果数组（不会 reject） |

链式返回值规则：
- `then` 回调返回普通值 → 下个 then 接收
- 返回 Promise → 下个 then 等其 settle
- 抛错 → 下个 catch 捕获
- 没传 onRejected → 错误向下传播

## async/await

本质：Generator + 自动执行器（co 库的思路）。

```js
// async/await
async function load() {
  const a = await fetchA();
  const b = await fetchB(a);
  return b;
}

// 等价（简化）
function load() {
  return fetchA().then(a => fetchB(a));
}
```

错误处理：

```js
try {
  const data = await fetch();
} catch (err) {
  // 等价于 .catch
}
```

并行优化：

```js
// 错：串行 6s
const a = await taskA();  // 3s
const b = await taskB();  // 3s

// 对：并行 3s
const [a, b] = await Promise.all([taskA(), taskB()]);
```

## 模块化（CJS vs ESM）

| 维度 | CommonJS | ESM |
| --- | --- | --- |
| 语法 | `require` / `module.exports` | `import` / `export` |
| 加载 | 运行时 | 编译时（静态分析） |
| 输出 | 值的**拷贝** | 值的**引用**（live binding） |
| 循环引用 | 拿到的是模块当前已执行部分 | 通过引用，更新可被感知 |
| 同步异步 | 同步 | 异步（顶层 await） |
| tree-shaking | 不支持 | 支持（静态分析） |
| this | module.exports | undefined |
| Node 支持 | 默认 | `.mjs` 或 `"type":"module"` |

CJS 拷贝示例：

```js
// a.js
let count = 1;
setTimeout(() => count++, 100);
module.exports = { count };

// b.js
const { count } = require('./a');
setTimeout(() => console.log(count), 200);  // 1（拷贝快照）
```

ESM 引用示例：

```js
// a.js
export let count = 1;
setTimeout(() => count++, 100);

// b.js
import { count } from './a.js';
setTimeout(() => console.log(count), 200);  // 2
```

## 垃圾回收

V8 分代回收：

**新生代（Scavenge）**
- 内存小（几 MB），分 from / to 两块
- 存活对象从 from 复制到 to，交换角色
- 多次存活 → 晋升到老生代

**老生代（Mark-Sweep + Mark-Compact）**
- Mark-Sweep：标记可达对象，清除其他
- Mark-Compact：标记 + 整理，消除内存碎片
- 增量标记 + 并发标记，减少卡顿

GC Root：window / 调用栈 / 闭包引用等。

常见内存泄漏：
1. 意外的全局变量（`x = 1` 没 var/let）
2. 未清除的定时器与回调
3. 闭包持有大对象
4. 已脱离 DOM 的引用（detached DOM）
5. EventListener 没移除
6. `console.log` 持有引用（生产环境删掉）

## 防抖与节流

**防抖**：在 n 秒内重复触发会**重新计时**，最后一次触发后 n 秒才执行。
**节流**：在 n 秒内只执行一次。

```js
// 防抖
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流
function throttle(fn, delay) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// 节流 - 定时器版（首次立即 + 末次保证）
function throttle(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
```

应用：
- 防抖：搜索框输入、resize、表单校验
- 节流：滚动、拖拽、鼠标移动

## 异步演进

```js
// 1. 回调（回调地狱）
loadA(a => loadB(a, b => loadC(b, c => done(c))));

// 2. Promise（链式）
loadA().then(loadB).then(loadC).then(done);

// 3. Generator（手动迭代）
function* gen() {
  const a = yield loadA();
  const b = yield loadB(a);
  return b;
}

// 4. async/await（同步写法）
async function flow() {
  const a = await loadA();
  const b = await loadB(a);
  return b;
}
```

## 深拷贝

```js
function deepClone(value, weakMap = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (weakMap.has(value)) return weakMap.get(value);       // 循环引用

  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value);
  if (value instanceof Map) {
    const m = new Map();
    weakMap.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, weakMap), deepClone(v, weakMap)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set();
    weakMap.set(value, s);
    value.forEach(v => s.add(deepClone(v, weakMap)));
    return s;
  }

  const clone = Array.isArray(value) ? [] : {};
  weakMap.set(value, clone);
  Reflect.ownKeys(value).forEach(key => {
    clone[key] = deepClone(value[key], weakMap);
  });
  return clone;
}
```

现代浏览器原生：`structuredClone(value)`，支持循环引用、Map/Set/Date 等，但不能拷贝函数和 DOM。

## SSR / CSR / SSG / ISR

| 模式 | 渲染时机 | 优点 | 缺点 |
| --- | --- | --- | --- |
| CSR | 客户端 | 交互快、服务器压力小 | 首屏慢、SEO 差 |
| SSR | 服务器每次请求 | 首屏快、SEO 好 | 服务器压力、TTFB 高 |
| SSG | 构建时 | 极快、CDN 部署 | 数据变了要重新构建 |
| ISR | 构建 + 按需重生 | 兼具 SSG 速度和动态 | 复杂度上升 |

SSR 流程：

```
浏览器请求 → Node 服务执行组件 → 拼接 HTML → 返回浏览器
浏览器解析 HTML（已有内容）→ 下载 JS → hydration（事件绑定）→ 后续走 CSR
```

挑战：
- 两端环境差异（window 不存在）
- hydration 错配（注意 SSR 与 CSR 产物一致）
- 数据预取（getServerSideProps / asyncData）
- 流式渲染（Streaming SSR）

## 微前端的 CSS / JS 隔离

CSS：
- CSS Modules / scoped
- 命名空间前缀
- Shadow DOM（wujie、micro-app）

JS：
- 快照沙箱（保存恢复 window，单实例）
- Proxy 沙箱（每个子应用一个 proxy window，多实例）
- iframe 沙箱（最彻底）
- Node 端用 `vm` 模块

## valueOf / toString 总结题

```js
const obj = {
  i: 1,
  valueOf() { return this.i++; }
};
obj == 1 && obj == 2 && obj == 3   // true！
```

实现思路：`==` 触发 ToPrimitive，每次调用 valueOf 返回不同值。

## pnpm 为什么快

1. **硬链接 + 软链接结构**：所有包存全局 store，项目里只是硬链接，省磁盘
2. **严格依赖**：解决幽灵依赖（npm 扁平化的副作用）
3. **并行下载**
4. **依赖图缓存**

## 函数式编程

特征：
- 一等公民（函数当参数和返回值）
- 纯函数（无副作用、相同输入相同输出）
- 不可变数据
- 高阶函数（map/filter/reduce/compose）
- 柯里化、偏函数

收益：
- 易测试（无副作用）
- 易组合（compose / pipe）
- 易并发（无共享状态）

代价：
- 性能（不可变数据要新建）
- 学习成本（curry / monad）

## JS 编译流程

```
源码 → 词法分析（lexer）→ token 流
     → 语法分析（parser）→ AST
     → 解释执行 / 字节码生成（Ignition）
     → JIT 优化（TurboFan）→ 机器码
```

V8 关键点：
- Ignition 解释器：直接执行字节码
- TurboFan 优化编译器：热点代码转机器码
- 隐藏类（Hidden Class）：对象属性形状缓存
- 内联缓存（IC）：加速属性访问
