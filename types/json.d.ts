// 定義

declare module '@/../layouts/info.json' {
  export type LayoutSizeType = "A4" | "A5" | "A6" | "B6JIS" | "PostCard" | "L" | "2L";
  export type LayoutOrientationType = "landscape" | "portrait";
  export interface LayoutsInfoItem {
    name: string;
    orientation: LayoutOrientationType;
    size: LayoutSizeType;
    layout: null | string;
    blockNum: number;
    rotate: 0 | 90;
  }

  export type LayoutsInfoType = Record<LayoutSizeType, Record<LayoutOrientationType, Array<LayoutsInfoItem>>>;

  const value: LayoutsInfoType;
  export = value;
}

declare module '@/../fonts/index.json' {
  export interface FontInfoItemType {
    name: string;
    pdf: string;
    web: string;
  }

  export interface FontsIndexType {
    "fonts": {
      [fontName: string]: FontInfoItemType
    }
  }

  const value: FontsIndexType;
  export = value;
}