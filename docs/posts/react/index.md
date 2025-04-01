# React

## react有哪些hooks

1. useImperativeHandle 用于将子组件的方法暴漏给父组件 有点像是vue的expose
2. useLayoutEffect 的回调在dom更新后视图绘制前同步执行
3. useEffect 的回调函数是dom更新后视图绘制后异步进行


## react的组件有哪些？

1. 函数组件
2. 类组件


## 函数式组件如何模拟生命周期？

```js
function App(props){
  
  const [state,setState] = useState(()=>{
    // 根据props计算返回state
    console.log('getDerivedStateFromProps')
    return ''
  })

  useEffect(() => {
    console.log('componentDidMount')
    
    return ()=>{
      console.log('componentWillUnmount')
    }
  }, []);
  
  useEffect(()=>{
    console.log('componentWillReceiveProps')
  },[props])
  
  useEffect(()=>{
    // useLayoutEffect
    console.log('componentDidUpdate')
  })
  
  return(
      <div>生命周期</div> 
  )
}
```

## 如何使用hooks的注意方式

1. 只能在最外面一层使用hooks 不能卸载循环或者条件判断中
2. 只能在react相关函数中使用hooks，或者在use开头的函数中，不能再普通的函数中使用

## 为什么会有hooks

1. 组件之间复用状态逻辑困难 hoc render-props
2. 复杂组件会变得难以理解
3. 类组件的this的指针问题

## 组件之间的通信

1. 父子组件通过props传递属性
2. 子父组件通过props传递函数

## react版本的区别

- 16.8之前 stack 协调
- 17版本  fiber 协调
  - legacy 常规模式
  - concurrent 支持高优先级打断低优先级
- 18.2版本
  - 高优先级打断低优先级

## setState 同步还是异步

在函数内部有一个batchUpdate批量更新的状态

1. 函数开始batchUpdate为true 开始收集更新函数
2. 函数中间部分同步不执行代码
3. 函数结尾batchUpdate为false 停止收集更新函数
4. 收集到的更新函数会在异步的方式执行

在react17和18的区别在于react18在setTimeout函数内部也是异步的

## useEffect和useLayoutEffect的区别

- useEffect的回调函数是dom更新后 视图绘制后 异步进行
  - 修改dom后 渲染两次 回流重绘
- useLayoutEffect的回调在dom更新后 视图绘制前 同步执行
  - 修改dom后 渲染一次
  - useLayoutEffect用于更方便的修改dom
  - 更类似componentDidMount和componentUpdate
- useInsertionEffect在dom更新前 同步执行
  - 组要解决css-in-js在渲染中注入样式的问题
  - 在dom更新前处理css 防止重新计算样式

## react的更新流程

### beginWork

- 自上而下遍历vNode构建fiber树与current fiber对比，生成本次更新的 workInProgress fiber
- 期间会执行函数组件、 diff 子节点，给我需要变更的节点，打上effectTag
  - 增 placement
  - 删 deletion
  - 改 update
#### completeWork
- 自下而上构建真实dom元素，但是不挂载在界面上
- 把所有effect tag的元素，串联成一个effect List
#### commitWork
- commitBeforeMutationEffect
  - 处理合成事件等
- commitMutationEffect
  - 处理 effectList
  - 更新界面
  - current fiber 切换成workInProgress fiber
- commitLayoutEffects


## react中的闭包陷阱

1. useState和useEffect中存在setTimeout在当中有对旧值的引用
2. 因为react的hooks是以链表的形式存在，并且执行逻辑需要依赖deps

解法
- 在state中传入函数去改变值
- 使用useRef去保存值 相当于全局变量


## 实现一个redux

```js
function createStore(reducer,initState){
  this.state = initState
  this.listeners=[]
  
  function subtrib(listener){
    this.listeners.push(listener)
  }
  
  function dispatch(state,action){
    const currentState = reducer(state,action)
    state = currentState
    this.listeners.forEach((listener)=>{
      listener()
    })
  }
  
  return {
    subtrib,
    
  } 
}

function compose(reducers){
  const keys = Object.keys(reducers)
  
  return function (state,action){
    const nextState = {}
    keys.forEach((key)=>{
      const reducer = reducers[key]
      const next = reducer(state[key],action)
      nextState[key] = next
    })
    return nextState
  }
}
```