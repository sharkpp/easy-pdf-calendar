// 印刷プレビュー画面

import { useMemo, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Printer as PrinterIcon } from 'lucide-react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Stack, Fieldset } from "@chakra-ui/react"
import { createListCollection } from "@chakra-ui/react"
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"
import { Field } from "@/components/ui/field"
import { OpenChangeDetails } from '@zag-js/dialog';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { PageSize } from '@/utils/jspdf-pagesize';
import { useFont, Font } from '@/hooks/jspdf-usefont';
import { PRINT_LAYOUT_BASE_PATH } from '@/common';
import { useCalendar } from '@/store/calendar';
import Spinner from '@/components/Spinner';
import PrintSizeList from '@/../layouts/info.json';
//import type { LayoutsInfoItem } from '@/../layouts/info.json';
import { DesignInfoType, designSelector, useDesign } from '@/store/design';
import { useShallow } from 'zustand/react/shallow';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  design: string;
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_LIST = new Array(12).fill(0).map((_, i: number) => i + 1);

const cssStyles = css`

height: 100%;

.chakra-dialog__title {
  > * {
    display: inline-block;
  }
  display: flex;
  gap: 0.5rem;
}

.chakra-dialog__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chakra-dialog__body > .pdf-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;

  > .spinner-container {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  > iframe {
    width: 100%;
    flex-grow: 1;
    height: 100%;
  }

  > .svg-pdf-temp,
  > .svg-layout-temp {
    width: 0px;
    height: 0px;
    & svg {
    }
  }
}
`;


function getSVGLenByMM(n: SVGAnimatedLength) {
  const tmp = n.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
  return tmp.valueInSpecifiedUnits;
}

// Is it possible to use HTML's .querySelector() to select by xlink attribute in an SVG?
// >> https://stackoverflow.com/questions/23034283/
const makeSelector = (id: string) => `*[*|label^="${id}"]`;

// PDF構築
async function makePdf(workId: string, calendars: (SVGElement | null)[], fonts: Font[], designInfo: DesignInfoType, pageLayout: any, layoutSvgElm: SVGElement | null): Promise<{ workId: string, pdfContent: string }> {
console.log({calendars,fonts,designInfo,pageLayout,layoutSvgElm,size:PageSize[pageLayout.size]});
  const pageSizeMM = PageSize[pageLayout.size];
  if (!pageSizeMM) {
    return { workId, pdfContent: "" };
  }

  // PDFドキュメントを準備
  const doc = new jsPDF({
    unit: 'mm',
    orientation: 'landscape' === pageLayout.orientation ? 'l' : 'p',
    format: pageSizeMM,
  });

  // フォントをインストール
  for await (const font of fonts) {
    await font.install(doc);
    doc.setFont(font.name);
  }

  const pageRect = layoutSvgElm?.getBoundingClientRect();

  let layoutElmAndMetrics = [];
  for (let j = 0; j < pageLayout.blockNum; ++j) {
    const elm = layoutSvgElm?.querySelector(makeSelector('layout-'+j)) as (Element | null);
    const rect = elm&&elm.getBoundingClientRect();
    layoutElmAndMetrics.push({
      elm,
      rect: {
        x:      rect&&pageRect&&(rect.x - pageRect.x) || 0,
        y:      rect&&pageRect&&(rect.y - pageRect.y) || 0,
        width:  rect&&(rect.width)  || 0,
        height: rect&&(rect.height) || 0,
      }
    });
    //console.log(">>",elm,elm&&(elm as SVGGraphicsElement).getBBox(),elm&&elm.getBoundingClientRect(),layoutSvgElm?.parentElement);
  }

  let pageContents = [];
  for (let i = 0; i < 12;) {
    let pageContents_ = [];
    for (let j = 0; i < 12 && j < pageLayout.blockNum; ++j, ++i) {
      pageContents_.push(calendars[i]);
    }
    pageContents.push(pageContents_);
  }

  // カレンダーを取得
  let pageIndex = 1;
  for await (const pageContent of pageContents) {
    if (1 < pageIndex) { // 最初のみページを追加しない
      doc.addPage();
    }

    if (layoutSvgElm) {
      await doc.svg(
        layoutSvgElm as Element
      );
    }

    let layoutIndex = 0;
    for await (const calendarOfMonth of pageContent) {
      if (!calendarOfMonth) {
        continue;
      }
      const { rect: layoutRect } = layoutElmAndMetrics[layoutIndex];
      // SVGをPDFに変換
      if (!layoutSvgElm || !layoutRect || !pageRect) {
        await doc.svg(calendarOfMonth as Element);
      }
      else {
        await doc.svg(
          calendarOfMonth as Element, {
            x:      (layoutRect.x      * (pageSizeMM[0] / pageRect.width )),
            y:      (layoutRect.y      * (pageSizeMM[1] / pageRect.height)),
            width:  (layoutRect.width  * (pageSizeMM[0] / pageRect.width )),
            height: (layoutRect.height * (pageSizeMM[1] / pageRect.height)),
          }
        );
      }
      layoutIndex++;
    }

    pageIndex++;
  }

  return {
    workId,
    pdfContent: doc.output('bloburi').toString()
  };
}

