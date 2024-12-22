// https://qiita.com/Toshimichi/items/1e23523bb270d149d00f

import jsPDF from "jspdf"
import { useCallback, useMemo } from "react"

export interface Font {
  name: string,

  install(pdf: jsPDF): Promise<void>
}

async function loadFont(path: string): Promise<ArrayBuffer | undefined> {
  try {
    if (typeof window === "undefined") return undefined
    const response = await fetch(path)
    if (!response.ok) {
      console.error(`Failed to fetch font: ${response.statusText}`)
      return undefined
    }
    return await response.arrayBuffer()
  } catch (e) {
    console.error(e)
    return undefined
  }
}

export function useFont(name: string, path: string, style?: string): Font {

  const promise = useMemo(() => loadFont(path), [ path ])
  const install = useCallback(async (pdf: jsPDF) => {
    const data = await promise
    if (!data) return
    
    const fileName = name + ".ttf"
    pdf.addFileToVFS(fileName, Buffer.from(data).toString("base64"))
    pdf.addFont(fileName, name, style ?? "normal")
  }, [ name, promise, style ])

  return useMemo(() => ({
    name,
    install,
  }), [ name, install ])
}

