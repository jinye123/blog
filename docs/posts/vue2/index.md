# vue面试题汇总

## mvvm是什么？

1. view是视图层用来承载数据展示
2. model是数据模型用来组织数据
3. viewModule由前端框架的底层去实现，完成了数据和视图的互相映射和控制。

## 对vue的生命周期的理解

vue中的实例创建=>销毁的过程流水线
1. 创建
2. 初始化
3. 渲染
4. 挂载
5. 更新
6. 卸载

包含：
1. beforeCreate
2. created
3. beforeMount
4. mounted
5. beforeUpdate
6. updated
7. beforeDestroy
8. destroyed
9. activated
10. deactivate
11. errorCaptured

```js
const vue = new Vue() //创建空对象
init(event,lifecycle) //初始化阶段
// 执行init函数注入生命周期以及平台相关的事件处理方法（封装的dom操作函数）
beforeCreate()
reactive(data) //数据响应式
// 往实例对象上挂载数据和方法
created()

if (render){
  render() // 生成虚拟dom以及数据的依赖收据
}
beforeMount()
if (option.el) {
  vue.$mount(option.el); // 挂载到 DOM，将虚拟 DOM 映射到真实 DOM 进行path挂载dom以及映射到Vnode的el上
}
mounted()
// 修改数据
beforeUpdate()
// 数据响应式触发，Vnode重新render进行patch
updated()
// 离开页面失活
beforeDestroy()
// data methods 可用
destroyed()
```

## vue双向数据绑定的实现


1. 数据的响应式初始化 observer
2. 模版编译成的render函数执行触发依赖收集 dep watcher 
3. 改动数据触发更新

实现的类：
1. Observer
2. render
3. Dep
4. watcher
5. update

```js

function defineReactive(obj,key,value){
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) {
        dep.addSub(Dep.target); // 收集依赖
      }
      return value;
    },
    set(newValue) {
      if (value !== newValue) {
        dep.notify(); // 通知所有订阅者更新
      }
    }
  });  
}

class Observer{
  construtoctor(val){
    this.val = val
    this.walk(val)
  }
  
  walk(obj){
    obj.keys().forEach(key=>{
      defineReactive(obj,key,obj[key])
    })
  }
}

function observer(data){
 new Observerr(data) 
}

function compiler(el){
  const childNodes = el.childNodes
  Array.from(childNodes).forEach((node)=>{
    // 1.如果是插值 {{a}} 解析插值文本
    // 2.如果是插值 {{a}} 解析插值文本
    
    if(node.childNodes&&node.childNodes.length){
      compiler(node)
    }
  })
}

class Compiler{
  construtoctor(el,vm){
    this.$el = document.querySelector(el)
    this.$vm = vm
    
    if(this.$el){
      compiler(this.$el)
    }
  }
}

class Vue{
  construtoctor(options){
    this.$options = options
    this.$data = options.data
    
    observer(this.$data) //响应式处理
    
    proxy(this) //代理到实例上
    
    new Compiler(options.el,this)
  }
}
```
## dep和watcher和update和render的关系

- dep（依赖收集器）
   dep 是依赖收集器，每个响应式数据属性都有一个对应的 dep 实例。它的作用是管理所有依赖于该属性的 watcher，并在数据变化时通知这些 watcher。
   依赖收集：当组件渲染时，访问响应式数据会触发 getter，此时当前的 watcher 会被添加到 dep 的订阅者列表中。
   通知更新：当数据变化时，setter 被触发，dep 会调用 notify 方法通知所有订阅者（watcher）进行更新。
```js
class Dep {
  constructor() {
    this.subs = []; // 存储所有依赖该属性的 Watcher
  }

  addSub(watcher) {
    this.subs.push(watcher);
  }

  notify() {
    this.subs.forEach(watcher => watcher.update());
  }
}
```
- watcher（观察者）
   watcher 是观察者，负责订阅数据的变化，并在数据变化时执行更新操作。每个组件实例都有一个渲染 watcher，用于触发组件的重新渲染。
   依赖收集：在组件渲染过程中，watcher 会访问响应式数据，触发 getter，从而将自己添加到 dep 的订阅者列表中。
   更新操作：当 dep 通知 watcher 数据变化时，watcher 会调用 update 方法，触发组件的重新渲染
