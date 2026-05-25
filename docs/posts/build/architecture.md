---
title: 前端架构与基建
description: 脚手架、微前端、组件库、监控平台、CI/CD、规范治理
---

# 前端架构与基建

> 面试中的"工程化深入"，体现的是**架构师视角**而非"用过 webpack"。

## 一、脚手架建设

### 价值
- 团队规范一次性固化（目录结构、lint、CI、文档）
- 新人上手 30 分钟内跑起来
- 升级时统一推送

### 技术选型

```
commander  → 命令行解析
inquirer   → 交互式提问
ora        → 终端 loading
chalk      → 彩色输出
fs-extra   → 文件操作增强
download-git-repo / degit → 模板拉取
execa      → 子进程执行
```

### 简易实现

```js
#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import degit from 'degit';

const program = new Command();

program
  .command('create <name>')
  .description('创建项目')
  .action(async (name) => {
    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: '选择模板',
        choices: ['vue3-ts', 'react-ts', 'nest-api']
      }
    ]);
    await degit(`org/templates/${template}`).clone(name);
    console.log(`已创建 ${name}`);
  });

program.parse();
```

### 模板治理

- 模板独立仓库 `templates/`（vue3-ts、react-ts、admin-ts）
- 半年更新一次基础依赖
- 内置：eslint / prettier / commitlint / husky / vitest / CI 模板
- 团队规范进模板（命名、目录、错误监控接入、埋点）

---

## 二、微前端

### 应用场景
- 历史巨石应用渐进升级
- 多团队独立交付、独立发布
- 技术栈共存（Vue 2 + React 等）

### 主流方案

| 方案 | 厂商 | 沙箱 | 通信 | 特点 |
| --- | --- | --- | --- | --- |
| **qiankun** | 蚂蚁 | Proxy / 快照 | 全局变量 / props | 老牌，single-spa 上层 |
| **wujie** | 腾讯 | iframe + WebComponent | postMessage / props | 隔离最彻底，性能好 |
| **micro-app** | 京东 | ShadowDOM + iframe(JS) | CustomEvent / data | 像 webComponent 一样接入 |
| Module Federation | webpack | - | 运行时共享 | 构建工具方案 |
| iframe（原始） | - | iframe | postMessage | 兼容性最好，体验最差 |

### qiankun 工作原理（简化）

```
1. 主应用注册子应用 {name, entry, container, activeRule}
2. 用户访问路由，匹配 activeRule
3. import-html-entry 拉子应用 HTML
4. 解析 HTML，分离 CSS / JS / template
5. 创建沙箱（Proxy window）
6. 在沙箱内执行子应用 JS
7. 找子应用 export 的 lifecycle（bootstrap / mount / unmount）
8. 调 mount(container, props)
9. 切走时调 unmount + 沙箱回收
```

### JS 沙箱方案

| 方案 | 原理 | 特点 |
| --- | --- | --- |
| 快照沙箱 | 进入前快照 window，离开恢复 | 单实例，IE 兼容 |
| Proxy 沙箱 | 每个子应用一个 Proxy(window) | 多实例 |
| iframe 沙箱 | 真正的 window 隔离 | 最彻底，与父通信用 postMessage |

### CSS 隔离

- **CSS Modules / scoped CSS**：构建时加唯一 hash
- **命名空间前缀**：BEM / 加 `app-vue__` 前缀
- **Shadow DOM**：原生隔离（wujie / micro-app）
- **postcss-prefix-selector**：自动加前缀

### 通信

```js
// qiankun 全局 store
import { initGlobalState } from 'qiankun';
const actions = initGlobalState({ user: null });
actions.setGlobalState({ user: { id: 1 } });
actions.onGlobalStateChange((state) => console.log(state));

// 或通过 props
registerMicroApps([{ name, entry, container, activeRule, props: { auth } }]);
```

### 微前端的坑
- 公共依赖重复打包（用 externals + 主应用提供）
- CSS 全局污染（弹窗 portal 容易出问题）
- 路由冲突（hash vs history）
- 性能：子应用首次加载慢
- 内存泄漏：unmount 时清理不彻底

