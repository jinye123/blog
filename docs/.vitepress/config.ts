import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '前端技术博客',
  description: 'AI 时代的前端面试与工程化指南',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: '首页', link: '/' },
      {
        text: '基础',
        items: [
          { text: 'HTML', link: '/posts/html/index' },
          { text: 'CSS', link: '/posts/css/index' },
          { text: 'JavaScript', link: '/posts/javascript/index' }
        ]
      },
      {
        text: '框架',
        items: [
          { text: 'Vue 2', link: '/posts/vue2/index' },
          { text: 'Vue 3', link: '/posts/vue3/index' },
          { text: 'React', link: '/posts/react/index' }
        ]
      },
      {
        text: '原理与网络',
        items: [
          { text: '浏览器原理', link: '/posts/browser/index' },
          { text: '计算机网络', link: '/posts/http/index' },
          { text: 'Node.js', link: '/posts/node/index' }
        ]
      },
      {
        text: '工程化',
        items: [
          { text: '基础', link: '/posts/build/index' },
          { text: 'Webpack', link: '/posts/build/webpack' },
          { text: 'Vite', link: '/posts/build/vite' },
          { text: '架构与基建', link: '/posts/build/architecture' }
        ]
      },
      {
        text: '进阶',
        items: [
          { text: '性能优化', link: '/posts/performance/index' },
          { text: '场景题', link: '/posts/scenario/index' },
          { text: 'Electron', link: '/posts/electron/index' }
        ]
      },
      {
        text: 'AI',
        items: [
          { text: '认知与定位', link: '/posts/ai/index' },
          { text: '工具链', link: '/posts/ai/tooling' },
          { text: '工程化落地', link: '/posts/ai/engineering' },
          { text: '业务应用', link: '/posts/ai/product' },
          { text: '开发方法论', link: '/posts/ai/development' },
          { text: '面试差异化', link: '/posts/ai/interview' },
          { text: '未来趋势', link: '/posts/ai/future' }
        ]
      },
      { text: '关于', link: '/about' }
    ],

    sidebar: {
      '/posts/html/': [
        {
          text: 'HTML',
          items: [{ text: 'HTML 面试题', link: '/posts/html/index' }]
        }
      ],
      '/posts/css/': [
        {
          text: 'CSS',
          items: [{ text: 'CSS 面试题', link: '/posts/css/index' }]
        }
      ],
      '/posts/javascript/': [
        {
          text: 'JavaScript',
          items: [
            { text: '基础', link: '/posts/javascript/index' },
            { text: '手写题', link: '/posts/javascript/code' },
            { text: 'ES6+', link: '/posts/javascript/es6' }
          ]
        }
      ],
      '/posts/vue2/': [
        {
          text: 'Vue 2',
          items: [{ text: '面试题', link: '/posts/vue2/index' }]
        }
      ],
      '/posts/vue3/': [
        {
          text: 'Vue 3',
          items: [{ text: '面试题', link: '/posts/vue3/index' }]
        }
      ],
      '/posts/react/': [
        {
          text: 'React',
          items: [
            { text: '基础', link: '/posts/react/index' },
            { text: '源码精读', link: '/posts/react/code' }
          ]
        }
      ],
      '/posts/browser/': [
        {
          text: '浏览器原理',
          items: [{ text: '渲染、跨域、缓存、安全', link: '/posts/browser/index' }]
        }
      ],
      '/posts/http/': [
        {
          text: '计算机网络',
          items: [{ text: 'TCP / HTTP / WebSocket', link: '/posts/http/index' }]
        }
      ],
      '/posts/node/': [
        {
          text: 'Node.js',
          items: [{ text: '运行机制与生态', link: '/posts/node/index' }]
        }
      ],
      '/posts/build/': [
        {
          text: '工程化',
          items: [
            { text: '基础', link: '/posts/build/index' },
            { text: 'Webpack', link: '/posts/build/webpack' },
            { text: 'Vite', link: '/posts/build/vite' },
            { text: '架构与基建', link: '/posts/build/architecture' }
          ]
        }
      ],
      '/posts/performance/': [
        {
          text: '性能优化',
          items: [{ text: '指标 → 加载 → 运行时 → 实战', link: '/posts/performance/index' }]
        }
      ],
      '/posts/scenario/': [
        {
          text: '场景题',
          items: [{ text: '高频场景与解决方案', link: '/posts/scenario/index' }]
        }
      ],
      '/posts/electron/': [
        {
          text: 'Electron',
          items: [{ text: '面试题', link: '/posts/electron/index' }]
        }
      ],
      '/posts/ai/': [
        {
          text: 'AI 与前端',
          items: [
            { text: '认知与定位', link: '/posts/ai/index' },
            { text: '工具链', link: '/posts/ai/tooling' },
            { text: '工程化落地', link: '/posts/ai/engineering' },
            { text: '业务产品应用', link: '/posts/ai/product' },
            { text: '开发优劣方法论', link: '/posts/ai/development' },
            { text: '面试差异化', link: '/posts/ai/interview' },
            { text: '未来与应对', link: '/posts/ai/future' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/yourusername' }],

    footer: {
      message: 'AI 时代的前端面试与工程化指南',
      copyright: 'Copyright © 2024-present'
    },

    search: { provider: 'local' },

    outline: { level: [2, 3], label: '本页目录' },

    docFooter: { prev: '上一篇', next: '下一篇' },

    lastUpdatedText: '最后更新于'
  }
})
