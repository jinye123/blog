---
title: JavaScript 异步编程指南
description: 深入理解 JavaScript 异步编程范式
date: 2024-01-21
tags: ['javascript', 'async']
---

# JavaScript 异步编程指南 <Badge type="info" text="基础" />

::: tip 温馨提示
本文将帮助你理解 JavaScript 中的异步编程概念
:::

## Promise 基础 :rocket:

Promise 是处理异步操作的现代方式：

::: details 基础示例
```js
function fetchData() {
  return new Promise((resolve, reject) => {
    // 异步操作的代码
  });
}