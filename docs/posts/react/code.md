---
title: React 源码精读
description: Fiber、调度器、Hooks 链表的简化实现
---

# React 源码精读

> 用极简代码理解 React 内部如何工作。

## 任务切片（mini Fiber）

```js
let nextUnitWork = null;
let workInProgressRoot = null;
let currentRoot = null;
let deletions = null;

// createElement：JSX 转 VNode
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: { nodeValue: text, children: [] }
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(c =>
        typeof c === 'object' ? c : createTextElement(c)
      )
    }
  };
}

// 创建真实 DOM
function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

// 更新 DOM 属性
function updateDom(dom, prevProps, nextProps) {
  // 事件
  Object.keys(prevProps)
    .filter(k => k.startsWith('on'))
    .filter(k => !(k in nextProps) || prevProps[k] !== nextProps[k])
    .forEach(k => dom.removeEventListener(k.slice(2).toLowerCase(), prevProps[k]));
  Object.keys(nextProps)
    .filter(k => k.startsWith('on'))
    .filter(k => prevProps[k] !== nextProps[k])
    .forEach(k => dom.addEventListener(k.slice(2).toLowerCase(), nextProps[k]));

  // 旧属性移除
  Object.keys(prevProps)
    .filter(k => k !== 'children' && !k.startsWith('on'))
    .filter(k => !(k in nextProps))
    .forEach(k => { dom[k] = ''; });

  // 新属性设置
  Object.keys(nextProps)
    .filter(k => k !== 'children' && !k.startsWith('on'))
    .filter(k => prevProps[k] !== nextProps[k])
    .forEach(k => { dom[k] = nextProps[k]; });
}

// reconcile：构建 fiber 树 + 做 diff
function reconcileChildren(fiber, children) {
  let index = 0;
  let oldFiber = fiber.alternate && fiber.alternate.child;
  let prevSibling = null;

  while (index < children.length || oldFiber) {
    const vnode = children[index];
    let newFiber = null;
    const sameType = oldFiber && vnode && vnode.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: vnode.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      };
    }
    if (vnode && !sameType) {
      newFiber = {
        type: vnode.type,
        props: vnode.props,
        dom: null,
        parent: fiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) oldFiber = oldFiber.sibling;

    if (index === 0) fiber.child = newFiber;
    else if (vnode) prevSibling.sibling = newFiber;

    prevSibling = newFiber;
    index++;
  }
}

// 单个工作单元
function performUnitOfWork(fiber) {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, fiber.props.children);

  // 深度优先
  if (fiber.child) return fiber.child;
  let next = fiber;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.parent;
  }
  return null;
}

// commit：把所有改动落到真实 DOM
function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workInProgressRoot.child);
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}

// 调度循环
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitWork && !shouldYield) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
    shouldYield = deadline.timeRemaining() < 1;   // 剩余时间不到 1ms 让出
  }
  if (!nextUnitWork && workInProgressRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

// 入口
function render(element, container) {
  workInProgressRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot
  };
  deletions = [];
  nextUnitWork = workInProgressRoot;
}
```

## 调度器（基于 MessageChannel）

为什么 React 18+ 用 MessageChannel 而不是 requestIdleCallback？
- `requestIdleCallback` 只在浏览器空闲时跑，最慢 50ms 才一次，掉帧
- `MessageChannel` 是宏任务，下一次任务循环就能跑，更可控
- React 自己用时间片（5ms）来模拟"够用就好"

```js
const frameRate = 60;
const frameLength = 1000 / frameRate;
const taskQueue = [];

const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = function () {
  if (taskQueue.length === 0) return;
  let currentTime = performance.now();
  const deadline = currentTime + frameLength;

  while (taskQueue.length > 0 && currentTime < deadline) {
    const task = taskQueue.shift();
    task();
    currentTime = performance.now();
  }

  if (taskQueue.length > 0) port.postMessage(null);
};

function scheduleTask(task) {
  taskQueue.push(task);
  port.postMessage(null);
}
```

## Hooks 链表实现

Hooks 数据存在 fiber 上，按调用顺序排列成链表。

```js
let workInProgressFiber = null;
let hookIndex = 0;

function useState(initial) {
  const oldHook = workInProgressFiber.alternate
    && workInProgressFiber.alternate.hooks
    && workInProgressFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  // 执行 setState 队列里待处理的 action
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    // 触发重新渲染
    workInProgressRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextUnitWork = workInProgressRoot;
    deletions = [];
  };

  workInProgressFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}
```

为什么不能写在条件中？
- 每次渲染按 `hookIndex` 顺序匹配上一次的 hook
- 条件分支改变了顺序 → state 错位

## diff 中的 key 处理

```js
function reconcileWithKey(oldChildren, newChildren) {
  const oldMap = new Map();
  oldChildren.forEach(child => {
    if (child.key) oldMap.set(child.key, child);
  });

  newChildren.forEach(newChild => {
    const matched = newChild.key && oldMap.get(newChild.key);
    if (matched) {
      // 复用
      newChild.alternate = matched;
      newChild.effectTag = 'UPDATE';
      oldMap.delete(newChild.key);
    } else {
      newChild.effectTag = 'PLACEMENT';
    }
  });

  // 剩余的全部删除
  oldMap.forEach(child => {
    child.effectTag = 'DELETION';
    deletions.push(child);
  });
}
```

## 简化的 useEffect

```js
function useEffect(callback, deps) {
  const oldHook = workInProgressFiber.alternate
    && workInProgressFiber.alternate.hooks[hookIndex];

  const hasChanged = !oldHook
    || !deps
    || deps.some((dep, i) => dep !== oldHook.deps[i]);

  const hook = {
    tag: 'effect',
    deps,
    callback: hasChanged ? callback : null,
    cleanup: oldHook && oldHook.cleanup
  };

  workInProgressFiber.hooks.push(hook);
  hookIndex++;
}

// commit 阶段执行
function commitEffects(fiber) {
  if (!fiber) return;
  fiber.hooks && fiber.hooks.forEach(hook => {
    if (hook.tag === 'effect' && hook.callback) {
      // 先跑清理
      if (hook.cleanup) hook.cleanup();
      // 再跑回调
      const cleanup = hook.callback();
      hook.cleanup = cleanup;
    }
  });
  commitEffects(fiber.child);
  commitEffects(fiber.sibling);
}
```

## React 中的合成事件简化

```js
const listeners = new Map();   // eventType → Set<handler>

function setupRootListener(root, eventType) {
  root.addEventListener(eventType, (nativeEvent) => {
    const path = nativeEvent.composedPath();
    for (const el of path) {
      const handler = el._reactHandlers?.[eventType];
      if (handler) handler(syntheticEvent(nativeEvent));
    }
  });
}
```

## 总结

- **Fiber 解决卡顿**：链表化 + 时间分片 + 双缓冲
- **调度器是 React 的大脑**：在浏览器允许的时间内尽量跑
- **Hooks 是依赖位置的**：链表按调用顺序，所以不能在条件中
- **commit 阶段不可中断**：保证 UI 一致性
