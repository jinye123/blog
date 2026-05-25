---
title: React 面试题
description: React 核心原理与高频面试题
---

# React 面试题

## 组件类型

| 类型 | 特点 |
| --- | --- |
| 函数组件 | Hooks 之后主流，更简洁，没有 this |
| 类组件 | 老项目仍存在，有 this 和生命周期 |
| Hooks | 让函数组件有状态、副作用等能力 |

类组件不会消失，但新项目几乎都用函数组件。

## 为什么需要 Hooks

1. **组件间复用状态逻辑困难**：HOC、Render Props 会造成嵌套地狱
2. **复杂组件难理解**：生命周期里塞着各种无关逻辑
3. **类组件的 this 问题**：方法绑定繁琐、易出错
4. **更好的 tree-shaking**：函数组件没有继承链

## Hooks 规则与原理

**两条规则**：
1. 只在最顶层调用 Hook（不能在条件 / 循环 / 嵌套函数里）
2. 只在 React 函数 / 自定义 Hook 中调用

**原理**：Hooks 信息存在 `fiber.memoizedState` 上，以**链表**结构按调用顺序排列。每次渲染按顺序匹配。

```
组件 fiber.memoizedState → state1 → state2 → state3 → ...
```

如果在 if 中调用 → 顺序错位 → 拿到错误的 state。

## 常用 Hooks 全表

| Hook | 用途 |
| --- | --- |
| useState | 组件状态 |
| useReducer | 复杂状态（type+payload） |
| useEffect | 副作用（异步、订阅、DOM 操作） |
| useLayoutEffect | 同 useEffect，但同步执行（DOM 更新后渲染前） |
| useInsertionEffect | 比 useLayoutEffect 更早，专给 CSS-in-JS |
| useContext | 消费 Context |
| useRef | 持久引用（DOM / 任意值），改值不触发渲染 |
| useImperativeHandle | 子向父暴露方法（配合 forwardRef） |
| useMemo | 缓存计算结果 |
| useCallback | 缓存函数引用 |
| useTransition | React 18，非紧急更新 |
| useDeferredValue | React 18，延迟值 |
| useId | 生成稳定 ID（SSR 友好） |
| useSyncExternalStore | 订阅外部 store（Redux 等用） |
| use（React 19） | 读 Promise / Context，可以在 if 中调用 |
| useOptimistic（React 19） | 乐观更新 |
| useActionState（React 19） | 表单 action 状态 |

## useEffect vs useLayoutEffect vs useInsertionEffect

执行时机：

```
React 渲染（计算 VNode）
  → useInsertionEffect 执行（DOM 改动前，CSS-in-JS 注入样式）
  → DOM 变更
  → useLayoutEffect 执行（DOM 改完，浏览器绘制前，同步）
  → 浏览器绘制
  → useEffect 执行（异步，下个微任务）
```

选择：
- 一般用 `useEffect`（不阻塞绘制）
- 需要读 DOM 尺寸 / 修正布局避免闪烁，用 `useLayoutEffect`
- 库作者注入 style 用 `useInsertionEffect`

注意：`useLayoutEffect` 在 SSR 中会警告，因为 SSR 没有 DOM。

## React 模拟生命周期

```jsx
function App({ id }) {
  // componentDidMount + componentWillUnmount
  useEffect(() => {
    console.log('mount');
    return () => console.log('unmount');
  }, []);

  // componentDidUpdate
  useEffect(() => {
    console.log('id 变化', id);
  }, [id]);

  // 每次渲染都跑（不要这么写，除非有意）
  useEffect(() => {});

  // getDerivedStateFromProps：直接在 render 里算
  const [internal, setInternal] = useState(() => deriveFromProps(id));

  return null;
}
```

## React 版本演进

| 版本 | 关键变化 |
| --- | --- |
| 15 | 栈调和（Stack Reconciler） |
| **16** | **Fiber 架构**、Error Boundary、Portal、Fragments |
| 16.6 | React.memo、React.lazy、Suspense（仅 Code Split） |
| **16.8** | **Hooks** |
| 17 | 无新特性，过渡版（事件机制改，去掉 React 容器代理） |
| **18** | **并发渲染（Concurrent Rendering）正式**、自动批处理、Suspense for Data、startTransition、useId、流式 SSR |
| 19 | use Hook、Server Actions、ref 作为 prop、useOptimistic、useActionState |

