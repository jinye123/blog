---
title: Vue2 面试题
description: Vue2 核心原理与高频面试题
---

# Vue2 面试题

## MVVM

- **View**：视图层，承载渲染
- **Model**：数据模型
- **ViewModel**：框架提供，完成 View ⇄ Model 双向映射

Vue 是 MVVM 的典型实现：通过响应式系统让 Model 变化驱动 View 更新，通过指令（v-model）让 View 变化驱动 Model 更新。

## 生命周期

| 钩子 | 时机 | 能做什么 |
| --- | --- | --- |
| beforeCreate | 实例初始化完，data/methods 未挂 | 几乎用不到 |
| created | data / methods / computed 可用，DOM 未生成 | 请求数据、订阅事件 |
| beforeMount | render 函数已生成 VNode，未挂到 DOM | 少用 |
| mounted | DOM 挂载完成 | 操作 DOM、初始化第三方库 |
| beforeUpdate | 数据变更，DOM 未更新 | 拿到更新前 DOM 状态 |
| updated | DOM 更新完成 | 操作更新后 DOM（避免在此修改数据） |
| beforeDestroy | 实例销毁前 | 清定时器、解绑事件、取消订阅 |
| destroyed | 实例销毁后 | 几乎用不到 |
| activated | keep-alive 缓存组件激活 | - |
| deactivated | keep-alive 缓存组件失活 | - |
| errorCaptured | 子孙组件抛错 | 错误兜底 |

父子组件加载顺序：

```
父 beforeCreate → 父 created → 父 beforeMount
  → 子 beforeCreate → 子 created → 子 beforeMount → 子 mounted
父 mounted

更新：父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated
销毁：父 beforeDestroy → 子 beforeDestroy → 子 destroyed → 父 destroyed
```

## 响应式原理（核心）

Vue2 用 `Object.defineProperty` 劫持每个属性的 get/set：

```js
function defineReactive(obj, key, val) {
  const dep = new Dep();
  observe(val);                       // 递归劫持
  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) dep.depend();   // 依赖收集
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      observe(newVal);                 // 新值也要劫持
      val = newVal;
      dep.notify();                    // 通知更新
    }
  });
}

class Dep {
  constructor() { this.subs = []; }
  depend() { if (Dep.target) this.subs.push(Dep.target); }
  notify() { this.subs.forEach(w => w.update()); }
}
Dep.target = null;
```

**Vue2 的三个缺陷**（面试高频）：
1. **不能检测数组下标变化**：`arr[0] = x` 不触发更新 → Vue2 用 `arr.splice(0, 1, x)` 或重写 7 个数组方法（push/pop/shift/unshift/splice/sort/reverse）
2. **不能检测新增/删除属性**：`obj.newKey = x` 不触发 → 用 `Vue.set` / `Vue.delete`
3. **递归遍历性能**：初始化时深度递归，大对象有开销

## 依赖收集与派发更新

四个角色：

| 角色 | 职责 |
| --- | --- |
| Observer | 把 data 变响应式（执行 defineReactive） |
| Dep | 一个属性一个 Dep，记录依赖它的 Watcher |
| Watcher | 一个观察对象，渲染 / computed / user-watch 都有 |
| Scheduler | 异步去重队列，下一个 tick 批量执行 Watcher.run |

Watcher 类型：
- **渲染 Watcher**：组件 mount 时创建，触发 render，每组件一个
- **computed Watcher**：lazy 求值，dirty 标记
- **user Watcher**：`vm.$watch` / `watch: {}`

流程：

```
data 变 → setter 触发 dep.notify
       → 通知所有订阅的 watcher.update
       → 进入异步队列 queueWatcher
       → nextTick 后批量执行 watcher.run
       → 渲染 watcher 重新执行 render
       → 生成新 VNode，diff，patch 到真实 DOM
```

## Vue2 模板编译

```
template
  → parse（正则 + AST）
  → optimize（标记静态节点，diff 跳过）
  → generate（生成 render 函数字符串）
  → new Function(...)
```

执行时调用 render → 返回 VNode → patch。

## diff 算法

