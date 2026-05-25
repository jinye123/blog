---
title: ES6+ 特性
description: ES6 至最新 ECMAScript 高频考点
---

# ES6+ 特性

## let / const vs var

| 维度 | var | let | const |
| --- | --- | --- | --- |
| 作用域 | 函数作用域 | 块作用域 | 块作用域 |
| 提升 | 提升声明 + 初始化为 undefined | 提升声明，存在 TDZ | 同 let |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许（引用类型属性可改） |
| 全局 this | 挂 window | 不挂 | 不挂 |

**暂时性死区（TDZ）**：let/const 声明前访问会抛 ReferenceError。

```js
console.log(a);   // ReferenceError: Cannot access 'a' before initialization
let a = 1;
```

## 解构赋值

```js
// 数组
const [a, b, ...rest] = [1, 2, 3, 4];      // a=1, b=2, rest=[3,4]
const [x = 10] = [];                        // x=10 默认值

// 对象
const { name, age: a = 18 } = { name: 'tom' };   // name='tom', a=18

// 嵌套
const { user: { id } } = { user: { id: 1 } };

// 函数参数
function fn({ a, b } = {}) {}
```

## 模板字符串与标签模板

```js
const name = 'tom';
`hello ${name}`;

// 标签模板（实用场景：XSS 过滤、i18n）
function safe(strings, ...values) {
  return strings.reduce((acc, str, i) =>
    acc + str + (values[i] ? escapeHTML(values[i]) : ''), '');
}
safe`<div>${userInput}</div>`;
```

## 箭头函数

特点：
- 没有自己的 `this`、`arguments`、`super`、`new.target`
- 不能 new
- 不能用作 Generator
- 不能改 this（call/bind/apply 失效）

```js
const obj = {
  name: 'obj',
  fn: () => this.name,        // this 是外层（模块/window）
  method() { return this.name; }
};
```

## 扩展运算符 / Rest

```js
// 扩展
const arr1 = [1, 2];
const arr2 = [...arr1, 3];          // [1,2,3]
const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 };     // 浅拷贝

// rest
function fn(...args) {}             // args 是真数组（不像 arguments）
const [first, ...rest] = arr;
```

## Symbol

特性：
- 唯一、不可变
- 不能 new
- 不可被 `for...in / Object.keys` 遍历，可被 `Object.getOwnPropertySymbols` 拿到
- 内置 Symbol：`Symbol.iterator`、`Symbol.asyncIterator`、`Symbol.toPrimitive` 等

应用：
- 私有属性（弱私有）
- 防止属性冲突（库扩展原型）
- 内部协议接入（实现 iterable）

```js
const obj = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next: () => ({ value: i, done: i++ > 3 })
    };
  }
};
for (const v of obj) console.log(v);   // 0 1 2 3
```

## Set / Map

| 维度 | Map | Object |
| --- | --- | --- |
| 键类型 | 任意（含对象、函数） | string / Symbol |
| 键顺序 | 插入顺序 | 整数键升序 + 其他插入序 |
| 大小 | `.size` | `Object.keys(o).length` |
| 性能 | 频繁增删 O(1) 稳定 | 大量属性时退化 |
| 默认键 | 无（无原型污染） | 继承 Object.prototype |
| 迭代 | 原生 `for...of` | 需借助 Object.keys |

| 维度 | WeakMap | Map |
| --- | --- | --- |
| 键 | **必须是对象** | 任意 |
| 引用 | 弱引用（不阻止 GC） | 强引用 |
| 遍历 | 不可遍历 | 可遍历 |
| 用途 | 缓存 / 私有数据 / 解决循环引用 | 通用 KV |

```js
// 用 WeakMap 给对象加私有数据，不阻止 GC
const cache = new WeakMap();
function compute(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = expensive(obj);
  cache.set(obj, result);
  return result;
}
```

## Proxy / Reflect

`Proxy` 是 Vue3 响应式的核心。13 个 trap：

