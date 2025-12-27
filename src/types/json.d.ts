// 定義

declare module '*/layouts/info.json' {
  export interface LayoutsInfoItem {
    name: string;
    orientation: "landscape" | "portrait";
    size: "A4" | "A5" | "A6" | "B6JIS" | "PostCard" | "L" | "2L";
    layout: null | string;
    blockNum: number;
    rotate: 0 | 90;
  }

  interface LayoutsInfoType {
    ["A4" | "A5" | "A6" | "B6JIS" | "PostCard" | "L" | "2L"]: {
      ["landscape" | "portrait"]: LayoutsInfoItem
    }
  }

  const value: LayoutsInfoType;
  export = value;
}

declare module '*/fonts/index.json' {
  export interface FontInfoItemType {
    name: string;
    pdf: Array<string>;
    web: string;
  }

  interface FontsIndexType {
    "fonts": {
      [fontName: string | undefiend]: FontInfoItemType
    }
  }

  const value: FontsIndexType;
  export = value;
}