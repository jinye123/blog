# vue3 

## 手写一个reactive

```js
const reactiveMap = new WeakMap();
const targetMap = new WeakMap()
let activeEffect = null;

function reactive(target){
  if(reactiveMap.has(target)){
    return reactiveMap.has(target)
  }
  
  const proxy = new Proxy(target,{
    get(target,key,receiver){
      track(target,key)
      const res = Reflect.get(target,key,receiver)
      if(typeof res === 'object' && res !== null){
        return reactive(res)
      }
      return res
    },
    set(target,key,value,receiver){
      const oldValue = target[key]
      const newValue = typeof value === 'object'? reactive(value):value
      const res = Reflect.set(target,key,newValue,receiver)
      
      if(!Object.is(oldValue,newValue)){
        triger(target,key)
      }
      
      return res
    }
  }) 
  
  reactiveMap.set(target,proxy)
  return proxy
}

function track(target,key){
  if(!activeEffect){
    return
  }
  
  let depMap = targetMap.get(target)
  if(!depMap){
    targetMap.set(target,(depMap=new Map()))
  }
  let deps = depMap.get(key)
  if(!deps){
    deps.set(key,(deps = new Set()))
  }
  
  deps.add(activeEffect)
}

function triger(target,key){
  const depMap = targetMap.get(target)
  if(!depMap){
    return
  }
  const deps = depMap.get(key)
  
  if (deps){
    deps.forEach(dep=>dep())
  }
}

function effect(fn){
  const wrapper=()=>{
    activeEffect = wrapper
    fn()
    activeEffect = null
  }
  
  wrapper()
}
```

## vue3做性能优化

1. 组件懒加载
2. 使用keep-alive
3. 使用v-once加载纯组件
4. 使用shallowRef 避免层级过深性能
5. 合理使用computed和watch
6. 使用虚拟列表
7. 节流防抖
8. 图片懒加载


## 组件的设计思考和原则 

在可扩展性和贴合业务层面找到平衡点

- 业务组件偏向于业务
- 基础组件偏向于扩展

1. 分解UI结构
2. 只做最基础的UI操作 具体行为交由父组件处理