**核心策略**：同层比较 + 双端比较 + key 复用。

新旧 VNode 都用四指针（旧头/旧尾/新头/新尾）：

```
1. 旧头 = 新头：复用，指针右移
2. 旧尾 = 新尾：复用，指针左移
3. 旧头 = 新尾：旧头节点移到旧尾后面，旧头→右、新尾→左
4. 旧尾 = 新头：旧尾节点移到旧头前面，旧尾→左、新头→右
5. 都不匹配 → 查 key 映射表，找到则复用并移到旧头前，没找到则新建
6. 任一端遍历完：剩余的批量新增 / 删除
```

`key` 的作用：让 Vue 准确判断"这是同一个节点的复用还是新节点"。不写 key 用 index 时，错位插入会引起大量 DOM 改动。

## 虚拟 DOM 的意义

1. **性能折中**：纯模板的精准更新更快，但 Vue 想兼容渲染逻辑（render 函数、JSX），VNode 是中间表示
2. **跨平台**：同一份 VNode 可以渲染到 DOM / weex / 小程序 / canvas

虚拟 DOM 不一定比直接操作 DOM 快，但能"在合理性能下提供更好的开发体验"。

## nextTick 原理

为什么需要：数据变化后异步更新 DOM，多次同步赋值只触发一次渲染。

实现：把回调推进队列 → 微任务调度（降级链）。

```js
const callbacks = [];
let pending = false;

function nextTick(cb) {
  callbacks.push(cb);
  if (!pending) {
    pending = true;
    timer(() => {
      const copy = callbacks.slice(0);
      callbacks.length = 0;
      pending = false;
      copy.forEach(c => c());
    });
  }
}

// 降级链
const timer = typeof Promise !== 'undefined'
  ? cb => Promise.resolve().then(cb)
  : typeof MutationObserver !== 'undefined'
  ? cb => { /* MutationObserver 触发微任务 */ }
  : typeof setImmediate !== 'undefined'
  ? setImmediate
  : setTimeout;
```

注意：Vue 数据更新的 watcher flush 也是用 nextTick，所以 `await nextTick()` 后 DOM 已更新。

## 组件通信

| 关系 | 方式 |
| --- | --- |
| 父 → 子 | props |
| 子 → 父 | $emit |
| 跨级（同父） | event bus（小项目）/ vuex |
| 跨级（祖先 → 后代） | provide / inject |
| 任意 | vuex / pinia |
| 拿组件实例 | ref / $parent / $children |
| 透传 | `$attrs` / `$listeners` |

## v-if vs v-show

- `v-if`：真正销毁/重建 DOM，惰性渲染，切换成本高
- `v-show`：`display: none` 切换，初始化成本相同，切换便宜
- 频繁切换用 v-show，少切换用 v-if

## v-if vs v-for 优先级

- **Vue2**：v-for **优先**于 v-if（v-if 在每次循环里都判断 → 性能差）
- **Vue3**：v-if **优先**于 v-for（语义更合理）

不要在同一元素上同时用，要么外包一层，要么 computed 过滤。

## computed vs watch vs methods

| 维度 | computed | watch | methods |
| --- | --- | --- | --- |
| 缓存 | 有，依赖不变不重算 | 无 | 无（每次重算） |
| 异步 | 不能 | 能 | - |
| 用途 | 依赖派生值 | 副作用响应（请求、保存） | 普通函数 |

```js
watch: {
  query: {
    handler(newV) { this.search(newV); },
    immediate: true,        // 立即执行一次
    deep: true              // 深度监听
  }
}
```

## 自定义指令

```js
Vue.directive('focus', {
  bind(el, binding, vnode) {},
  inserted(el) { el.focus(); },
  update() {},
  componentUpdated() {},
  unbind() {}
});

// 用法
<input v-focus />
```

应用：自动聚焦、防抖、长按、权限、复制。

## 插槽 slot

```html
<!-- 子组件 -->
<div>
  <slot />                                <!-- 默认 -->
  <slot name="header" />                  <!-- 具名 -->
  <slot name="item" :data="row" />         <!-- 作用域 -->
</div>

<!-- 父组件 -->
<Child>
  <template #default>默认内容</template>
  <template #header>头部</template>
  <template #item="{ data }">{{ data.name }}</template>
</Child>
```

