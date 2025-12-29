import { fonts as FontInfoItems_, type FontInfoItemType } from '@/../fonts/index.json';

// 型をエクスポート
export type { FontInfoItemType } from '@/../fonts/index.json';

// 配列から .name をキーとしたマップを生成
export const FontInfoItemsMap: Record<string, FontInfoItemType> = FontInfoItems_.reduce((map, obj) => {
  map[obj.name] = obj;
  return map;
}, {} as Record<string, FontInfoItemType>);
