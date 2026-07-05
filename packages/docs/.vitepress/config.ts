import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Quarry',
  description:
    'Professional SQLite database manager with SQLCipher support and diff preview',
  base: '/quarry/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/quarry/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Quarry' }],
    [
      'meta',
      {
        name: 'og:title',
        content: 'Quarry - Professional SQLite Database Manager',
      },
    ],
    [
      'meta',
      {
        name: 'og:description',
        content:
          'Open-source database management with SQLCipher support, diff preview, and powerful query tools',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    nav: [
      { text: 'Guide', link: '/getting-started/' },
      { text: 'Features', link: '/features/' },
      { text: 'Plugins', link: '/plugin-development' },
      { text: 'Shortcuts', link: '/shortcuts' },
      {
        text: 'More',
        items: [
          { text: 'Troubleshooting', link: '/troubleshooting' },
          {
            text: 'Changelog',
            link: 'https://github.com/sunpebble/quarry/blob/main/CHANGELOG.md',
          },
          {
            text: 'Contributing',
            link: 'https://github.com/sunpebble/quarry/blob/main/CONTRIBUTING.md',
          },
        ],
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            {
              text: 'First Connection',
              link: '/getting-started/first-connection',
            },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Overview', link: '/features/' },
            { text: 'Query Editor', link: '/features/query-editor' },
            { text: 'Schema Browser', link: '/features/schema-browser' },
            { text: 'Data Editing', link: '/features/data-editing' },
            { text: 'ER Diagram', link: '/features/er-diagram' },
            { text: 'Query History', link: '/features/query-history' },
            { text: 'SQLCipher Support', link: '/features/sqlcipher' },
          ],
        },
      ],
      '/plugin': [
        {
          text: 'Plugin Development',
          items: [
            { text: 'Development Guide', link: '/plugin-development' },
            { text: 'API Reference', link: '/plugin-api' },
          ],
        },
      ],
      '/': [
        {
          text: 'Documentation',
          items: [
            { text: 'Getting Started', link: '/getting-started/' },
            { text: 'Features', link: '/features/' },
            { text: 'Plugin Development', link: '/plugin-development' },
            { text: 'Keyboard Shortcuts', link: '/shortcuts' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sunpebble/quarry' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2025-present Quarry Contributors',
    },

    editLink: {
      pattern:
        'https://github.com/sunpebble/quarry/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    lineNumbers: true,
  },

  lastUpdated: true,
});