作用域插槽用途：子组件控制结构，父组件控制内容（如 Table、List 等容器组件）。

## mixin

```js
const mixin = {
  data() { return { count: 0 }; },
  methods: { inc() { this.count++; } }
};
export default { mixins: [mixin] };
```

问题：
- 命名冲突
- 隐式依赖（看不出方法来自哪个 mixin）
- 多层嵌套难追踪

→ Vue3 用 Composition API 解决。

## keep-alive

```html
<keep-alive :include="['UserList']" :exclude="['Login']" :max="10">
  <component :is="view" />
</keep-alive>
```

特性：
- 内部 LRU 缓存（max 控制）
- 缓存的组件不卸载，触发 activated/deactivated 而不是 mounted/destroyed
- 配合 router 路由缓存

## 异步组件

```js
// 简单
Vue.component('Async', () => import('./Async.vue'));

// 完整配置（loading / error / timeout）
const AsyncComp = () => ({
  component: import('./Async.vue'),
  loading: Loading,
  error: ErrorComp,
  delay: 200,
  timeout: 3000
});
```

## vue-router

模式：
- **hash**：`#/path`，靠 `hashchange` 事件，兼容性好
- **history**：`/path`，靠 `pushState` / `popstate`，需要后端配合（所有路径返回 index.html）

守卫：
- 全局：`beforeEach`、`beforeResolve`、`afterEach`
- 路由独享：`beforeEnter`
- 组件内：`beforeRouteEnter`、`beforeRouteUpdate`、`beforeRouteLeave`

懒加载：`component: () => import('./X.vue')`，配合 webpack magic comment 命名 chunk。

动态路由：`path: '/user/:id'`，通过 `$route.params.id` 拿。

## vuex

四件套：state / getters / mutations / actions / modules。

- mutations：同步修改 state
- actions：异步逻辑，最终 commit mutation
- 严格模式（开发环境）：state 只能通过 mutation 修改

modules：

```js
const moduleA = {
  namespaced: true,
  state: () => ({ x: 0 }),
  mutations: { inc(state) { state.x++; } },
  actions: { incAsync({ commit }) { setTimeout(() => commit('inc')); } }
};
new Vuex.Store({ modules: { a: moduleA } });
// 用：this.$store.commit('a/inc')
```

## Vue2 性能优化

1. 长列表 `Object.freeze` 跳过响应式
2. 异步组件 + 路由懒加载
3. keep-alive 缓存
4. v-show 替代频繁切换
5. computed 缓存替代 methods
6. 函数式组件（无状态）
7. SSR / 预渲染
8. `v-for` 必带 key

## Vue 2 与 Vue 3 差异

1. **响应式**：defineProperty → Proxy
   - 数组下标、新增删除属性都能监听
   - 不再需要递归劫持，按需触发
2. **API 设计**：Options API → Composition API
   - 业务聚合（按功能而非按选项组织）
   - 更好的 TS 支持
   - 更好的 tree-shaking
3. **diff**：双端比较 → 双端 + 最长递增子序列
4. **模板编译优化**：
   - 静态提升（hoistStatic）
   - 动态节点打标（PatchFlag）
   - 事件缓存（cacheHandlers）
5. **v-model**：自定义事件名变化，可绑多个
6. **Fragment / Teleport / Suspense** 新增
7. **生命周期**：beforeDestroy → beforeUnmount，destroyed → unmounted；setup 替代 beforeCreate/created
8. **多根节点**：组件可以有多个根
9. **TS 重写**

## Composition API 优势

1. 解决 mixin 混乱
2. 业务逻辑按功能聚合
3. 更好的 TS 推导
4. 更好的 tree-shaking（API 都是 named export）
5. 更好的复用（自定义 hook / composable）

vs React Hooks：
- Vue 的 setup 只执行一次，依赖通过响应式自动追踪
- React Hooks 每次渲染都重新执行，依赖通过数组手动声明
