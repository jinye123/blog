# 源码解析

## 任务切片

```js
let nextUnitWork = null // 下一个工作单元
let workInProgresRoot = null // 当前工作的fiber树
let currentRoot = null // 就的fiber树
let deletions = null  // 删除的fiber节点

function createTextElement(text){
  return {
    type:'TEXT_ELEMENT',
    props:{
      nodeValue:text,
      children:[]
    }
  }
}

function createElement(type,props,...children){
  return {
    type,
    props:{
      ...props,
      children:children.map(child=>{
        if (typeof child === 'object'){
          return child
        }else if(typeof child === 'string') {
          return createTextElement(child)
        }
      })
    }
  }
}

function createDom(fiber){
  const element = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type)
  updateDom(element,{},fiber.props)
  return element
}

function updateDom(dom,prevProps,nextProps){
  Object.keys(prevProps).filter(key=>key!=='children').forEach(prop=>{
    dom[prop] = ''
  })
  Object.keys(nextProps).filter(key=>key!=='children').forEach(prop=>{
    dom[prop] = nextProps[prop]
  })
}

// 把虚拟dom拿来创建fiber树，同时进行diff
function reconcileChildren(fiber,childrens){
  let index = 0 
  let prevSibling = null
  let oldFiber = fiber.alternate && fiber.alternate.child // 旧的fiber
  while (index<childrens.length || oldFiber !==null){
    const vnode = childrens[index]
    let newFiber = null
    const sameType = vnode && oldFiber &&vnode.type === oldFiber.type 
    if(sameType){
      newFiber = {
        type:oldFiber.type,
        props:vnode.props,
        parent:fiber,
        dom:oldFiber.dom,
        sibling:null,
        alternate:oldFiber,
        effectTag:'UPDATE'
      }
    }
    
    if(vnode && !sameType){
      newFiber = {
        type:vnode.type,
        props:vnode.props,
        parent:fiber,
        dom:null,
        alternate:null,
        sibling:null,
        effectTag:'PLACEMENT'
      }
    }

    if(oldFiber && !sameType){
      newFiber = {
        type:vnode.type,
        props:vnode.props,
        parent:fiber,
        dom:null,
        alternate:null,
        sibling:null,
        effectTag:'DELETION'
      }
      deletions.push(oldFiber)
    }
    
    if(oldFiber) oldFiber = oldFiber.sibling
    
    if(index===0){
      fiber.child = newFiber
    }else if(vnode) {
      prevSibling.sibling = newFiber
    }
    
    prevSibling = newFiber
    
    index++
  }
}

function performUnitOfWork(fiber){
  if(!fiber.dom){
    fiber.dom = createDom(fiber)
  }
  // beginwork 自上而下vnode变成fiber树
  const childrens = fiber.props.children 
  
  reconcileChildren(fiber,childrens)
  
  if(fiber.child){
    return fiber.child
  }
  
  let nextFiber = fiber
  while (nextFiber){
    if (nextFiber.sibling){
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  // complteWork() 自下而上生成dom
  return null
}

function commitWork(fiber){
  if (!fiber){
    return
  }
  
  const domParent = fiber.parent.dom
  
  if(fiber.effectTag==='PLACEMENT'){
    domParent.appendChild(fiber.dom)
  }else if(fiber.effectTag==='UPDATE'){
    updateDom(fiber.dom,fiber.alternate.props,fiber.props)
  }else if (fiber.effectTag==='DELETION'){
    domParent.remove(fiber.dom)
  }
  
  commitWork(fiber.child)
  commitWork(fiber.sibling)
  
}

function commitRoot(){
  deletions.forEach(commitWork)
  commitWork(workInProgresRoot.child)
  currentRoot = workInProgresRoot
  workInProgresRoot = null
}

function workLoop(deadLine){
  let shouldYield= false
  // 如果当前有工作单元同时还有可用帧
  while (nextUnitWork && !shouldYield){
    // 执行当前工作单元返回链式的下一个工作单元
    nextUnitWork = performUnitOfWork(nextUnitWork)
    shouldYield = deadLine.timeRemaining()
  }
  // 所有的fiber工作都已经完成，有待提交的fiber树
  if(!nextUnitWork && workInProgresRoot){
    commitRoot()
  }
  
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function render(rootFiber,container){
  workInProgresRoot = {
    fiberRoot:container,
    props:{
      children:[rootFiber]
    },
    alternate:currentRoot
  }
}

render(vnode,document.getElementById('root'))
```
## 调度器
```js
// 定义帧率和每帧的时间
const frameRate = 30;
const frameLength = 1000 / frameRate;

// 定义任务队列
const taskQueue = [];

// 定义消息通道和消息处理器
const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = function () {
  if (taskQueue.length === 0) {
    return;
  }

  // 获取当前时间
  let currentTime = performance.now();

  // 计算下一帧的结束时间
  const frameDeadline = currentTime + frameLength;

  // 一直执行任务，直到任务队列为空或超出帧时长
  while (taskQueue.length > 0 && currentTime < frameDeadline) {
    const task = taskQueue.shift();
    task();

    // 更新当前时间
    currentTime = performance.now();
  }

  // 如果还有任务，继续请求执行
  if (taskQueue.length > 0) {
    port.postMessage(null);
  }
};

// 定义任务调度函数
function scheduleTask(task) {
  // 将任务添加到队列
  taskQueue.push(task);

  // 请求在下一帧执行任务
  port.postMessage(null);
}
```