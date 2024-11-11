import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "前端技术博客",
  description: "分享前端开发技术和经验",
  lang: 'zh-CN',
  lastUpdated: true,
  
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { 
        text: '技术专题',
        items: [
          { text: 'Vue2', link: '/posts/vue2/state' },
          { text: 'Vue3', link: '/posts/vue3/state' },
          { text: 'React', link: '/posts/react/state' },
          { text: 'TypeScript', link: '/posts/typescript/base' },
          { text: 'JavaScript', link: '/posts/javascript/async' }
        ]
      },
      { text: '关于', link: '/about' }
    ],
    
    sidebar: {
      '/posts/vue2/': [
        {
          text: 'Vue 开发',
          items: [
            { text: '状态管理', link: '/posts/vue2/state' },
            { text: '组件设计', link: '/posts/vue2/components' }
          ]
        }
      ],
      '/posts/typescript/': [
        {
          text: 'TypeScript 基础',
          items: [
            { text: '基础知识', link: '/posts/typescript/base' }
          ]
        }
      ],
      '/posts/javascript/': [
        {
          text: 'JavaScript 进阶',
          items: [
            { text: '异步编程', link: '/posts/javascript/async' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername' }
    ],

    footer: {
      message: '用心写好每一篇技术文章',
      copyright: 'Copyright © 2024-present'
    }
  }
}) 