---

## 三、组件库建设

### 目录结构（推荐 monorepo）

```
my-ui/
├── packages/
│   ├── components/       # 组件源码
│   ├── theme-chalk/      # 主题样式
│   ├── utils/            # 工具
│   ├── hooks/            # composable / hook
│   ├── icons/            # 图标
│   └── docs/             # 文档站
├── playground/           # 调试沙盒
├── scripts/              # 构建脚本
├── .changeset/           # 版本管理
└── pnpm-workspace.yaml
```

### 设计 Token

```scss
// 颜色
$primary: #3b82f6;
$success: #10b981;
$danger: #ef4444;

// 圆角
$radius-sm: 4px;
$radius-md: 6px;

// 间距
$space-1: 4px;
$space-2: 8px;
```

CSS 变量化（运行时切主题）：

```css
:root {
  --color-primary: #3b82f6;
  --radius-md: 6px;
}
[data-theme='dark'] {
  --color-primary: #60a5fa;
}
```

### 组件 API 设计原则
1. **属性命名一致**：v-model / modelValue / value
2. **受控 / 非受控双支持**
3. **slot 灵活但少**：常见结构暴露 named slot
4. **事件统一**：`update:xxx` / `change` / `submit`
5. **国际化**：通过 ConfigProvider 注入 locale
6. **可访问性**：aria-*、键盘交互
7. **TS 类型完备**：所有 props 有泛型支持

### 文档站

- **VitePress / Storybook / Vuepress / Docus**
- 每个组件：API 表 + 多场景 demo + 源码可见
- Storybook：组件孤立调试 + 视觉回归（Chromatic）

### 测试体系

- 单测：vitest + @vue/test-utils / @testing-library/react
- 视觉回归：Chromatic / playwright-screenshot
- 类型测试：tsd / `@vue/tsc`

### 发布流程

```
开发 → changeset add → 写描述 → 提交 PR
  ↓
合并主分支 → release CI → changeset version → 自动提交版本变更 PR
  ↓
合并版本 PR → changeset publish → npm 发布 + 打 tag
```

`.changeset/config.json`：

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@org/*"]],
  "access": "public",
  "baseBranch": "main"
}
```

---

## 四、错误监控平台

### 错误类型

| 类型 | 捕获方式 |
| --- | --- |
| JS 同步错误 | `window.onerror` |
| Promise rejection | `window.onunhandledrejection` |
| 资源加载错误 | `window.addEventListener('error', fn, true)` |
| 接口错误 | axios 拦截器 / fetch 包装 |
| Vue 错误 | `app.config.errorHandler` |
| React 错误 | Error Boundary + `componentDidCatch` |
| 跨域脚本错误 | `<script crossorigin>` + 服务器 `Access-Control-Allow-Origin` |

### 实现示例

```js
class Reporter {
  constructor({ dsn, app }) {
    this.dsn = dsn;
    this.app = app;
    this.queue = [];
    this.bind();
    this.flushOnVisibilityChange();
  }

  bind() {
    window.addEventListener('error', (e) => {
      if (e.target !== window) {
        // 资源错误
        this.report({ type: 'resource', src: e.target.src || e.target.href, msg: e.message });
      } else {
        this.report({ type: 'js', msg: e.message, stack: e.error?.stack, lineno: e.lineno, colno: e.colno });
      }
    }, true);

    window.addEventListener('unhandledrejection', (e) => {
      this.report({ type: 'promise', msg: e.reason?.message, stack: e.reason?.stack });
    });
  }

  report(data) {
    this.queue.push({ ...data, app: this.app, ts: Date.now(), ua: navigator.userAgent, url: location.href });
    if (this.queue.length >= 10) this.flush();
  }

  flush() {
    if (!this.queue.length) return;
    navigator.sendBeacon(this.dsn, JSON.stringify(this.queue));
    this.queue = [];
  }

  flushOnVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }
}

new Reporter({ dsn: '/api/log', app: 'web-admin' });
```

### sourcemap 还原

线上代码压缩混淆，错误堆栈无法定位。方案：
- 构建时上传 sourcemap 到内部监控服务（**不要上传到 CDN**）
- 监控平台收到错误后用 sourcemap 还原行列号
- 工具：`source-map` 包 / `node-sourcemap-cli`

### 行为面包屑

记录用户错误前 N 步操作（点击、路由、接口），帮助复现：

```js
const breadcrumbs = [];
function track(event) {
  breadcrumbs.push({ ...event, ts: Date.now() });
  if (breadcrumbs.length > 30) breadcrumbs.shift();
}
// 上报时附带
```

---

## 五、性能监控平台

### 采集指标

```js
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
onLCP(report);
onINP(report);
onCLS(report);
onFCP(report);
onTTFB(report);
```

接口性能：

```js
axios.interceptors.request.use((config) => {
  config.metadata = { start: Date.now() };
  return config;
});
axios.interceptors.response.use(
  (res) => {
    report({ type: 'api', url: res.config.url, duration: Date.now() - res.config.metadata.start, status: res.status });
    return res;
  },
  (err) => { /* 错误同上报 */ throw err; }
);
```

### 慢请求分位数

监控 P50 / P75 / P95 / P99 而不是平均值（平均被极端值带偏）。

---

## 六、CI/CD

### GitHub Actions 模板

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm build
      - name: Bundle size check
        run: pnpm size-limit
```

