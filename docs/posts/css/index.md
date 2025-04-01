# CSS面试题

## 布局

### 介绍BFC及其应用
BFC是Web页面的可视化CSS渲染的一部分，是一个独立的渲染区域。在这个区域内，内部的元素布局不会影响到外部的元素，反之亦然。

BFC的触发条件：
1. 根元素 html。
2. 浮动元素 float属性值为left或right。
3. 绝对定位或固定定位元素（position属性值为absolute或fixed）。
4. overflow属性值不为visible（如auto、scroll、hidden）。
5. display属性值为inline-block、table-cell、table-caption、flex、inline-flex、grid、inline-grid、flow-root。
6. contain属性值为layout、content或strict。

BFC的特性
1. 内部的盒子会在垂直方向上一个接一个地放置。
2. 同一个BFC内的两个相邻块级盒子的垂直外边距会发生折叠，但不同BFC的外边距不会折叠。
3. BFC的区域不会与浮动元素重叠。
4. 计算BFC的高度时，浮动子元素也参与计算。
5. BFC内部的元素不会影响到外部的元素，反之亦然。

BFC的用途
1. 解决外边距折叠问题：通过创建BFC，可以防止相邻元素的外边距发生折叠。
2. 清除浮动：BFC可以包含浮动元素，从而解决浮动带来的高度塌陷问题。
3. 实现两栏布局：利用BFC的特性，可以创建不与浮动元素重叠的布局。


## 对盒模型的理解


## flex布局的理解

父元素
1. flex-direction 主轴的方向
2. flex-wrap 是否换行
3. flex-flow 是flex-direction flex-wrap的缩写
4. justify-content item在主轴的对齐方式
5. aline-items item在交叉轴的对齐方式

子元素
1. order 越小排名越靠前
2. flex-grow 元素的放大比例默认0 存在剩余空间不放大
3. flex-shrink 缩小比例默认为1 空间不足将缩小
4. flex-basis 项目的初始大小 然后再去等比放大或缩小
5. flex 上三个属性的简写 0 1 auto

## 元素隐藏的方式

1. display:none 内容不可见 不占空间 不可点击 重构
2. opacity:0 内容不可见 占据空间 可以点击 重绘
3. visibility:hidden 内容不可见 占据空间 不可点击 重绘

## css实现多行文本溢出

1. overflow hidden
2. text-overflow ellipsis
3. white-space nowrap
4. width 

多行文本溢出有兼容性建议使用伪元素处理。

## 伪类和伪元素的区别
定义
1. 伪类（Pseudo-classes）用于定义元素的特殊状态或行为，以单冒号（:）开头，例如:hover、:first-child等。
2. 伪元素（Pseudo-elements）用于创建虚拟的元素，以双冒号（::）开头，例如::before、::after等。

作用范围
1. 伪类作用于实际存在的HTML元素，基于元素的状态或位置来应用样式。
2. 伪元素用于生成虚拟的元素，通常用于插入内容或装饰，不影响HTML结构。

应用场景
1. 伪类主要用于增强用户体验，例如通过:hover改变按钮颜色，或通过:focus为表单元素添加高亮效果
2. 伪元素主要用于装饰或插入内容，例如通过::before和::after添加图标或清浮动。

内容插入
1. 伪类不能插入内容，只能修改现有元素的样式。
2. 伪元素可以通过content属性插入内容

## 居中为什么使用transform

1. margin 布局属性 会造成重绘和重构导致性能下降
2. transform 合成属性，会创建一个合成层在其中进行动画 不会影响页面的布局，只改变元素的视觉效果。


## transform、transition、animation的区别

定义
1. transform是一个CSS属性，用于对元素进行变换操作，包括平移、旋转、缩放和倾斜等。
   它不会影响页面布局，仅改变元素的视觉效果。
   常见的变换函数有translate、rotate、scale等。
   示例：transform: rotate(45deg)。
2. transition：
   transition是一个CSS属性，用于定义元素在状态变化时的过渡效果。
   它需要状态变化（如:hover、:active）来触发，并且可以指定过渡的持续时间、延迟时间和速度曲线。
   它是一种被动的动画，依赖于属性的变化来触发。
   示例：transition: width 0.5s ease。
3. animation 是一种主动的动画，可以独立于用户交互运行。它允许开发者创建复杂的动画序列，通过关键帧（@keyframes）定义动画的每一步。


## 使用css实现一个三角形

利用css的border属性可以实现三角形 梯形 多边形

1. width：0
2. height：0
3. border：1px solid red
4. border-top-color：transition

## 对盒子模型的理解

- 标准盒子模型 元素的宽度只包含内容 宽度 = content
- IE盒模型 元素的宽度只包含内容 宽度 = width + padding + border

在js中使用offsetWidth属性获取元素宽度


## css3 新增的属性有哪些

- 盒子模型
- 过度
- 动画
- 字体
- 背景
- 渐变
- 媒体查询
- 多列布局

## css加载会造成阻塞吗

- css不会阻塞dom树的解析会阻塞dom树的渲染
- css会阻塞后续js语句的执行


## postcss是什么

- css babel 可以吧较新的css转换为可用的css
- 使用js插件的方式进行css的转换 code=>ast=>code

## requestAnimationFrame的理解

请求动画：
window.requestAnimationFrame(callback)

callback 会在下次重绘之前执行更新动画帧函数，参数为开始执行时间，这个是一个宏任务。

取消动画：
cancelAnimationFrame(id)

优点：
- cpu节能 当页面未被渲染或者激活不会去执行 任务也会被暂停相比于setTimeout会在后台运行
- 每个刷新时间内只会被执行一次 类似节流防抖
- 减少dom操作 每个帧中把所有的dom动画操作集中执行60帧/s
