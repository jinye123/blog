---
title: AI 工具链与日常提效
description: 编码 IDE、设计稿、代码评审、文档、调试——全场景 AI 工具与最佳实践
---

# AI 工具链与日常提效

## 一、编码 IDE 对比

| 工具 | 厂商 | 模型 | 上下文 | Agent | Rules | 价格（个人） |
| --- | --- | --- | --- | --- | --- | --- |
| **Cursor** | Anysphere | Claude / GPT / Composer 等多模型 | 大窗口 + 仓库索引 | 强 | `.cursor/rules` | $20/月 |
| **GitHub Copilot** | GitHub | GPT-4 / Claude 等 | 文件级、仓库索引 | 中 | 自定义 instruction | $10/月 |
| **Windsurf** | Codeium | 自家 + 第三方 | 大窗口 | 强（Cascade） | rules 文件 | $15/月 |
| **Cody** | Sourcegraph | 多模型 | 仓库级（强项） | 中 | 自定义 | 免费 / $9 |
| **Trae** | 字节 | 自家 + 第三方 | 大窗口 | 强 | rules | 免费 |
| **Continue** | 开源 | 自带 API key | 中 | 中 | 配置文件 | 免费 |
| **Cline / Roo Code** | 开源 | 自带 API key | 大 | 强 | rules | 免费 |

### 个人选择维度

1. **模型质量**：Claude 3.5+ / GPT-4o+ / Gemini 2.5+ 是底线
2. **上下文窗口**：项目越大越要长上下文（128K+）
3. **Agent 能力**：能不能自己跑命令、改多文件、自我纠错
4. **Rules 系统**：项目规则注入是核心
5. **价格**：日用工具，每月几十美元值
6. **数据安全**：企业敏感代码慎用云端

## 二、Cursor 最佳实践

### 1. 项目规则 `.cursor/rules/`

```
.cursor/rules/
├── general.mdc       # 通用规范
├── react.mdc         # React 专用
└── api.mdc           # API 调用规范
```

`general.mdc` 示例：

```md
---
description: 项目通用规范
globs: ["**/*.{ts,tsx,vue}"]
alwaysApply: true
---

# 通用规则

- 使用 TypeScript 严格模式，禁止 any
- 函数式优先，避免 class
- 命名：camelCase 函数、PascalCase 组件、SCREAMING_SNAKE 常量
- 错误处理：业务错误返回 Result 类型，不抛
- 注释只写"为什么"，不写"做了什么"
```

### 2. 上下文工程

```
@文件          → 把单文件喂进上下文
@文件夹        → 整个目录
@Codebase     → 全仓库语义检索
@Docs         → 接入第三方文档（vue.org、tailwind 等）
@Git          → 引用提交
@web          → 实时联网搜索
```

### 3. Prompt 四件套

写 Prompt 时按这个结构：

```
[角色] 你是熟悉 Vue 3 + TypeScript 的资深前端

[任务] 帮我实现一个虚拟滚动的表格组件

[约束]
- 用 Composition API
- 支持定高和不定高两种模式
- 加 TS 类型，泛型行数据类型
- 单测覆盖关键逻辑

[输出]
- 一个 .vue 文件
- 类型定义放在文件头部
- 暴露 scrollToIndex / scrollToTop 方法
```

### 4. Agent 模式

适合：
- 跨文件改造（重命名 API、引入新规范）
- 修 bug + 自验证（跑测试）
- 探索陌生代码库

不适合：
- 简单一行修改（用 Edit 即可，省钱）
- 对结果质量要求极高的核心逻辑（让 AI 做草稿，你做主审）

### 5. 模式切换

- **Ask / Chat**：只读，问问题、解释代码
- **Edit / Inline**：精准修改选中内容
- **Agent**：自主多步操作
- **Plan**：先列方案，确认后再执行

### 6. 团队共享规则

把 `.cursor/rules/` 提交到仓库，新人 clone 即生效。规则是团队"无形资产"。

## 三、设计稿到代码

### 1. v0.dev（Vercel）

- 输入：自然语言 + 截图
- 输出：Next.js + Tailwind + shadcn/ui
- 优势：风格统一、可一键部署
- 局限：技术栈受限、复杂业务难

### 2. Figma to Code 插件

- Figma 官方 Dev Mode
- builder.io：把设计稿转成 React/Vue/Tailwind
- Locofy / Galileo AI

### 3. 截图驱动

把 UI 截图直接喂给 Cursor / Claude，让它"按这个还原"。多模态模型支持。

### 4. 实战经验