```js
class Watcher {
  constructor(vm, renderFn) {
    this.vm = vm;
    this.renderFn = renderFn;
    this.get(); // 触发依赖收集
  }

  get() {
    Dep.target = this; // 当前活跃的 Watcher
    this.renderFn(); // 触发 getter 收集依赖
    Dep.target = null;
  }

  update() {
    queueWatcher(this);
  }

  run() {
    this.renderFn(); // 重新渲染组件
  }
}
```
- update（更新操作）
  update 是 watcher 的一个方法，用于响应数据变化并触发视图更新。
  当 dep 调用 notify 方法时，所有订阅的 watcher 的 update 方法会被触发。
  update 方法会重新执行渲染函数，生成新的虚拟 DOM，并通过 patch 方法更新真实 DOM
  Watcher 的 update 方法会将自己加入更新队列（queueWatcher），并在下一个事件循环中执行。
```js
function queueWatcher(watcher) {
  if (!flushing) {
    queue.push(watcher);
  }
  if (!waiting) {
    nextTick(flushSchedulerQueue);
  }
}

function flushSchedulerQueue() {
  queue.forEach((watcher) => watcher.run());
  queue = [];
}
```
- render（渲染函数）
render 是 Vue 的渲染函数，用于生成虚拟 DOM。它会在组件初始化和数据变化时被调用。
初始化渲染：在组件挂载时，render 函数会生成虚拟 DOM，并通过 patch 方法将其渲染到真实 DOM。
更新渲染：当数据变化时，watcher 的 update 方法会重新调用 render 函数，生成新的虚拟 DOM，并通过 patch 方法更新真实 DOM。
```js
function render() {
  // 返回虚拟 DOM
  return h('div', this.message);
}

new Vue({
  data: { message: 'Hello Vue!' },
  render
});
```

## dep和watcher和update和render的对应数据的关系

1. 一个属性对应一个dep
2. 一个组件对应一个渲染watcher

Watcher 主要分为以下几种类型：
1. 渲染 Watcher：用于触发组件的重新渲染。
2. 用户 Watcher：通过 vm.$watch 创建，用于监听特定数据的变化。
3. 计算属性 Watcher：用于实现计算属性，监听依赖变化并重新计算。
4. 指令 Watcher：用于实现指令的更新逻辑，监听指令绑定的表达式变化。
5. 事件 Watcher：用于监听 DOM 事件或自定义事件。


## vue的虚拟dom的意义？

1. 妥协性能
2. 跨平台



## vue中组件的通信方式

1. props 父传子
2. emit 子传父
3. eventbus 事件总线
4. vuex 状态管理
5. provide/inject
6. ref 获取组件实例
7. $children
8. $parent
9. attrs/listener

## Vue 2 的 Diff 算法及其对比过程
Vue 2 的 Diff 算法是虚拟 DOM 更新机制的核心，它用于比较新旧虚拟 DOM 树的差异，并将这些差异高效地应用到真实 DOM 上。Vue 2 的 Diff 算法主要基于 同层级比较 的策略，避免了跨层级的复杂比较，从而在性能和复杂度之间取得了平衡。

- 同层级比较：Vue 2 的 Diff 算法只在当前层级的子节点之间进行比较，而不是深入到子节点的子节点中。这种策略大大减少了比较的复杂度。
- 优化更新：通过 key 属性快速定位节点，减少不必要的 DOM 操作。
- 对比的策略：虚拟 DOM 对比的具体流程
1. 优先比较 tag
   在进行虚拟 DOM 对比时，Vue 2 首先会比较新旧虚拟 DOM 节点的 tag 属性：
   如果 tag 不同，说明新旧节点类型不同，Vue 会直接替换整个节点。
   如果 tag 相同，说明节点类型相同，Vue 会继续进行下一步比较。
2. 比较 key
   在 tag 相同的情况下，Vue 会进一步比较节点的 key 属性：
   如果 key 不同，Vue 会认为这两个节点是不同的虚拟节点，直接替换旧节点。
   如果 key 相同，Vue 会认为这两个节点是同一个虚拟节点，继续进行更详细的比较。
3. 比较节点的其他属性
   对于 tag 和 key 都相同的节点，Vue 会进一步比较节点的其他属性（如 props、data 等）：
   如果属性有变化，Vue 会更新真实 DOM 的对应属性。
   如果属性没有变化，Vue 会跳过该节点，不进行任何操作。
