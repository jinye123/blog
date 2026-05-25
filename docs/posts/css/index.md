---
title: CSS 面试题
description: CSS 高频面试题与深度解读
---

# CSS 面试题

## 盒模型

```
+------------------------------+
|        margin                |
|  +------------------------+  |
|  |       border           |  |
|  |  +------------------+  |  |
|  |  |     padding      |  |  |
|  |  |  +------------+  |  |  |
|  |  |  |  content   |  |  |  |
|  |  |  +------------+  |  |  |
|  |  +------------------+  |  |
|  +------------------------+  |
+------------------------------+
```

| 模型 | 宽度计算 | box-sizing |
| --- | --- | --- |
| 标准盒模型（W3C） | width = content | `content-box`（默认） |
| IE 盒模型 | width = content + padding + border | `border-box` |

JS 获取：
- `dom.style.width`：只能取行内样式
- `getComputedStyle(dom).width`：最终样式（标准盒）
- `dom.offsetWidth`：content + padding + border（IE 盒）
- `dom.clientWidth`：content + padding
- `dom.scrollWidth`：内容真实宽度（含溢出）

## BFC（块级格式化上下文）

定义：一个**独立的渲染区域**，区域内部布局不影响外部，反之亦然。

触发条件：
1. 根元素 `html`
2. `float` 不为 `none`
3. `position: absolute / fixed`
4. `overflow` 不为 `visible`（`auto/hidden/scroll`）
5. `display: inline-block / flex / inline-flex / grid / table-cell / flow-root`
6. `contain: layout / content / strict`

特性：
1. 内部盒子在垂直方向上一个接一个放置
2. 同一 BFC 内相邻块的垂直 margin 会合并
3. BFC 区域不与 float 元素重叠
4. 计算 BFC 高度时，浮动子元素也参与

应用：
- 清除浮动（父元素触发 BFC，包含浮动子元素）
- 防止 margin 折叠（兄弟元素分别在不同 BFC）
- 实现两栏自适应（左浮动 + 右 `overflow: hidden`）

推荐用 `display: flow-root` 创建 BFC，无副作用。

## Flex 布局

容器属性：
- `flex-direction`：主轴方向 `row/row-reverse/column/column-reverse`
- `flex-wrap`：是否换行 `nowrap/wrap/wrap-reverse`
- `flex-flow`：`flex-direction` + `flex-wrap` 缩写
- `justify-content`：主轴对齐 `flex-start/flex-end/center/space-between/space-around/space-evenly`
- `align-items`：交叉轴对齐 `stretch/flex-start/flex-end/center/baseline`
- `align-content`：多行交叉轴对齐
- `gap`：行列间距（现代替代 margin）

项目属性：
- `order`：排序，越小越靠前，默认 0
- `flex-grow`：放大比例，默认 0（剩余空间不放大）
- `flex-shrink`：缩小比例，默认 1（空间不足缩小）
- `flex-basis`：项目初始大小，默认 `auto`
- `flex`：上三个的简写，`flex: 1` 等于 `1 1 0%`
- `align-self`：覆盖容器的 `align-items`

`flex: 1` 与 `flex: auto` 的区别：
- `flex: 1` = `1 1 0%`：完全平分剩余空间
- `flex: auto` = `1 1 auto`：以内容为基准平分

## Grid 布局

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 100px auto;
  grid-template-areas:
    "header header header"
    "sidebar main main";
  gap: 16px;
}
.item { grid-area: header; }
```

与 Flex 区别：Flex 一维，Grid 二维。Grid 更适合整体布局，Flex 更适合组件内部。

## 元素隐藏方式

| 方式 | 占空间 | 可点击 | 触发回流 | DOM 子树 |
| --- | --- | --- | --- | --- |
| `display: none` | ✗ | ✗ | 是 | 不渲染 |
| `visibility: hidden` | ✓ | ✗ | 否（重绘） | 渲染 |
| `opacity: 0` | ✓ | ✓ | 否（合成层） | 渲染 |
| `clip-path: inset(100%)` | ✓ | ✗ | 否 | 渲染 |
| 移出可视区 | ✓ | ✗ | 是 | 渲染 |

## 单行 / 多行文本溢出

单行：

```css
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

多行（现代浏览器）：

```css
.multi-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

多行（兼容方案，定位伪元素遮盖）：

```css
.fallback {
  position: relative;
  line-height: 20px;
  max-height: 60px;
  overflow: hidden;
}
.fallback::after {
  content: '...';
  position: absolute;
  right: 0;
  bottom: 0;
  background: #fff;
  padding-left: 10px;
}
```

## 伪类 vs 伪元素

| 维度 | 伪类 | 伪元素 |
| --- | --- | --- |
| 语法 | 单冒号 `:` | 双冒号 `::` |
| 作用 | 修饰已有元素状态 | 创建虚拟元素 |
| 示例 | `:hover`、`:nth-child`、`:focus`、`:checked` | `::before`、`::after`、`::first-letter`、`::placeholder` |
| 插入内容 | 不能 | 通过 `content` 可以 |

## 居中方案

水平：
- `text-align: center`（行内）
- `margin: 0 auto`（块级，需定宽）
- `display: flex; justify-content: center`

垂直：
- `line-height: height`（单行文本）
- `display: flex; align-items: center`
- `display: grid; place-items: center`

水平垂直居中（推荐 Flex / Grid）：

```css
/* 1. Flex */
.parent { display: flex; justify-content: center; align-items: center; }

/* 2. Grid */
.parent { display: grid; place-items: center; }

