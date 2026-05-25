---
title: JavaScript 手写题
description: 高频手写题集合，含考点解读
---

# JavaScript 手写题

> 面试高频，每个题都附"考点"提示。

## new

**考点**：原型链、apply 改 this、构造函数返回值规则

```js
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return (result !== null && typeof result === 'object') ? result : obj;
}
```

追问：
- 箭头函数能不能 new？不能，没有 `[[Construct]]`
- 构造函数显式返回对象会覆盖默认对象，返回原始值则忽略

## call

**考点**：this 显式绑定、利用对象方法调用本质

```js
Function.prototype.myCall = function (context, ...args) {
  context = context ?? globalThis;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};
```

注意：用 `Symbol()` 而不是 `new Symbol()`（Symbol 不能 new）。

## apply

```js
Function.prototype.myApply = function (context, args = []) {
  context = context ?? globalThis;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};
```

## bind

**考点**：闭包保存上下文、配合 new 时 this 失效

```js
Function.prototype.myBind = function (context, ...args1) {
  const self = this;
  function bound(...args2) {
    // new 调用时 this 指向新对象，忽略 context
    if (this instanceof bound) {
      return self.apply(this, [...args1, ...args2]);
    }
    return self.apply(context, [...args1, ...args2]);
  }
  bound.prototype = Object.create(self.prototype);
  return bound;
};
```

## Promise（核心）

**考点**：状态机、链式、错误冒泡、微任务调度

```js
class MyPromise {
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  constructor(executor) {
    this.state = MyPromise.PENDING;
    this.value = undefined;
    this.onFulfilledCbs = [];
    this.onRejectedCbs = [];

    const resolve = (value) => {
      if (this.state !== MyPromise.PENDING) return;
      this.state = MyPromise.FULFILLED;
      this.value = value;
      this.onFulfilledCbs.forEach(cb => cb());
    };

    const reject = (reason) => {
      if (this.state !== MyPromise.PENDING) return;
      this.state = MyPromise.REJECTED;
      this.value = reason;
      this.onRejectedCbs.forEach(cb => cb());
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err; };

    return new MyPromise((resolve, reject) => {
      const handle = (cb) => {
        queueMicrotask(() => {
          try {
            const x = cb(this.value);
            x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
          } catch (err) {
            reject(err);
          }
        });
      };

      if (this.state === MyPromise.FULFILLED) handle(onFulfilled);
      else if (this.state === MyPromise.REJECTED) handle(onRejected);
      else {
        this.onFulfilledCbs.push(() => handle(onFulfilled));
        this.onRejectedCbs.push(() => handle(onRejected));
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(cb) {
    return this.then(
      v => MyPromise.resolve(cb()).then(() => v),
      r => MyPromise.resolve(cb()).then(() => { throw r; })
    );
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(r => r(value));
  }

  static reject(reason) {
    return new MyPromise((_, r) => r(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(v => {
          results[i] = v;
          if (++count === promises.length) resolve(results);
        }, reject);
      });
      if (promises.length === 0) resolve([]);
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(p => MyPromise.resolve(p).then(resolve, reject));
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve) => {
      const results = [];
      let count = 0;
      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(
          v => results[i] = { status: 'fulfilled', value: v },
          r => results[i] = { status: 'rejected', reason: r }
        ).finally(() => {
          if (++count === promises.length) resolve(results);
        });
      });
      if (promises.length === 0) resolve([]);
    });
  }

  static any(promises) {
    return new MyPromise((resolve, reject) => {
      const errors = [];
      let count = 0;
      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(resolve, e => {
          errors[i] = e;
          if (++count === promises.length) reject(new AggregateError(errors));
        });
      });
    });
  }
}
```

## 防抖 / 节流（完整版）

```js
// 防抖：leading 控制首次立即执行，trailing 控制末次执行
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timer = null;
  let called = false;
  return function (...args) {
    if (leading && !called) {
      fn.apply(this, args);
      called = true;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (trailing && (!leading || called)) fn.apply(this, args);
      called = false;
    }, delay);
  };
}

// 节流：时间戳版（首次立即触发）
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
```

## 深拷贝

```js
function deepClone(value, weakMap = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (weakMap.has(value)) return weakMap.get(value);

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

  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  weakMap.set(value, clone);
  Reflect.ownKeys(value).forEach(key => {
    clone[key] = deepClone(value[key], weakMap);
  });
  return clone;
}
```

## flat

```js
Array.prototype.myFlat = function (depth = 1) {
  const result = [];
  for (const item of this) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...item.myFlat(depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
};

// Infinity 完全展平
[1, [2, [3, [4]]]].myFlat(Infinity);  // [1,2,3,4]
```

## unshift

