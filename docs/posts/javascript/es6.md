# es6

## object和map的区别
1. 键的类型 

   Object： 键必须是字符串或符号（Symbol），其他类型的键会被自动转换为字符串。
   例如，null 和 undefined 作为键时，会被转换为字符串 "null" 和 "undefined"。
   
   Map： 键可以是任何数据类型，包括对象、函数、数组、null 和 undefined。
   不会自动将键转换为字符串，保留了键的原始类型。
2. 键值对的顺序
   
   Object：
   键值对的存储顺序不保证（尽管现代浏览器通常会按照插入顺序处理字符串键，但这是非标准行为）。
   如果键是数字，会按照数字大小排序。
   
   Map：
   按照插入顺序存储键值对，迭代时会按照插入顺序返回键值对。
3. 性能
   Object：
   查找、插入和删除操作的时间复杂度通常是 O(1)，但在某些情况下（如大量属性或继承链较长时）可能会退化到 O(n)。
   Map：
   查找、插入和删除操作的时间复杂度始终是 O(1)，性能更稳定。
4. 大小获取
   Object：
   没有直接的方法获取键值对的数量，需要通过 Object.keys(obj).length 或 Object.values(obj).length 来计算。
   Map：
   提供了 map.size 属性，可以直接获取键值对的数量。
   
5. 迭代
   Object：
   使用 for...in 或 Object.keys()、Object.values()、Object.entries() 进行迭代。
   for...in 会遍历对象的所有可枚举属性，包括继承的属性。
   Map：
   提供了多种迭代方法，如 for...of、map.keys()、map.values()、map.entries()。
   迭代时不会包含继承的属性。

## WeakMap 和 Map 的区别

1. 键的类型
   - WeakMap键 必须 是对象
   - Map键可以是 任意类型
2. 垃圾回收
   - WeakMap对键是 弱引用
   - Map对键是 强引用
3. 可枚举性
   - WeakMap设计目的就是不可枚举的私有存储
   - Map可通过 keys()/values()/entries() 遍历

## Reflect的作用是什么
Reflect主要作用调用对象内部的基本方法
- [get]
- [set]

## 手写flat

```js
Array.prototype.myFlat = function (depth) { 
   const arr = []
   
   for (let item of this){
     if(Array.isArray(item) && (depth>0||depth===Infinity)){
       const currentDepath = depth === Infinity? Infinity : depth-1
        const flattened = item.myFlat(currentDepath)
        arrr.push(...flattened)
     }else {
       arr.push(item)
     }
   }
   
   
   return arr
}
```
## promise的状态

1. pending
2. reject
3. fulfilled

状态是不可逆的。

## 手写promise

``` js
class SimplePromise {
  constructor(executor) {
    this.state = "pending"; // Promise状态：pending、fulfilled、rejected
    this.value = undefined; // Promise的值
    this.handlers = []; // 存储then或catch的回调函数

    // 执行器函数
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error); // 如果执行器抛出异常，Promise变为rejected状态
    }
  }

  // 内部方法：Promise变为fulfilled状态
  _resolve(value) {
    if (this.state === "pending") {
      this.state = "fulfilled";
      this.value = value;
      this._flushHandlers(); // 执行所有等待的回调函数
    }
  }

  // 内部方法：Promise变为rejected状态
  _reject(reason) {
    if (this.state === "pending") {
      this.state = "rejected";
      this.value = reason;
      this._flushHandlers(); // 执行所有等待的回调函数
    }
  }

  // 内部方法：执行所有等待的回调函数
  _flushHandlers() {
    this.handlers.forEach((handler) => {
      if (this.state === "fulfilled" && handler.onFulfilled) {
        handler.onFulfilled(this.value);
      } else if (this.state === "rejected" && handler.onRejected) {
        handler.onRejected(this.value);
      }
    });
    this.handlers = []; // 清空等待队列
  }

  // then方法：注册成功和失败的回调函数
  then(onFulfilled, onRejected) {
    return new SimplePromise((resolve, reject) => {
      // 将回调函数添加到等待队列
      this.handlers.push({
        onFulfilled: (value) => {
          try {
            if (typeof onFulfilled === "function") {
              const result = onFulfilled(value);
              resolve(result); // 处理返回值
            } else {
              resolve(value); // 如果未提供回调函数，直接传递值
            }
          } catch (error) {
            reject(error); // 捕获回调函数中的异常
          }
        },
        onRejected: (reason) => {
          try {
            if (typeof onRejected === "function") {
              const result = onRejected(reason);
              resolve(result); // 处理返回值
            } else {
              reject(reason); // 如果未提供回调函数，直接传递错误
            }
          } catch (error) {
            reject(error); // 捕获回调函数中的异常
          }
        }
      });

      // 如果Promise已经完成，立即执行回调函数
      if (this.state !== "pending") {
        this._flushHandlers();
      }
    });
  }

  // catch方法：注册失败的回调函数
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  
  // 静态方法 Promise.all
  static all(promises) {
    return new SimplePromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError("Promise.all expects an array"));
      }

      const results = [];
      let remaining = promises.length;

      if (remaining === 0) {
        return resolve(results); // 如果数组为空，直接返回空数组
      }

      promises.forEach((promise, index) => {
        SimplePromise.resolve(promise)
          .then((value) => {
            results[index] = value; // 保留顺序
            remaining--;
            if (remaining === 0) {
              resolve(results); // 所有Promise都完成
            }
          })
          .catch((reason) => {
            reject(reason); // 任何一个Promise失败，直接返回失败原因
          });
      });
    });
  }

  // 静态方法 Promise.resolve
  static resolve(value) {
    if (value instanceof SimplePromise) {
      return value;
    }
    return new SimplePromise((resolve) => resolve(value));
  }
}

// 测试代码
const promise = new SimplePromise((resolve, reject) => {
  setTimeout(() => resolve("Success!"), 1000);
});

promise
  .then((result) => {
    console.log(result); // 输出：Success!
    return "Next Value";
  })
  .then((result) => {
    console.log(result); // 输出：Next Value
  })
  .catch((error) => {
    console.error(error);
  });
```

## set去重

```js
arr = [...new Set(arr)]
```

## reduce的实现
```js
if (!Array.prototype.myReduce) {
    Array.prototype.myReduce = function (callback, initialValue) {
        // 确定累积器的初始值
        let accumulator = initialValue !== undefined ? initialValue : this[0];
        // 确定开始遍历的索引
        let startIndex = initialValue !== undefined ? 0 : 1;
        // 遍历数组并累积结果
        for (let i = startIndex; i < length; i++) {
            accumulator = callback(accumulator, this[i], i, this);
        }
        return accumulator;
    };
}

// 测试代码
const numbers = [1, 2, 3, 4];
const sum = numbers.myReduce((accumulator, currentValue) => accumulator + currentValue, 0);
console.log(sum); // 输出：10
```
