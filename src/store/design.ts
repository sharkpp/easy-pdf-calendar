// デザインの情報を保持する

import { create } from 'zustand'

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX;

export type DesignInfoType = {
  id: string;
  name: string;
  layout: {
    orientation: "landscape" | "portrait";
    size: "A4" | "A5" | "A6" | "B6JIS" | "Postcard" | "L" | "2L";
  };
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
  options?: {
    disablePreviousMonthDate?: boolean; // 前月の日付を無効にする
    disableNextMonthDate?: boolean; // 次月の日付を無効にする
  }
}

type DesignStoreState = {
  cache: Map<string, DesignInfoType>;
}

type DesignStoreAction = {
  getDesign: (name: string) => DesignInfoType | null;
  setDesign: (name: string, designInfo: DesignInfoType) => DesignInfoType | null;
  getDesigns: () => DesignInfoType[] | [];
  setDesigns: (designsInfo: DesignInfoType[]) => DesignInfoType[] | [];
}

export const useDesign = create<DesignStoreState & DesignStoreAction>(
  (set, get) => ({
    cache: new Map<string, DesignInfoType>(),
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
        designsInfo.forEach(designInfo => {
          newCache.set(designInfo.id, designInfo)
        });
        return {
          cache: newCache,
        };
      })
      return designsInfo;
    },
  })
);

export const designSelector =
  (name: string) => 
    (state: DesignStoreAction) => state.getDesign(name)
  ;

export const designPrevSelector =
  (name: string) => 
    (state: DesignStoreAction) => state.getPrevDesignName(name)
;
export const designNextSelector =
  (name: string) => 
    (state: DesignStoreAction) => state.getNextDesignName(name)
;

export const setDesignSelector =
  (state: DesignStoreAction) => state.setDesign
  ;

export const designsSelector =
  () => 
    (state: DesignStoreAction) => state.getDesigns()
  ;

export const setDesignsSelector =
    (state: DesignStoreAction) => state.setDesign
  ;
