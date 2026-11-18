// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://magiapix.com',
  trailingSlash: 'always',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()], tsconfig: './tsconfig.json' },
});