4. 比较子节点
   如果新旧节点都有子节点，Vue 会递归地对子节点进行对比：
   使用双端比较算法（从头尾两端开始比较），减少不必要的比较。
   如果子节点的 tag 和 key 相同，Vue 会递归比较子节点的子节点。
   如果子节点的 tag 或 key 不同，Vue 会根据具体情况创建新节点、移动旧节点或删除旧节点。
   一对多、多对一、多对多的对比情况
   一对多
   当一个旧节点对应多个新节点时（例如，旧节点被拆分为多个新节点），Vue 会根据 key 来确定哪些新节点是新增的，哪些是复用的。
   多对一
   当多个旧节点对应一个新节点时（例如，多个旧节点被合并为一个新节点），Vue 会根据 key 来确定哪些旧节点可以被复用，哪些需要被删除。
   多对多
   当多个旧节点对应多个新节点时，Vue 会通过双端比较算法和 key 来确定哪些节点可以被复用，哪些需要被移动、新增或删除。
   - 设置指针：
     设置两个指针，分别指向新旧子节点的头部和尾部。
   - 四种双端比较策略：
     旧头对新头：如果新旧节点的头部节点相同，复用该节点并继续向右移动。
     旧尾对新尾：如果新旧节点的尾部节点相同，复用该节点并继续向左移动。
     旧头对新尾：如果旧头部节点与新尾部节点相同，将该节点移动到尾部。
     旧尾对新头：如果旧尾部节点与新头部节点相同，将该节点移动到头部。
    
**vue是边对比边更新dom**，在找出虚拟 DOM 的差异后，Vue 会将这些差异应用到真实 DOM 上。这包括创建新节点、更新节点属性、移动或删除节点等操作。


## 关于nextTick的认识？
- Vue 的异步更新机制当数据变化时，Vue 不会立即更新 DOM，而是将需要更新的 Watcher 推入一个队列（queue），并在下一个事件循环的微任务阶段统一执行这些更新。这是为了合并多次数据变动，避免不必要的重复渲染。

流程总结：
数据变更：例如修改 this.data。

触发 Watcher 更新：将需要更新的 Watcher 推入队列。

调度更新：通过 nextTick 将队列中的 Watcher 更新包装为微任务。

执行更新：在微任务阶段执行队列中的 Watcher，更新 DOM。

- nextTick 的实现原理 nextTick 允许你在 DOM 更新完成后执行回调。它的核心逻辑是：

将回调函数推入一个队列（callbacks）。

通过微任务（优先使用 Promise.then，降级到 setImmediate 或 setTimeout）异步执行队列中的回调。

关键点：
DOM 更新和 nextTick 共享同一个微任务队列。

Vue 确保 DOM 更新的微任务先于 nextTick 的回调执行：
1. 触发数据更新内部调用nextTick把watcher放入微任务队列
2. 调用用户到的nextTick把回调函数放入微任务队列
3. 不能调换顺序

## vue的模版编译原理

1. parser 对源代码进行字符串的替换生成ast
2. format 对ast进行转换同时进行打标签标记tag方便diff
3. generate 对ast进行生产render函数的字符串

## 关于keep-alive的理解



## v-if和v-for的优先级

- vue2 v-for>v-if
- vue3 v-for<v-if

## template和jsx的区别

1. 灵活性 jsx 可以实现更为复杂的组件
2. 解耦性 template 在编译阶段做更多的事情


## vue2和vue3的区别

1. 响应式的重构 defineProperty=>proxy
   - 原生监听数组方法
   - 按需进行依赖收集
   - 不需要递归遍历属性
   - 不用遍历每一个属性劫持
2. API设计 函数式编程
   - 实现tree-shaking
   - 第三方集成响应式方便扩展
3. diff算法 
   - vue2 双端比较 首首=>尾尾=>首尾=>尾首
   - vue3 最长递增子序列 首首=>尾尾=>最长子序列=>遍历循环当前节点不在序列里面 需要移动 这样可以确定最少的dom操作
   - 构建新节点的映射关系和老节点对比 多了删除 少了新增 节点出现交叉 执行最长递增子序列
4. 模版编译
   - 静态提升 将静态节点提取为常量，避免重复创建
   - 标记动态 虚拟DOM节点添加标记（如TEXT、CLASS），仅对比动态内容，减少全量Diff计算
   - 事件缓存 在编译过程中，Vue 会将事件处理函数缓存起来，在每次渲染时直接使用缓存的事件处理函数，而不需要重新创建，减少了内存占用和渲染时间
5. v-module的事件监听和传值改变
6. 生命周期 setup()替代beforeCreate和created，成为组合式API入口
7. 通过setup()函数聚合逻辑，支持按功能模块组织代码，提升复用性和可维护性。

Composition API与React Hooks的区别？
- Composition API的setup()仅执行一次，依赖自动追踪；React Hooks每次渲染都执行，需手动管理依赖项（如useMemo）

## composition的好处

1. 解决混入混乱问题
2. 更好的支持ts
3. 更好的tree-shaking
4. 业务功能更加的聚合
5. 更好到的第三方的扩展



