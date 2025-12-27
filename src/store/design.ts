// デザインの情報を保持する

import { create } from 'zustand'
import { createSelectors } from '@/utils/zustand';

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX;

export type DesignInfoType = {
  id: string;
  name: string;
  disabled?: boolean;
  layout: {
    orientation: "landscape" | "portrait";
    size: "A4" | "A5" | "A6" | "B6JIS" | "PostCard" | "L" | "2L";
  };
  tags: string[]; // デザインのタグ
  templates: {
    month: string; // 月のテンプレートのSVGのパス
    year?: string; // 年間のテンプレートのSVGのパス
    cover?: string; // 表紙のテンプレートのSVGのパス
  };
  colors: {
    date:                 Color; // その他の日付の色

    sundayDate?:          Color; // 日曜の日付の色
    mondayDate?:          Color; // 月曜の日付の色
    tuesdayDate?:         Color; // 火曜の日付の色
    wednesdayDate?:       Color; // 水曜の日付の色
    thursdayDate?:        Color; // 木曜の日付の色
    fridayDate?:          Color; // 金曜の日付の色
    saturdayDate?:        Color; // 土曜の日付の色

    holidayDate?:         Color; // 祝日の日付の色

    previousMonthDate?:   Color; // 先月の日付の色
    nextMonthDate?:       Color; // 来月の日付の色
  };
  fonts: {
    date: string; // 日付のフォントファミリー
    month?: string; // 月のフォントファミリー
    year?: string; // 年のフォントファミリー
    holiday?: string; // 祝日のフォントファミリー
  };
  options?: {
    disablePreviousMonthDate?: boolean; // 前月の日付を無効にする
    disableNextMonthDate?: boolean; // 次月の日付を無効にする
  };
}

type DesignStoreState = {
  cache: Map<string, DesignInfoType>;
  tags: Map<string, Set<string>>; // tag -> Set<design id>
}

type DesignStoreAction = {
  getDesign: (name: string) => DesignInfoType | null;
  setDesign: (name: string, designInfo: DesignInfoType) => DesignInfoType | null;
  getDesigns: () => DesignInfoType[] | [];
  setDesigns: (designsInfo: DesignInfoType[]) => DesignInfoType[] | [];
  getPrevDesignName: (name: string) => string | null;
  getNextDesignName: (name: string) => string | null;
  getTags: () => string[];
  getDesginNamesByTags: (tags: string[]) => string[];
}

const useDesignBase = create<DesignStoreState & DesignStoreAction>(
  (set, get) => ({
    cache: new Map<string, DesignInfoType>(),
    tags: new Map<string, Set<string>>(),
    getDesign: (name: string): DesignInfoType | null => {
      return get().cache.get(name) || null;
    },
    setDesign: (name: string, designInfo: DesignInfoType): DesignInfoType | null => {
      set((prev) => ({
        cache: new Map(prev.cache).set(name, designInfo),
      }))
      return designInfo || null;
    },
    getPrevDesignName: (name: string): string | null => {
      const keys = Array.from(get().cache.keys());
      const found = keys.findIndex((k) => k === name);
      if (undefined === found) {
        return null;
      }
      return keys[(found + keys.length - 1) % keys.length];
    },
    getNextDesignName: (name: string): string | null => {
      const keys = Array.from(get().cache.keys());
      const found = keys.findIndex((k) => k === name);
      if (undefined === found) {
        return null;
      }
      return keys[(found + 1) % keys.length];
    },
    getDesigns: (): DesignInfoType[] | [] => {
      return Array.from(get().cache).map(a => a[1]);
    },
    setDesigns: (designsInfo: DesignInfoType[]): DesignInfoType[] | [] => {
      set((prev) => {
        const newCache = new Map(prev.cache);
        const newTags = new Map(prev.tags);
        designsInfo.forEach(designInfo => {
          newCache.set(designInfo.id, designInfo);
          designInfo.tags.forEach(tag => {
            if (!newTags.has(tag)) {
              newTags.set(tag, new Set<string>());
            }
            newTags.get(tag)?.add(designInfo.id);
          });
        });
        return {
          cache: newCache,
          tags: newTags,
        };
      })
      return designsInfo;
    },
    getTags: (): string[] => {
      return Array.from(get().tags.keys());
    },
    getDesginNamesByTags: (tags: string[]): string[] => {
      // 全てのタグを含むデザインIDを取得
      const designIdSets = tags.map(tag => get().tags.get(tag) || new Set<string>());
      if (designIdSets.length === 0) {
        return [];
      }
      const intersection = designIdSets.reduce((acc, set) => {
        return new Set([...acc].filter(x => set.has(x)));
      });
      return Array.from(intersection);
    },
  })
);

export const useDesign = createSelectors(useDesignBase);