- **不要期望 100% 还原**，AI 出 80% 你改 20%
- **先定 Design Token**（颜色、间距、字体），让 AI 用你的变量而不是 hardcode
- **统一组件库**：让 AI 用 shadcn / element-plus / antd 现有组件，而不是从零写
- **响应式**：先要 PC 稿，再要移动稿，分两步生成

## 四、代码评审

### 1. Cursor Bugbot / Cline review

提交 PR 自动跑 review，捕获：
- 潜在 bug（空值、边界、类型）
- 安全问题（XSS、注入、敏感信息）
- 性能问题（重排、不必要的渲染）
- 代码风格

### 2. CodeRabbit

GitHub App，PR 自动评论：
- 文件级摘要
- 行级建议
- 测试覆盖建议
- 文档遗漏

### 3. GitHub Copilot Review

GitHub 内置，免费给开源仓库。

### 4. 自建（基于 OpenAI / Anthropic API）

```js
// GitHub Webhook → 拉 diff → 调 LLM → 评论回 PR
import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';

async function reviewPR(prNumber) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { data: diff } = await octokit.pulls.get({ owner, repo, pull_number: prNumber, mediaType: { format: 'diff' } });

  const openai = new OpenAI();
  const review = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: '你是资深前端工程师。审查 diff，按 file:line 给出问题清单。' },
      { role: 'user', content: diff }
    ]
  });

  await octokit.issues.createComment({
    owner, repo, issue_number: prNumber,
    body: review.choices[0].message.content
  });
}
```

价值：把团队规范沉淀为 Prompt，每个 PR 都过一遍。

## 五、单元测试

### 1. Codiumate（前 Codium）

- IDE 插件，选中函数一键生成测试
- 自动覆盖边界、null、空数组、异常路径
- 还能反过来：根据测试推测函数行为找 bug

### 2. Cursor 生成

```
@selection 给这个函数写完整的单测，用 vitest，覆盖：
- 正常情况
- 空输入
- 异常路径
- 边界值
- 类型校验
```

### 3. AST 驱动批量生成

```js
// 用 ts-morph 提取函数签名
// 喂给 LLM 生成测试
// 写入 __tests__/ 目录
```

我见过的真实收益：单测覆盖率 40% → 75%，开发只花了原来 1/3 的时间。

## 六、知识与文档

### 1. Notion AI / Mem / Obsidian + Copilot

- 写文档：根据要点扩写
- 总结会议纪要
- 跨笔记搜索（语义）

### 2. 文档站智能问答

把团队文档 + 代码注释 → embedding → 向量库 → 提供问答接口。

新人 onboarding 时不再问 100 个"在哪个仓库"的问题。

## 七、API 调试

- **Apidog AI**：自然语言生成接口请求、Mock 数据
- **Postman AI**：测试用例自动生成
- **Insomnia + plugin**

## 八、CLI 与命令行

- **GitHub Copilot CLI**：`ghcs "找出本月 commit 最多的文件"`
- **Aider**：终端版 Cursor，git 友好
- **Shell-GPT**：终端里直接问

## 九、调试与排错

- **Sentry AI**：错误自动归因
- **Chrome DevTools AI**：Performance 面板里直接问"为什么这帧慢"
- **错误堆栈 → Cursor**：粘到 chat，AI 帮你分析

## 十、典型一天的 AI 使用

```
9:00  早会前看群消息 + 邮件（无 AI）
9:30  接需求 → 在 Cursor 里描述需求 → Plan 模式列方案
10:00 评审方案 → Edit 模式生成关键代码骨架 + TS 类型
11:00 接口对接 → Cursor 生成 API client + zod schema
14:00 复杂逻辑手写（AI 做副驾驶，自己开车）
15:00 跑测试 → AI 修失败 case
16:00 PR 提交 → CodeRabbit 自动 review → 改建议
17:00 写文档 → Notion AI 扩写要点
18:00 月度复盘 → ChatGPT 帮你总结成 PPT
```

效率提升大头：第 9~12 步与第 16~17 步。

## 十一、避坑

1. **不要无脑接受 AI 代码**：每行都要懂
2. **关键模块自己写 + AI 辅助**：别让 AI 决定核心架构
3. **大文件分块改**：避免上下文截断
4. **私密代码慎用云端**：用企业版 / 本地模型
5. **不要让 AI 当唯一决策者**：人是终审
6. **沉淀 Prompt**：好 Prompt 是团队资产
7. **关注新工具**：每月看一次，每季换一次

下一篇：[AI 在前端工程化中的落地](./engineering.md)。
