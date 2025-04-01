# 手写面试他

## 在js中new一个函数返回的值是什么

1. 默认行为：返回新创建的对象。
2. 显式返回对象：返回构造函数中显式返回的对象。
3. 显式返回原始值：忽略返回值，返回新创建的对象。

```js
function newHandle(cunstruct,...args){
  const obj = {}
  Object.setPrototypeOf(obj,cunstruct.prototype)
  const result = cunstruct.apply(obj,args)
  return result instanceof Object ? result : obj;
}
```

## 在js中实现bind函数

```js
function myBind(context){
  const self = this;
  const args = Array.prototype.slice().call(arguments,1)
  
  return function (){
    const newArgs = Array.prototype.slice(arguments)
    return self.apply(contex,args.concat(newArgs))
  }
}
```

## 在js中实现call函数

```js
Function.prototype.myCall=function (context){
  const symbolekey = new Symbol()
  
  context[symbolekey] = this
  
  const args = Array.prototype.slice.call(arguments,1)

  const result = context[symbolekey](...args) 
  
  delete context[symbolekey]
  
  return result
}
```

## 在js中实现reducer函数

```js
Function.prototype.myReducer = function (callback,initState){
  let accumulator = initState !== undefined ? initState : ''
  let initIndex = initState !== undefined ? 1 : 0
  
  for (let i = initIndex; i<this.length; i++){
    if(i in this){
      accumulator = callback(accumulator,this[i],i,this)
    }
  }
} 
```

## 函数深拷贝

```js
function deepColne(obj){
  if(typeof obj === null || typeof obj !=='object'){
    return obj
  }
  
  if(Array.isArray(obj)){
    return obj.map(item=>deepColne(item))
  }
  
  const clone = {}
  for (key in obj){
    if(obj.hasOwnProperty(key)){
      clone[key] = deepColne(obj[key])
    }
  }
  
  return clone
}
```

## 固定请求为3个的

```js
async function contrlLimit(arr,limit){
  const extList = new Set()
  for (let item of arr){
    const task = Promise.resolve().then(()=>item()).finally(()=>[
      extList.delete(task)
    ])
    extList.add(task)
    if(extList.length>=3){
      await Promise.race(extList)
    }
  }
}

function contrlLimit(urls,limit){
  return new Promise((resolve=>{
    const results = []
    let index = 0
    async function request(){
      if(index===urls.length){
        return
      }
      const url = urls[index]
      index ++
      const res = await url()
      results[i] = res
      request()
    }

    for (let i=0;i<limit;i++){
      request()
    }
  }))
}
```