**注意**：Fiber 是 **16 引入**的，不是 17。

## Fiber 架构

为什么需要：
- 老的栈调和是递归遍历 VNode，一旦开始无法中断
- 大组件树更新会长时间占用主线程，造成卡顿

Fiber 的核心：
1. **链表化**：用 child / sibling / return 三个指针把树拍平成可遍历的链表
2. **可中断**：每个 Fiber 节点处理完后检查时间分片（5ms）
3. **双缓冲**：current（当前 DOM 对应的 Fiber）与 workInProgress（构建中），完成后整体切换
4. **优先级调度**：不同更新有不同 lane，高优先级可打断低优先级

```
beginWork（从根向下）
  → 处理函数组件 / 类组件
  → 标记 effectTag（Placement/Update/Deletion）
  → 进入子节点

completeWork（从底向上）
  → 创建真实 DOM 节点（不挂载）
  → 收集 effect list

commitWork（同步、不可中断）
  → commitBeforeMutationEffect（getSnapshotBeforeUpdate）
  → commitMutationEffect（DOM 增删改 + useLayoutEffect 的清理）
  → workInProgress 切换为 current
  → commitLayoutEffects（useLayoutEffect）
  → 浏览器绘制
  → useEffect 异步执行
```

## diff 算法

策略：
1. **同层比较**：跨层级移动当作删 + 增（实际很少跨层）
2. **type 不同直接替换**：哪怕只是 div → span，整棵子树重建
3. **key 复用**：相同 type + 相同 key 才认为是同一节点

为什么没用 Vue3 的最长递增子序列？
- React 没有模板编译信息，运行时拿不到完整结构对比的便利
- React 倾向"快速够用"，复杂度换简单性

## key 的作用

- 帮 diff 判断节点身份
- 列表渲染必须给稳定的 key（id 优先，不要用 index 当 key，除非列表永远不会改变顺序）

## setState 同步还是异步

**React 17**：
- React 事件 / 生命周期：异步批处理
- setTimeout / Promise / 原生事件：同步立即生效

**React 18**：所有地方都自动批处理。

```js
// React 18 中：只触发一次渲染
setTimeout(() => {
  setA(1);
  setB(2);
  setC(3);
});

// 想强制同步：
flushSync(() => {
  setA(1);   // 立即提交
});
```

## useState 闭包陷阱

```jsx
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setInterval(() => setCount(count + 1), 1000);   // 永远是 0+1
  }, []);
}
```

原因：effect 闭包捕获了初始 count。

解法：
1. **函数式更新**：`setCount(c => c + 1)`
2. **依赖加上 count**（但会重置 interval）
3. **useRef** 保存最新值
4. **useReducer**：reducer 总能拿到最新 state

```jsx
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

## memo / useMemo / useCallback

| API | 作用 | 何时用 |
| --- | --- | --- |
| `React.memo(Comp)` | props 不变就跳过子组件渲染 | 子组件渲染贵 |
| `useMemo(fn, deps)` | 缓存计算结果 | 计算贵 |
| `useCallback(fn, deps)` | 缓存函数引用 | 传给 memo 子组件、作为依赖 |

**何时是过度优化**：
- 子组件渲染很轻 → memo 反而成本更高
- 依赖里有对象/数组 → 引用每次都变，memo 无效
- 不要默认全用，性能瓶颈再上

```jsx
// 错：props.user 每次都是新对象，memo 无效
<Child user={{ id }} />

// 对：用 useMemo 保持引用稳定
const user = useMemo(() => ({ id }), [id]);
<Child user={user} />
```

## useTransition / useDeferredValue（React 18）

`useTransition`：把更新标记为非紧急，可被打断。

```jsx
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setInput(e.target.value);            // 紧急（输入框响应）
  startTransition(() => {
    setList(filter(e.target.value));   // 非紧急（列表可慢点）
  });
}
```

`useDeferredValue`：把值标记为延迟，类似防抖但由 React 调度。

```jsx
const [text, setText] = useState('');
const deferredText = useDeferredValue(text);
```

## Context

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}
```

