import { sveltekit } from '@sveltejs/kit/vite';
import { configDefaults } from 'vitest/config';
import babel from 'vite-babel-plugin';
import macrosPlugin from 'vite-plugin-babel-macros';
import fs from 'fs';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { loadEnv } from 'vite';

const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf8'));
const externalPackages = ['qrcode'];
const NODE_ENV = process.env.NODE_ENV;
const dev = NODE_ENV === 'development';
const packages = Object.keys(pkg.dependencies || {}).filter((v) =>
  dev ? true : externalPackages.includes(v) === false,
);

const localEnvVars = loadEnv('', process.cwd(), '');

const devPlugins =
  dev && localEnvVars.VITE_SERVER_ADDRESS_OVERRIDE !== 'localhost' ? [basicSsl()] : [];

const enableSourceMaps = Boolean(
    localEnvVars.UPLOAD_SOURCEMAPS === 'true' &&
    localEnvVars.DATADOG_API_KEY,
);

console.log('enableSourceMaps', enableSourceMaps);

/** @type {import('vite').UserConfig} */
const config = {
  build: {
    assetsInlineLimit: 0,
    sourcemap: enableSourceMaps ? 'hidden' : false,
  },
  optimizeDeps: {
    include: [
      ...Object.keys(pkg.dependencies || {}),
      'nanoid/non-secure',
      'make-plural/plurals',
    ],
    exclude: ['@urql/svelte' ],
  },
  plugins: [
    ...devPlugins,
    babel.default(),
    macrosPlugin(),
    sveltekit(),
  ],
  // Vite seems to have some issues resolving the unpic package during local dev.
  // Manual resolving this package seems to fix it for now.
  // Will need further investigation as to why this is happening.
  resolve: {
    alias: {
      '@unpic/svelte': '/node_modules/@unpic/svelte',
    },
  },
  server: {
    fs: {
      //Allow serving files from one level up to the project root
      allow: ['./', '../'],
    },
    proxy: {}, // Workaround for the issue raised here: https://github.com/sveltejs/kit/issues/11365
    // maxSessionMemory: 1000,
  },
  ssr: dev ? { noExternal: ['svelte-markdown'], external: packages } : { noExternal: packages },
  test: {
    exclude: [
      ...configDefaults.exclude,
      'packages/template/*',
      '**/playwright/**',
      '**/cms/**',
      '**/src/games/machine/**',
    ],
  },
};

export default config;
