import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "前端技术博客",
  description: "分享前端开发技术和经验",
  lang: 'zh-CN',
  lastUpdated: true,
  
  markdown: {
    lineNumbers: true,
    // 配置 Markdown 解析器
    config: (md) => {
      // 可以添加更多 markdown-it 插件
    }
  },

  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { 
        text: '技术专题',
        items: [
          { text: 'Vue', link: '/posts/vue/state' },
          { text: 'JavaScript', link: '/posts/javascript/async' }
        ]
      },
      { text: '关于', link: '/about' }
    ],
    
    sidebar: {
      '/posts/vue/': [
        {
          text: 'Vue 开发指南',
          items: [
            { text: '状态管理', link: '/posts/vue/state' },
            { text: '组件设计', link: '/posts/vue/components' }
          ]
        }
      ],
      '/posts/javascript/': [
        {
          text: 'JavaScript 进阶',
          items: [
            { text: '异步编程', link: '/posts/javascript/async' },
            { text: '设计模式', link: '/posts/javascript/patterns' }
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