```js
Array.prototype.myUnshift = function (...args) {
  for (let i = this.length - 1; i >= 0; i--) {
    this[i + args.length] = this[i];
  }
  for (let i = 0; i < args.length; i++) {
    this[i] = args[i];
  }
  this.length = this.length + args.length;
  return this.length;
};
```

## reduce

```js
Array.prototype.myReduce = function (callback, initialValue) {
  if (this.length === 0 && initialValue === undefined) {
    throw new TypeError('Reduce of empty array with no initial value');
  }
  let acc = initialValue !== undefined ? initialValue : this[0];
  let start = initialValue !== undefined ? 0 : 1;
  for (let i = start; i < this.length; i++) {
    if (i in this) {
      acc = callback(acc, this[i], i, this);
    }
  }
  return acc;
};
```

## 数组去重

```js
// 1. Set（最简洁）
const unique = arr => [...new Set(arr)];

// 2. filter + indexOf
arr.filter((v, i) => arr.indexOf(v) === i);

// 3. Map 保留对象引用
function uniqueBy(arr, key) {
  const map = new Map();
  return arr.filter(item => {
    const k = item[key];
    return map.has(k) ? false : (map.set(k, true), true);
  });
}
```

## 函数柯里化

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...args2) {
      return curried.apply(this, [...args, ...args2]);
    };
  };
}

const add = (a, b, c) => a + b + c;
const c = curry(add);
c(1)(2)(3);   // 6
c(1, 2)(3);   // 6
c(1)(2, 3);   // 6
```

## compose / pipe

**考点**：redux 中间件、函数式编程

```js
// 从右到左
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

// 从左到右
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const add1 = x => x + 1;
const mul2 = x => x * 2;
compose(add1, mul2)(3);  // 3*2+1 = 7
pipe(add1, mul2)(3);     // (3+1)*2 = 8
```

## LRU 缓存

**考点**：哈希 + 双向链表，Map 利用插入顺序简化实现

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const v = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, v);    // 移到最新
    return v;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value);  // 删最老
    }
  }
}
```

## EventEmitter（发布订阅）

```js
class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  on(event, fn) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(fn);
    return this;
  }
  once(event, fn) {
    const wrap = (...args) => {
      fn(...args);
      this.off(event, wrap);
    };
    this.on(event, wrap);
    return this;
  }
  emit(event, ...args) {
    (this.events.get(event) || []).forEach(fn => fn(...args));
    return this;
  }
  off(event, fn) {
    const list = this.events.get(event);
    if (!list) return this;
    this.events.set(event, list.filter(f => f !== fn));
    return this;
  }
}
```

## 并发控制

**场景**：100 个请求，最多并发 3 个

```js
function asyncPool(limit, tasks) {
  return new Promise((resolve) => {
    const results = [];
    let index = 0;
    let done = 0;

    async function run() {
      if (index >= tasks.length) return;
      const cur = index++;
      try {
        results[cur] = await tasks[cur]();
      } catch (err) {
        results[cur] = err;
      }
      if (++done === tasks.length) resolve(results);
      else run();
    }

    for (let i = 0; i < Math.min(limit, tasks.length); i++) run();
  });
}

// 用法
const tasks = urls.map(url => () => fetch(url));
asyncPool(3, tasks).then(console.log);
```

## 千分位分隔

```js
// 正则
function format(num) {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
format(1234567.89);  // '1,234,567.89'

// Intl
new Intl.NumberFormat('en-US').format(1234567.89);
```

## 两数之和（哈希优化）

```js
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}
```

## 数组随机排序（Fisher-Yates 洗牌）

```js
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

注意：`arr.sort(() => Math.random() - 0.5)` 是错的，不是均匀分布。

## 指定范围随机数

```js
// [min, max] 整数
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// [min, max) 浮点
const randFloat = (min, max) => Math.random() * (max - min) + min;
```

## URL 参数解析

```js
function parseQuery(url) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  return Object.fromEntries(params.entries());
}
```

## 100 以内质数（埃氏筛）

```js
function primes(n) {
  const sieve = new Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= n; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= n; j += i) sieve[j] = false;
    }
  }
  return sieve.map((v, i) => v ? i : null).filter(Boolean);
}
primes(100);
```

## 大数相加

```js
function bigAdd(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0;
  let result = '';
  while (i >= 0 || j >= 0 || carry) {
    const sum = (+a[i] || 0) + (+b[j] || 0) + carry;
    result = (sum % 10) + result;
    carry = Math.floor(sum / 10);
    i--; j--;
  }
  return result;
}
bigAdd('9007199254740992', '9007199254740993');
```

## A、B 请求都完成后请求 C

```js
// Promise.all
Promise.all([requestA(), requestB()]).then(([a, b]) => requestC(a, b));

// async/await
const [a, b] = await Promise.all([requestA(), requestB()]);
const c = await requestC(a, b);
```
