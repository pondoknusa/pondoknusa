import { defineConfig } from 'vitepress';
import {
  cookbookSidebar,
  guideSidebar,
  referenceSidebar,
  tutorialsSidebar,
} from './sidebar.mts';

export default defineConfig({
  title: 'Tyravel',
  description: 'TypeScript-native web framework with Laravel-style ergonomics',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#4f46e5' }],
    ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>' }],
  ],

  sitemap: {
    hostname: 'https://tyravel.dev',
  },

  markdown: {
    lineNumbers: true,
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
      { text: 'Tutorials', link: '/tutorials/', activeMatch: '/tutorials/' },
      { text: 'Cookbook', link: '/cookbook/', activeMatch: '/cookbook/' },
      {
        text: 'v0.16.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/thesimonharms/tyravel/blob/main/CHANGELOG.md' },
          { text: 'API stability', link: '/guide/api-stability' },
          { text: 'Upgrading to 1.0', link: '/guide/upgrading-to-1.0' },
          { text: 'Roadmap', link: 'https://github.com/thesimonharms/tyravel/blob/main/ROADMAP.md' },
          { text: 'GitHub', link: 'https://github.com/thesimonharms/tyravel' },
        ],
      },
    ],

    sidebar: {
      '/guide/': guideSidebar,
      '/reference/': referenceSidebar,
      '/tutorials/': tutorialsSidebar,
      '/cookbook/': cookbookSidebar,
    },

    editLink: {
      pattern: 'https://github.com/thesimonharms/tyravel/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/thesimonharms/tyravel' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Simon Harms',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },

    lastUpdated: {
      text: 'Last updated',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
  },
});