注意：Context value 变化会让所有消费组件重渲染。大型应用配合 `useMemo` value，或拆多个 Context。

## Error Boundary

只有类组件能写错误边界。

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    report(error, info);
  }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}
```

捕获范围：
- ✓ 渲染、生命周期、构造函数中的错误
- ✗ 事件处理器（用 try/catch）
- ✗ 异步（setTimeout / fetch then）
- ✗ SSR
- ✗ 错误边界自己抛的错

## Portal

```jsx
ReactDOM.createPortal(<Modal />, document.body);
```

物理 DOM 跳出父节点，但事件冒泡仍按 React 树走（这是个常见坑：原生事件不冒泡到原父，但 React 合成事件会）。

## 合成事件

- React 把所有事件代理到根容器（React 17 起代理到 React 根而不是 document）
- 事件对象是 `SyntheticEvent`，跨浏览器一致
- React 17 之前事件对象会池化（用完属性被清空）
- 事件名小驼峰（`onClick`）
- React 18 之后合成事件批处理一样适用于普通函数

## 受控 vs 非受控

```jsx
// 受控：value 由 state 控制
<input value={val} onChange={e => setVal(e.target.value)} />

// 非受控：DOM 自己管，用 ref 拿
<input defaultValue="init" ref={inputRef} />
```

## React Router 6

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="user/:id" element={<User />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>

// 跳转
const navigate = useNavigate();
navigate('/user/1');

// 参数
const { id } = useParams();
const [search] = useSearchParams();
```

## 状态管理对比

| 库 | 特点 | 适用 |
| --- | --- | --- |
| Redux + RTK | 工业标准、单一 store、可预测 | 大型项目 |
| MobX | 响应式、写法更自由 | 习惯响应式的团队 |
| Zustand | 极简、API 像 hook | 中小项目首选 |
| Jotai | 原子化（atom）、按需订阅 | 细粒度状态 |
| Recoil | 类似 Jotai，Meta 出品但停更 | - |
| Valtio | Proxy 响应式（像 Vue） | - |

## Redux 三大原则

1. **单一数据源**：整个应用一个 store
2. **State 只读**：通过 dispatch action 修改
3. **纯函数 reducer**：`(state, action) => newState`

中间件原理（compose）：

```js
const compose = (...fns) => fns.reduce((a, b) => (...args) => a(b(...args)));
```

Redux Toolkit 解决了什么：
- 模板代码太多 → createSlice 自动生成 actions
- 不可变写起来烦 → 内置 Immer，直接改 state
- 异步麻烦 → createAsyncThunk / RTK Query

## 实现一个 redux

```js
function createStore(reducer, preloadedState) {
  let state = preloadedState;
  let listeners = [];

  return {
    getState() { return state; },
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach(fn => fn());
      return action;
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => { listeners = listeners.filter(l => l !== listener); };
    }
  };
}

function combineReducers(reducers) {
  return function (state = {}, action) {
    const nextState = {};
    for (const key in reducers) {
      nextState[key] = reducers[key](state[key], action);
    }
    return nextState;
  };
}

function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = store.dispatch;
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    };
    const chain = middlewares.map(m => m(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);
    return { ...store, dispatch };
  };
}
```

## React 19 新特性

- **`use` Hook**：在组件中读 Promise / Context，可在条件中调用
- **Server Actions / Server Components**：服务端组件正式
- **Form Actions**：原生 form 配合 action 函数
- **useOptimistic**：乐观更新内置
- **useActionState**：表单 action 的 pending / state / error
- **ref 作为 prop**：函数组件不再需要 forwardRef
- **document metadata** 直接在组件内写 `<title>`/`<meta>`
- 资源加载优化（preload / preinit）

## 性能优化清单

1. **memo / useMemo / useCallback**（不滥用）
2. **拆分组件**（局部状态减少影响范围）
3. **useTransition / useDeferredValue**
4. **虚拟列表**（react-window / react-virtuoso）
5. **代码分割 React.lazy + Suspense**
6. **避免 props 引用变化**
7. **useReducer 处理复杂状态**（取代多个 useState）
8. **不要在 render 中创建新对象 / 函数当 prop**
9. **使用 stable id 当 key**
10. **Profiler 性能分析**
