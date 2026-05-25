---
title: Vue3 面试题
description: Vue3 响应式、Composition API、新特性深度解读
---

# Vue3 面试题

## 响应式原理（Proxy）

Vue3 用 `Proxy` 代替 `defineProperty`，解决了 Vue2 三大缺陷。

```js
const reactiveMap = new WeakMap();
const targetMap = new WeakMap();        // target → Map<key, Set<effect>>
let activeEffect = null;

function reactive(target) {
  if (reactiveMap.has(target)) return reactiveMap.get(target);

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      track(target, key);
      const res = Reflect.get(target, key, receiver);
      // 懒响应式：访问到时才转
      return (res && typeof res === 'object') ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (!Object.is(oldValue, value)) {
        trigger(target, key);
      }
      return result;
    },
    deleteProperty(target, key) {
      const had = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (had && result) trigger(target, key);
      return result;
    }
  });

  reactiveMap.set(target, proxy);
  return proxy;
}

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) dep.forEach(effect => effect());
}

function effect(fn) {
  const wrapper = () => {
    activeEffect = wrapper;
    fn();
    activeEffect = null;
  };
  wrapper();
}
```

## 为什么需要 Reflect

`Reflect.get(target, key, receiver)` 能把 `this` 正确指向 proxy，让继承场景的 getter 也能被收集依赖。

```js
const parent = { name: 'p', get full() { return this.name; } };
const child = Object.create(parent);
child.name = 'c';
const proxy = reactive(child);
proxy.full;   // 用 Reflect.get(..., receiver=proxy)，getter 中 this 是 proxy → 触发 track
```

## ref vs reactive

| 维度 | ref | reactive |
| --- | --- | --- |
| 适用 | 基本类型 / 对象都行 | 仅对象 |
| 访问 | `.value`（template 自动解包） | 直接 `.x` |
| 实现 | RefImpl 类 + getter/setter（基本类型）/ 内部走 reactive（对象） | Proxy |
| 解构 | 解构会失去响应式（需 `toRefs`） | 同 |

```js
const count = ref(0);
count.value++;

const user = reactive({ name: 'tom' });
user.name = 'jerry';

// toRefs：把 reactive 拆成多个 ref，保持响应式
const { name } = toRefs(user);
```

衍生：
- `shallowRef` / `shallowReactive`：只浅层响应
- `readonly` / `shallowReadonly`：只读
- `toRef(obj, 'key')`：单属性转 ref
- `markRaw(obj)`：永久脱离响应式（大对象、第三方实例）
- `triggerRef(ref)`：手动触发

## computed vs watch vs watchEffect

```js
// computed：缓存的派生值
const double = computed(() => count.value * 2);

// watch：明确监听某些源 + 拿到新旧值
watch(count, (newV, oldV) => {});
watch([a, b], ([na, nb], [oa, ob]) => {});
watch(() => obj.deep.x, (v) => {}, { deep: true, immediate: true, flush: 'post' });

// watchEffect：自动追踪依赖，立即执行一次
watchEffect(() => {
  console.log(count.value, user.name);   // 用到哪些就追踪哪些
});
```

`flush` 选项：
- `pre`（默认）：组件更新前
- `post`：组件更新后（能拿到更新后的 DOM）
- `sync`：同步（不推荐）

## setup vs `<script setup>`

```vue
<!-- setup -->
<script>
export default {
  setup(props, { emit, attrs, slots, expose }) {
    const count = ref(0);
    return { count };
  }
};
</script>

<!-- script setup（推荐）-->
<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{ id: number }>();
const emit = defineEmits<{ (e: 'change', v: string): void }>();
defineExpose({ doSomething });
const count = ref(0);
</script>
```

`<script setup>` 是**编译时宏**：
- `defineProps` / `defineEmits` / `defineExpose` / `defineOptions` 都是宏，编译后消失
- 顶层声明自动暴露给模板
- 性能更好（编译时优化）

## 生命周期对比

| Vue2 | Vue3 Composition |
| --- | --- |
| beforeCreate | （setup 本身） |
| created | （setup 本身） |
| beforeMount | onBeforeMount |
| mounted | onMounted |
| beforeUpdate | onBeforeUpdate |
| updated | onUpdated |
| beforeDestroy | onBeforeUnmount |
| destroyed | onUnmounted |
| activated | onActivated |
| deactivated | onDeactivated |
| errorCaptured | onErrorCaptured |
| - | onRenderTracked / onRenderTriggered（调试） |

## diff 算法（最长递增子序列）

Vue3 在处理"中间乱序"时用 LIS 算法找出最少需要移动的节点。

```
旧：a b c d e f g
新：a b f c d e g

1. 首尾比对：a a 复用，g g 复用 → 范围缩小到 [b c d e f] 与 [b f c d e]
2. 建立新→旧的索引：{b:1, f:5, c:2, d:3, e:4}
3. 求 LIS：[1,2,3,4]（即 b c d e 保持相对顺序）
4. 只移动 f 到 b 后面，其它不动
```