/* 3. 绝对定位 + transform，子元素未知尺寸 */
.child {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

/* 4. 绝对定位 + margin auto，子元素需要尺寸 */
.child {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  margin: auto;
  width: 100px; height: 100px;
}
```

## 为什么居中推荐用 transform 而不是 margin

- `margin` 改变布局属性，触发 **回流（reflow）**
- `transform` 是合成属性，只在 **合成层（composite）** 上做变换，跳过 layout 和 paint
- 移动 100 个元素时，性能差异明显

注意：`transform` 单独不会创建合成层，搭配 `will-change` 或 3D 转换（`translateZ(0)`）才会。

## transform / transition / animation 区别

| 维度 | transform | transition | animation |
| --- | --- | --- | --- |
| 类型 | 变换 | 过渡 | 动画 |
| 是否动 | 静态 | 状态变化时插值 | 主动播放 |
| 关键帧 | 无 | 起止两态 | `@keyframes` 多态 |
| 触发 | 立即 | 状态触发（hover/class 切换） | 主动 / `animation-play-state` |
| 反复 | - | - | `animation-iteration-count` |

```css
/* transition：状态切换 */
.btn { transition: all 0.3s ease; }
.btn:hover { transform: scale(1.1); }

/* animation：关键帧 */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading { animation: spin 1s linear infinite; }
```

## CSS 三角形

```css
.triangle {
  width: 0;
  height: 0;
  border: 20px solid transparent;
  border-bottom-color: #f56c6c;
}
```

四个 border 形成 4 个三角形，把其中 3 个设为透明即可。

## CSS3 新增

- 选择器：属性选择器、`:nth-child`、`:not`、`:has`
- 盒模型：`box-sizing`、`border-radius`、`box-shadow`
- 过渡 transition
- 动画 animation + `@keyframes`
- 变换 transform（2D / 3D）
- 字体 `@font-face`、`font-display`
- 背景：多背景、`background-size`、渐变 `linear-gradient`
- 媒体查询 `@media`
- 多列布局 `column-count`
- Flex / Grid
- 变量 `--var` + `var()`
- 滤镜 `filter`、`backdrop-filter`

## CSS 加载会阻塞吗

- **不阻塞 DOM 解析**：HTML 和 CSS 并行解析
- **阻塞渲染**：CSSOM 没构建完，Render Tree 无法生成
- **阻塞 JS 执行**：JS 可能读取样式，所以等 CSSOM 构建完才执行

优化：
- 关键 CSS 内联（critical CSS）
- 非关键 CSS 用 `media="print"` + `onload` 切回 all
- 用 `preload` 提前下载

## 选择器优先级

`!important` > 行内 > id > class/属性/伪类 > 标签/伪元素 > 通配符 > 继承

权重计算：行内 1000，id 100，class/属性/伪类 10，标签 1。

## CSS 性能优化

1. 避免深嵌套选择器（CSS 从右向左匹配）
2. 避免通配符 `*`
3. 减少重排：批量修改、`transform` 代替 `top/left`、`opacity` 代替 `visibility`
4. 用 `will-change` 提示浏览器创建合成层（不滥用）
5. 用 `content-visibility: auto` 跳过不可视区域渲染
6. 字体子集化 + `font-display: swap`
7. 雪碧图 / iconfont / SVG 减少请求

## 移动端 1px 问题

原因：移动端高分辨率屏（DPR=2/3），CSS 1px = 物理 2~3 像素。

方案：
1. `transform: scaleY(0.5)` 伪元素
2. `viewport` + `<meta name="viewport" content="...,initial-scale=0.5">`（不推荐，影响布局）
3. SVG 1px

```css
.border-bottom-1px {
  position: relative;
}
.border-bottom-1px::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: #ccc;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}
```

## rem / em / vw / vh

- `em`：相对父元素 font-size
- `rem`：相对根元素 `html` font-size
- `vw`：视口宽度的 1%
- `vh`：视口高度的 1%
- `dvh / svh / lvh`：动态视口高度（解决移动端浏览器工具栏导致的 100vh 跳变）

移动端适配方案：
1. rem + 动态 root font-size（淘宝 flexible.js）
2. vw 全量适配
3. postcss-pxtorem / postcss-px-to-viewport

## CSS 变量

```css
:root {
  --primary: #409eff;
  --radius: 4px;
}
.btn {
  color: var(--primary);
  border-radius: var(--radius);
}
.dark {
  --primary: #66b1ff;  /* 主题切换：覆盖变量即可 */
}
```

特性：可继承、运行时可改（JS 读写）、可参与计算（`calc(var(--x) + 10px)`）。

## requestAnimationFrame

```js
function tick(time) {
  // 在浏览器下一次重绘前调用
  doSomething();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

特性：
- 调用时机：**浏览器下次重绘前**（不是宏任务也不是微任务，是独立的渲染队列）
- 帧率自适应：通常 60fps，高刷屏可达 120fps
- 页面隐藏 / 后台时**自动暂停**（省电）
- 与刷新率同步，没有 setTimeout 的丢帧问题

应用：流畅动画、虚拟列表、分片渲染大数据。

## postcss

PostCSS = CSS 的 Babel：用 JS 插件把 CSS AST 改写后输出 CSS。

常用插件：
- `autoprefixer`：自动加浏览器前缀
- `postcss-preset-env`：使用未来 CSS 特性
- `postcss-pxtorem` / `postcss-px-to-viewport`：单位转换
- `cssnano`：压缩
- `tailwindcss`：原子化 CSS