function PopupPrintPreview({
  design, year,
  open, onOpenChange,
}: PopupImageCropperProps) {

  const { getCalendar } = useCalendar();
  const [ pdfVisible, setPdfVisible ] = useState(false);

  const notosans = useFont("Noto Sans Gothic", "/assets/fonts/NotoSansJP-Medium.ttf")
  
  //const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  //console.log(colorMode)

  const designInfo = useDesign(useShallow(designSelector(design)));

  const [pageLayoutIndex, setPageLayoutIndex] = useState<number[]>([0]);

  const printSizeList = useMemo(() => {
    if (!designInfo) {
      return [];
    }
    return PrintSizeList[designInfo.layout.size][designInfo.layout.orientation];
  }, [designInfo]);

  const pageLayoutIndexList = useMemo(() => {
    //setPageLayoutIndex([0]); // 初期選択
    return createListCollection({
      items: printSizeList.map((sizeInfo: { name: any; }, i: any) => ({
                    label: sizeInfo.name,
                    value: i,
                  }))
    });
  }, [designInfo, printSizeList]);

  const pageLayout = printSizeList[pageLayoutIndex[0]]||undefined;

//console.log({pageLayoutIndex,pageLayoutIndexList,printSizeList,pageLayout});

  const refContener = useMemo(() => {
    return (div: HTMLDivElement | null) => {
      if (div) {
        const calendars = new Array(12).fill(0).map((_, i) => (
          getCalendar(design, year, i+1)
        ));
        console.log({calendars})
        div.replaceChildren.apply(div, calendars as Node[]);
      }
    };
  }, []);

  const [layoutSvgElm, setLayoutSvgElm] = useState<SVGElement | null>(null);
  const refMakePdfWork = useRef<{ [key: string]: boolean }>({});

  const refPdf = useMemo(() => (iframe: HTMLIFrameElement | null) => {
    if (iframe) {
      if (designInfo) {
        // 並行して処理が走る場合があるので最後の処理のみを利用できるようにフラグをつける
        const workId = Date.now().toString(36) + Math.random().toString(36);
        refMakePdfWork.current =
          Object.keys(refMakePdfWork.current)
          .reduce((r: { [key: string]: boolean }, key) => {
            r[key] = false;
            return r;
          }, {});
        refMakePdfWork.current[workId] = true;
        // PDF作成
        setPdfVisible(false);
        makePdf(
          workId,
          // カレンダーのSVGを取得
          MONTH_LIST.map(month => getCalendar(design, year, month)),
          [notosans],
          designInfo,
          pageLayout, layoutSvgElm
        ).then(({ workId, pdfContent }) => {
          if (refMakePdfWork.current[workId]) {
            iframe.src = pdfContent;
            setPdfVisible(true);
          }
          delete refMakePdfWork.current[workId];
        })
      }
    }
  }, [pageLayout, designInfo, layoutSvgElm]);

  const refLayout = useMemo(() => (div: HTMLDivElement | null) => {
    if (!pageLayout.layout) {
      setLayoutSvgElm(null);
    }
    else if (div) {
      // レイアウトのSVGファイルを読み込む
      fetch(`${PRINT_LAYOUT_BASE_PATH}/${pageLayout.layout}`)
      .then((response) => response.text())
      .then((svgText) => {
        const parser = new DOMParser();
        let layoutElm_ = parser.parseFromString(svgText, "image/svg+xml").documentElement as unknown as SVGElement;
        // 不要な属性を削除
        layoutElm_.removeAttribute('id');
        //layoutElm_.removeAttribute('width');
        //layoutElm_.removeAttribute('height');
        // 更新
        div.firstElementChild?.replaceWith(layoutElm_ as Node);
        setLayoutSvgElm(layoutElm_);
      });
    }
  }, [pageLayout]);

  return (
    <Dialog 
      size="full"
      open={open}
      onOpenChange={(details: OpenChangeDetails) => onOpenChange(details.open)}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        css={cssStyles}
      >
        <DialogHeader>
          <DialogTitle>
            <PrinterIcon /> 
            カレンダーの印刷
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>

          <Fieldset.Root size="lg" maxW="md">
            <Stack>
              <Field orientation="horizontal" label="印刷サイズ">
                <SelectRoot
                    collection={pageLayoutIndexList}
                    size="sm"
                    width="320px"
                    value={pageLayoutIndex}
                    onValueChange={(e) => setPageLayoutIndex(e.value)}
                  >
                  <SelectTrigger>
                    <SelectValueText placeholder="印刷サイズを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageLayoutIndexList.items.map((printSize) => (
                      <SelectItem item={printSize} key={printSize.value}>
                        {printSize.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
            </Stack>
          </Fieldset.Root>

          <div className="pdf-preview">

            <div
              className="spinner-container"
              css={css` visibility: ${!pdfVisible?'visible':'hidden'}; `}
            >
              <Spinner />
            </div>
            
            <iframe
              ref={refPdf}
              css={css`
                visibility: ${pdfVisible?'visible':'hidden'};
              `}
            />

            <div // svgからPDFへのレンダリング用
              className="svg-pdf-temp"
              ref={refContener}
            />

            <div // svgからPDFへのレンダリング用
              className="svg-layout-temp"
              ref={refLayout}
            ><svg/></div>

          </div>

          <Button
            alignSelf="stretch"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
