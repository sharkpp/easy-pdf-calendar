// jspdf 用のフォント読み込みフック

import jsPDF from "jspdf"
import { useCallback, useMemo } from "react"

export interface FontList {
  names: Array<string>,
  install(pdf: jsPDF): Promise<void>
}

async function loadFonts(pathList: Array<string>): Promise<Array<ArrayBuffer | undefined>> {
  try {
    if (typeof window === "undefined") return [];
    const fetchPromises = pathList.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch font: ${response.statusText}`)
        return undefined
      }
      return await response.arrayBuffer();
    });
    const buffers = await Promise.all(fetchPromises);
    return buffers;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function useFonts(fontsList: Array<{ name: string, path: string, style?: string, weight?: number | string }>): FontList {
  const promise = useMemo(() => loadFonts(fontsList.map(font => font.path)), [ fontsList ])
  const install = useCallback(async (pdf: jsPDF) => {
    const dataList = await promise
    fontsList.forEach((font, index) => {
      const data = dataList[index];
      if (!data) return;
      const fileName = font.name + ".ttf"
      pdf.addFileToVFS(fileName, Buffer.from(data).toString("base64"))
      pdf.addFont(fileName, font.name, "normal")
      pdf.addFont(fileName, font.name, "normal", 950)
    });
  }, [ promise ]);
  return useMemo(() => ({
    names: fontsList.map(font => font.name),
    install,
  }), [ fontsList, install ]);
}

