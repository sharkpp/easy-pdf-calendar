// 内閣府の「国民の祝日」についてからJSONを生成
// Mapで利用できるように [ [ key, value ], ... ] の形式にする
'use strict'

import iconv from 'iconv-lite';
import fs from 'node:fs/promises';
import https from 'node:https';
import { fileURLToPath } from 'url';

// https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
const CSV_URL = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';

async function https_get(url) {
  return new Promise((ok, ng) => {
    https.get(url, (res) => {
      let chunks = [], chunkLen = 0;
      res.on('data', (chunk) => {
        chunks.push(chunk);
        chunkLen += chunk.length;
      });
      res.on('end', (res) => {
        const body = Buffer.concat(chunks, chunkLen);
        ok(body);
      });
    }).on('error', (e) => {
      console.error(e);
      ng(null);
    });
  });
}

async function main(outpath) {

  let r = true;
  let output = process.stdout;

  try {

    const holidayCsvSJIS = await https_get(CSV_URL);
    const holidayCsv = iconv.decode(holidayCsvSJIS, 'sjis');

    let holidays = [];

    // CSVをSONに変換
    holidayCsv
      .replace(/[\r\n]+$/g, '')
      .split(/[\r\n]+/)
      .forEach((csvLine) => {
        const [, year, month, date, name] = /^([0-9]+)\/([0-9]+)\/([0-9]+),(.+)$/.exec(csvLine) || [];
        if (year && month && date && name) {
          holidays.push([
            `${("0000"+year).substr(-4)}/${("00"+month).substr(-2)}/${("00"+date).substr(-2)}`,
            { date:+date, name }
          ]);
        }
      })

    // 作ったJSONをファイルに書き込み
    if (outpath) {
      output = await fs.open(outpath, 'w')
    }

    await output.write(JSON.stringify(holidays));

  } catch (e) {
    console.log(e);
    r = false;
  }
  finally {
    if (output !== process.stdout) {
      await output?.close();
    }
  }
  return r;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // 直接実行
  main(process.argv[2]).then();
}

export default main;