收益：相比 Vue2 双端比较，DOM 移动次数最少。

## 模板编译优化

1. **静态提升 hoistStatic**：把静态节点提到 render 外面，避免每次创建

```js
// 提升前
return h('div', null, [h('p', null, 'static')]);

// 提升后
const _hoisted = h('p', null, 'static');
return h('div', null, [_hoisted]);
```

2. **PatchFlag**：编译时标记动态内容类型，diff 只比对相应部分

```js
h('div', { class: dynamicClass }, text, 1 /* TEXT */ | 2 /* CLASS */)
```

3. **Block Tree**：把动态节点收集到 dynamicChildren 数组，diff 只遍历它

4. **事件缓存 cacheHandlers**：`@click="handler"` 缓存内联函数，避免每次创建新函数

## Teleport

把内容渲染到 DOM 树的另一个位置（仍受组件状态控制）。

```html
<Teleport to="body">
  <div class="modal" v-if="show">...</div>
</Teleport>
```

用途：弹窗、Toast，避免被父元素的 overflow / z-index 影响。

## Suspense（实验性）

```html
<Suspense>
  <template #default>
    <AsyncComp />
  </template>
  <template #fallback>
    <Loading />
  </template>
</Suspense>
```

`AsyncComp` 可以用顶层 await，Suspense 在加载期间展示 fallback。

## Fragment（多根节点）

Vue3 组件支持多个根节点，编译时用 Fragment 包裹。注意 `attrs` 自动透传规则：要明确指定根。

## defineModel（Vue 3.4+）

```vue
<!-- 子 -->
<script setup>
const model = defineModel<string>();
</script>
<input v-model="model" />

<!-- 父 -->
<Child v-model="text" />
```

简化了之前的 `props + emit('update:modelValue')`。

## v-model 变化

```html
<!-- Vue2 -->
<Comp v-model="x" />   <!-- 等价 :value="x" @input -->

<!-- Vue3 -->
<Comp v-model="x" />   <!-- 等价 :modelValue="x" @update:modelValue -->
<Comp v-model:title="t" v-model:visible="v" />   <!-- 多个 v-model -->
```

## 自定义指令变化

```js
app.directive('focus', {
  created(el, binding, vnode, prevVnode) {},
  beforeMount() {},
  mounted(el) { el.focus(); },
  beforeUpdate() {},
  updated() {},
  beforeUnmount() {},
  unmounted() {}
});
```

钩子名对齐生命周期。

## Pinia vs Vuex

| 维度 | Vuex | Pinia |
| --- | --- | --- |
| API | options 风格 | Composition 风格 |
| mutation | 必须 | 没有，直接改 |
| modules | 需嵌套 | 多 store 扁平 |
| TS | 体验差 | 一流 |
| 体积 | 大 | 小 |
| Vue3 推荐 | - | ✓ |

```js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const name = ref('');
  const id = ref(0);
  const fullName = computed(() => `${name.value}-${id.value}`);
  function login(n) { name.value = n; }
  return { name, id, fullName, login };
});
```

## provide / inject 响应式

Vue3 中 provide 的响应式数据，inject 后仍然是响应式。

```js
// 祖先
const theme = ref('dark');
provide('theme', theme);

// 后代
const theme = inject('theme');   // ref
theme.value;
```

可以 `readonly(theme)` 防止后代修改。

## 自定义 hook（Composable）

```js
// useMouse.js
export function useMouse() {
  const x = ref(0);
  const y = ref(0);
  const handler = (e) => { x.value = e.x; y.value = e.y; };
  onMounted(() => window.addEventListener('mousemove', handler));
  onUnmounted(() => window.removeEventListener('mousemove', handler));
  return { x, y };
}

// 使用
const { x, y } = useMouse();
```

## Vue3 性能优化

1. **shallowRef / shallowReactive**：大对象只浅层响应
2. **v-once**：只渲染一次
3. **v-memo**：手动缓存子树

```html
<div v-memo="[item.id, item.selected]">
  <!-- id 和 selected 都没变就跳过更新 -->
</div>
```

4. **markRaw**：第三方实例不进响应式
5. **异步组件 + Suspense**
6. **虚拟列表**（vue-virtual-scroller）
7. **keep-alive**
8. **computed 缓存**
9. **避免不必要的深层 reactive**（用 shallowReactive 或 ref(obj) + 整体替换）

## 组件设计原则

- **业务组件**：贴合业务，可调用接口、改 store
- **基础组件**：无状态，props 进、事件出
- 单一职责，控制粒度（既不过大也不过小）
- props 类型校验、合理默认值
- 必要时配合 slot 提升灵活性
- 暴露的 ref / expose 方法要克制

## Vue3 整体改造点

1. Proxy 响应式
2. Composition API
3. 编译期优化（静态提升 / PatchFlag / Block Tree）
4. 虚拟 DOM 重写（更快）
5. Fragment / Teleport / Suspense
6. TS 重写，类型推导
7. tree-shaking 友好
8. 体积更小（核心 < 13KB gzip）
