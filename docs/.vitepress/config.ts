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
          { text: 'html', link: '/posts/html/index' },
          { text: 'css', link: '/posts/css/index' },
          { text: 'Vue2', link: '/posts/vue2/index' },
          { text: 'Vue3', link: '/posts/vue3/index' },
          { text: 'React', link: '/posts/react/index' },
          { text: '工程化', link: '/posts/build/index' },
          { text: 'node', link: '/posts/node/index' },
          { text: '性能优化', link: '/posts/performance/index' },
          { text: '场景题', link: '/posts/scenario/index' },
          { text: 'JavaScript', link: '/posts/javascript/index' },
          { text: 'electron', link: '/posts/electron/index' },
          { text: 'http', link: '/posts/http/index' },
        ]
      },
      { text: '关于', link: '/about' }
    ],
    
    sidebar: {
      '/posts/html/': [
        {
          text: 'html',
          items: [
            { text: 'html', link: '/posts/html/index' },
          ]
        }
      ],
      '/posts/css/': [
        {
          text: 'css',
          items: [
            { text: 'css', link: '/posts/css/index' },
          ]
        }
      ],
      '/posts/vue2/': [
        {
          text: 'vue',
          items: [
            { text: '', link: '/posts/vue2/index' },
          ]
        }
      ],
      '/posts/vue3/': [
        {
          text: 'vue',
          items: [
            { text: '', link: '/posts/vue3/index' },
          ]
        }
      ],
      '/posts/react/': [
        {
          text: 'React',
          items: [
            { text: '基础知识', link: '/posts/react/index' },
            { text: '核心源码', link: '/posts/react/code' }
          ]
        }
      ],
      '/posts/build/': [
        {
          text: '工程化',
          items: [
            { text: '基础', link: '/posts/build/index' },
            { text: 'vite', link: '/posts/build/vite' },
            { text: 'webpack', link: '/posts/build/webpack' },
          ]
        },
      ],
      '/posts/node/': [
        {
          text: 'node',
          items: [
            { text: 'node', link: '/posts/node/index' },
          ]
        }
      ],
      '/posts/performance/': [
        {
          text: '性能优化',
          items: [
            { text: '性能优化', link: '/posts/performance/index' }
          ]
        }
      ],
      '/posts/scenario/': [
        {
          text: '场景题',
          items: [
            { text: '场景题', link: '/posts/scenario/index' }
          ]
        }
      ],
      '/posts/javascript/': [
        {
          text: 'JavaScript',
          items: [
            { text: '基础', link: '/posts/javascript/index' },
            { text: '手写', link: '/posts/javascript/code' },
            { text: 'es6', link: '/posts/javascript/es6' }
          ]
        }
      ],
      '/posts/electron/': [
        {
          text: 'electron',
          items: [
            { text: '', link: '/posts/electron/index' },
          ]
        }
      ],
      '/posts/http/': [
        {
          text: 'http',
          items: [
            { text: 'http', link: '/posts/http/index' },
          ]
        }
      ],
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