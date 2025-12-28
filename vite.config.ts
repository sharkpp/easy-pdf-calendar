import { defineConfig, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { type Dirent, readdirSync, readFileSync, writeFileSync } from 'fs';
import YAML from 'yamljs';

import getHolidaysJson from './tools/update-holiday-jp';

type viteStaticCopyTargetType = {
  src: string;
  dest: string;
};
type designsIndexItemType = {
  id: string;
};
type designsResultType = {
  designsCopyList: viteStaticCopyTargetType[];
  designsIndexContent: { index: designsIndexItemType[] };
}

const HOLIDAYS_JSON_PATH = './holidays.json';
await getHolidaysJson(HOLIDAYS_JSON_PATH);

// カレンダーデザインの一覧を取得
const DESIGNS_PATH = './designs';
const DESIGNS_INDEX_JSON_PATH = DESIGNS_PATH + '/index.json';
const {
  designsCopyList,
  designsIndexContent,
}: designsResultType = 
  readdirSync(resolve(__dirname, DESIGNS_PATH), { withFileTypes: true })
    .reduce((r: designsResultType, dirent: Dirent) => {
      if (dirent.isDirectory()) {
        r.designsCopyList.push({
          src: normalizePath(resolve(__dirname, `${DESIGNS_PATH}/${dirent.name}`) + "/*.svg"),
          dest: `assets/designs/${dirent.name}`
        });
        r.designsIndexContent.index.push({
          id: dirent.name,
          ...JSON.parse(readFileSync(`${DESIGNS_PATH}/${dirent.name}/info.json`, { encoding: 'utf8' }))
        });
      }
      return r;
    }, {
      designsCopyList: [
        {
          src: normalizePath(resolve(__dirname, `${DESIGNS_PATH}/index.json`)),
          dest: 'assets/designs/'
        },
      ],
      designsIndexContent: { index: [] }
    } as designsResultType)

writeFileSync(DESIGNS_INDEX_JSON_PATH, JSON.stringify(designsIndexContent));

// フォント一覧を更新
const fontsInfo = YAML.load('./fonts/index.yaml') as any;
writeFileSync('./fonts/index.json', JSON.stringify(fontsInfo));

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
        ...(
          Object.values(fontsInfo.fonts).reduce((r: viteStaticCopyTargetType[], fontInfo: any ) => {
            // .ttf
            r.push({
              src: normalizePath(resolve(__dirname, `./fonts/**/${fontInfo.pdf.split('/').pop()}`)),
              dest: 'assets/fonts/'
            });
            // .woff, .woff2
            Array.from((fontInfo.web as string).matchAll(/".*?assets\/fonts.*?"/g))
              .forEach((m: RegExpMatchArray) => {
                const fontPath = m[0].replace(/"/g, '');
                r.push({
                  src: normalizePath(resolve(__dirname, `./fonts/**/${fontPath.split('/').pop()}`)),
                  dest: 'assets/fonts/'
                });
              });
            return r;
          }, [] as viteStaticCopyTargetType[])
        ),
        {
          src: normalizePath(resolve(__dirname, './layouts') + "/*.svg"),
          dest: 'assets/layouts'
        },
        ...designsCopyList
      ],
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
