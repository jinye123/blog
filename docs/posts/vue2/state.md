---
title: Vue 状态管理指南
description: 深入理解 Vue 的状态管理方案
date: 2024-01-20
tags: ['vue', 'state-management']
head:
  - - meta
    - name: keywords
      content: vue,pinia,composition api
---

# Vue 状态管理指南 <Badge type="tip" text="v3" />

::: tip 学习提示
本文基于 Vue 3 和 Composition API
:::

## Composition API 状态管理 :rocket:

在 Vue 3 中，我们有多种状态管理方案：

- [x] ref/reactive
- [x] provide/inject
- [x] Pinia
- [ ] Vuex (不推荐)

### 基础示例

::: details 点击查看完整代码

```js{4,7-9}
export default {
  data () {
    return {
      msg: 'Highlighted!' // 这行会高亮
    }
  },
  methods: {
    // 这些行会高亮
    hello () {
      console.log('world')
    }
  }
}