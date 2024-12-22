import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';
import { normalizePath } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react({
      jsxImportSource: '@emotion/react',
    }),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        // {
        //   src: "../fonts/*",
        //   dest: "dist/assets/fonts",
        // },
        {
          src: normalizePath(resolve(__dirname, './fonts') + "/*.ttf"),
          dest: 'assets/fonts'
        }
      ],
    }),
  ],
})
