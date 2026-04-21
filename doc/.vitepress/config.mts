import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/glitchmao/',
  title: 'GlitchMao Docs',
  description: 'Self-hosting, API, and CLI reference for GlitchMao',
  lang: 'en-US',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Self-host', link: '/self-hosting' },
      { text: 'API', link: '/api' },
      { text: 'CLI', link: '/cli' },
    ],
    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Documentation index', link: '/' },
          { text: 'Self-hosting', link: '/self-hosting' },
          { text: 'API reference', link: '/api' },
          { text: 'CLI reference', link: '/cli' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/chatondearu/glitchmao' },
    ],
  },
})