```js
const handler = {
  get(target, key, receiver) { return Reflect.get(target, key, receiver); },
  set(target, key, value, receiver) { return Reflect.set(target, key, value, receiver); },
  has, deleteProperty, ownKeys, getOwnPropertyDescriptor,
  defineProperty, preventExtensions, getPrototypeOf, setPrototypeOf,
  isExtensible, apply, construct
};
const p = new Proxy(target, handler);
```

为什么需要 Reflect？
- `Reflect` 提供和 Proxy 一一对应的方法，让操作"沿着默认行为继续"
- `Reflect.get(target, key, receiver)` 能正确处理继承场景的 this（receiver）
- 返回值统一（成功/失败用 boolean 表达），不抛错

```js
const obj = {
  _name: 'tom',
  get name() { return this._name; }
};
const p = new Proxy(obj, {
  get(t, k, r) { return Reflect.get(t, k, r); }   // 正确传 receiver，getter 中的 this 指向 proxy
});
```

## Iterator / Generator

可迭代协议：实现 `[Symbol.iterator]() { return { next() { return { value, done } } } }`。

Generator：

```js
function* gen() {
  yield 1;
  const x = yield 2;     // 暂停，外部传值进来
  return x;
}

const g = gen();
g.next();     // { value: 1, done: false }
g.next();     // { value: 2, done: false }
g.next(10);   // { value: 10, done: true }
```

应用：
- 异步流程（co、redux-saga）
- 自定义迭代
- 无限序列

## class

```js
class Animal {
  #secret = 42;            // 私有字段（真私有）
  static count = 0;        // 静态字段
  static create() {}       // 静态方法

  constructor(name) {
    this.name = name;
    Animal.count++;
  }

  speak() { console.log(this.name); }
  get description() { return `${this.name}`; }
}

class Dog extends Animal {
  constructor(name) {
    super(name);
  }
  speak() {
    super.speak();
    console.log('woof');
  }
}
```

特性：
- 内部严格模式
- 不可重复声明
- 不能在声明前使用（TDZ）
- 方法不可枚举
- 实例方法定义在 prototype，class 字段定义在实例上

## Promise

参见 [JavaScript 基础](./index.md#promise) 与 [手写题](./code.md#promise-核心)。

## async / await

参见 [JavaScript 基础](./index.md#async-await)。

## 可选链 / 空值合并 / 逻辑赋值

```js
obj?.user?.name             // 任一为 null/undefined 返回 undefined
fn?.()                      // 函数可选调用
arr?.[0]                    // 数组可选索引

a ?? b                      // 仅 null/undefined 时返回 b（区别于 ||）
0 || 'default'              // 'default'
0 ?? 'default'              // 0

// 逻辑赋值
a ||= b                     // a = a || b
a &&= b
a ??= b
```

## Object.fromEntries / Object.entries

```js
Object.entries({ a: 1, b: 2 });       // [['a',1],['b',2]]
Object.fromEntries([['a',1],['b',2]]); // { a:1, b:2 }

// 配合 URLSearchParams
Object.fromEntries(new URLSearchParams('a=1&b=2'));

// 对象 map
function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
}
```

## Array 新方法

```js
arr.includes(x)             // 比 indexOf 更直观，能正确判断 NaN
arr.find(fn)                // 返回第一个匹配项
arr.findIndex(fn)
arr.findLast(fn) / findLastIndex(fn)   // ES2023
arr.flat(depth)
arr.flatMap(fn)
arr.at(-1)                  // 负索引
arr.toSorted() / toReversed() / toSpliced() / with()  // ES2023 非破坏性
arr.group(fn)               // ES2024
```

## 顶层 await（ES2022）

```js
// 仅在 ESM 中可用
const data = await fetch('/api').then(r => r.json());
export default data;
```

## structuredClone（浏览器原生）

```js
const cloned = structuredClone(obj);
// 支持循环引用、Map/Set/Date/RegExp/Blob/File/ImageData
// 不支持函数、DOM、Error
```

## Pipeline / Decorator（提案中）

```js
// Decorator 已 stage 3，TS 5 支持
@logger
class Service {
  @cache
  fetch() {}
}

// Pipeline |> 还在提案
value |> double |> addOne;
```