### 部署策略

| 策略 | 描述 |
| --- | --- |
| 蓝绿部署 | 两个完整环境切流 |
| 金丝雀 | 先放一小部分流量到新版 |
| 灰度发布 | 按用户标签 / 地理 / 比例放量 |
| 滚动更新 | 一台一台替换（k8s） |

前端常见做法：
- HTML 缓存 no-cache，每次拉新版
- JS/CSS 用 hash 文件名，长缓存
- 多入口 + nginx 按 cookie 路由（灰度）

### 包大小预警

```js
// size-limit.config.js
module.exports = [
  { path: 'dist/app.js', limit: '300KB' },
  { path: 'dist/vendor.js', limit: '500KB' }
];
```

CI 中包大小超阈值直接 fail。

---

## 七、规范治理

### Git Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["stylelint --fix", "prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm exec lint-staged

# .husky/commit-msg
pnpm exec commitlint --edit $1
```

### commitlint

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci']],
    'subject-max-length': [2, 'always', 72]
  }
};
```

提交规范：

```
feat(login): 新增微信扫码登录
^----^^-----^  ^------------^
type  scope    subject

body（可选）

footer（可选，如 BREAKING CHANGE / Closes #1）
```

### ESLint 自定义规则

落地团队约定，例如禁止使用 console.log：

```js
// eslint-plugin-internal/rules/no-console.js
module.exports = {
  meta: { type: 'problem' },
  create(context) {
    return {
      'MemberExpression[object.name="console"]'(node) {
        context.report({ node, message: '生产代码禁止 console' });
      }
    };
  }
};
```

### 自动 changelog

`conventional-changelog` / `changesets` 根据 commit 生成 changelog。

---

## 八、Monorepo 实战

### Turborepo 配置

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": { "dependsOn": ["build"] },
    "lint": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

收益：
- 依赖图自动编排
- 任务级缓存（输入不变跳过执行）
- 远程缓存（团队共享）
- 影响范围分析（只测改动的包）

### Nx 关键能力

- 项目图谱（依赖可视化）
- 自动迁移（migration generator）
- 影响分析：`nx affected:test`
- 模块边界约束（ESLint plugin）

---

## 九、面试话术建议

讲项目时按这个套路：

```
痛点是什么？
我设计了什么？
解决了什么问题？
有什么收益数据？
还能怎么演进？
```

> 例：
> "团队 5 个产品都各自维护一份组件库代码，UI 更新经常不同步。我牵头做了 monorepo + changeset + 设计 token 的组件库基建，把 5 套合并为 1 套，新人接入从 2 天降到 2 小时，组件 bug 修复后所有产品 1 天内同步。"
