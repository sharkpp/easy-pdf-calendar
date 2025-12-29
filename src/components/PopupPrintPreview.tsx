// 印刷プレビュー画面

import { RefObject, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Printer as PrinterIcon } from 'lucide-react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import { Button, Stack, Fieldset } from "@chakra-ui/react"
import { createListCollection } from "@chakra-ui/react"
import {
  SelectContent,
  SelectItem,
  //SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"
import { Field } from "@/components/ui/field"
import { OpenChangeDetails } from '@zag-js/dialog';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { PageSize } from '@/utils/jspdf-pagesize';
import { useFonts, type FontList } from '@/hooks/jspdf-usefont';
import { PRINT_LAYOUT_BASE_PATH } from '@/common';
import { useCalendar } from '@/store/calendar';
import Spinner from '@/components/Spinner';
import PrintSizeList from '@/../layouts/info.json';
import type { LayoutsInfoType } from '@/../layouts/info.json';
import { DesignInfoType, useDesign } from '@/store/design';
import { useShallow } from 'zustand/react/shallow';
import { useOptions } from '@/store/options';
import { normalizeYearAndMonth } from '@/utils/calendar';
import { FONT_BASE_PATH } from '@/common';
import { fonts as FontInfoItems, type FontInfoItemType } from '@/../fonts/index.json';

// 印刷プレビュー画面のプロパティの型
type PopupPrintPreviewProps = {
  design: string;
  year: number;
  open: boolean;
  onClose: () => void;
}

const MONTH_LIST = new Array(12).fill(0).map((_, i: number) => i + 1);

const cssStyles = css`

/* .chakra-dialog__content */
height: 100%;
overflow: hidden;

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

// Is it possible to use HTML's .querySelector() to select by xlink attribute in an SVG?
// >> https://stackoverflow.com/questions/23034283/
const makeSelector = (id: string) => `*[*|label^="${id}"]`;

// PDF構築
async function makePdf(workId: string, calendars: (SVGElement | null)[], fonts: FontList, _designInfo: DesignInfoType, pageLayout: any, layoutSvgElm: SVGElement | null): Promise<{ workId: string, pdfContent: string }> {
  //console.log({calendars,fonts,designInfo,pageLayout,layoutSvgElm});
  const pageSizeMM = pageLayout && PageSize[pageLayout.size];
  if (!pageSizeMM) {
    return { workId, pdfContent: "" };
  }

  const isLandscape = 'landscape' === pageLayout.orientation; // 横向きか？

  // PDFドキュメントを準備
  const doc = new jsPDF({
    unit: 'mm',
    orientation: isLandscape ? 'l' : 'p',
    format: pageSizeMM,
  });

  // フォントをインストール
  await fonts.install(doc);
  for await (const fontName of fonts.names) {
    doc.setFont(fontName);
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
            x:      (layoutRect.x      * (isLandscape ? pageSizeMM[1] : pageSizeMM[0]) / pageRect.width ),
            y:      (layoutRect.y      * (isLandscape ? pageSizeMM[0] : pageSizeMM[1]) / pageRect.height),
            width:  (layoutRect.width  * (isLandscape ? pageSizeMM[1] : pageSizeMM[0]) / pageRect.width ),
            height: (layoutRect.height * (isLandscape ? pageSizeMM[0] : pageSizeMM[1]) / pageRect.height),
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
  open, onClose,
}: PopupPrintPreviewProps)
{
  const firstMonthIsApril = useOptions.use.firstMonthIsApril() || false;

  const dialogContentRef = useRef<HTMLDivElement>(null);

  const getCalendar = useCalendar.use.getCalendar();
  const [ pdfVisible, setPdfVisible ] = useState(false);

  const designInfo = useDesign(useShallow((state) => state.getDesign(design)));

  const useFontsList = Array.from([
    designInfo?.fonts.date,
    designInfo?.fonts.month,
    designInfo?.fonts.year,
    designInfo?.fonts.holiday,
  ].reduce((acc: Map<string, FontInfoItemType>, fontName: string | undefined) => {
    if (fontName && !acc.has(fontName)) {
      const fontInfoIndex = (FontInfoItems as Array<FontInfoItemType>).findIndex((fontInfo) => fontInfo.name === fontName);
      if (0 <= fontInfoIndex) {
        acc.set(fontName, FontInfoItems[fontInfoIndex]);
      }
    }
    return acc;
  }, new Map<string, FontInfoItemType>()).values());

  console.log('>>',design,useFontsList)
  //const notosans = useFont("Noto Sans Gothic", FONT_BASE_PATH + "/NotoSansJP-Medium.ttf")
  const fonts = useFonts(
    Array.from(useFontsList)
    .map((fontInfo) => ({
      name: fontInfo.name,
      path: FONT_BASE_PATH + "/" + fontInfo.pdf,
    }))
  );

  //const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  //console.log(colorMode)

  const [pageLayoutIndex, setPageLayoutIndex] = useState<number[]>([0]);

  const printSizeList = useMemo(() => {
    if (!designInfo) {
      return [];
    }
    // PrintSizeList is loaded from JSON and has dynamic keys; cast to an indexable type to satisfy TypeScript
    return (PrintSizeList as LayoutsInfoType)[designInfo.layout.size][designInfo.layout.orientation];
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

  const contenerRef = useMemo(() => {
    return (div: HTMLDivElement | null) => {
      if (div) {
        const calendars = new Array(12).fill(0).map((_, i) => {
          const { year: yearR, month: monthR } = normalizeYearAndMonth(year, i+1, firstMonthIsApril);
          return getCalendar(design, yearR, monthR);
        });
        //console.log({calendars})
        div.replaceChildren.apply(div, calendars as Node[]);
      }
    };
  }, [firstMonthIsApril]);

  const [layoutSvgElm, setLayoutSvgElm] = useState<SVGElement | null>(null);
  const makePdfWorkRef = useRef<{ [key: string]: boolean }>({});

  const pdfRef = useMemo(() => (iframe: HTMLIFrameElement | null) => {
    if (iframe) {
      if (designInfo) {
        // 並行して処理が走る場合があるので最後の処理のみを利用できるようにフラグをつける
        const workId = Date.now().toString(36) + Math.random().toString(36);
        makePdfWorkRef.current =
          Object.keys(makePdfWorkRef.current)
          .reduce((r: { [key: string]: boolean }, key) => {
            r[key] = false;
            return r;
          }, {});
        makePdfWorkRef.current[workId] = true;
        // PDF作成
        setPdfVisible(false);
        makePdf(
          workId,
          // カレンダーのSVGを取得
          MONTH_LIST.map(month => {
            const { year: yearR, month: monthR } = normalizeYearAndMonth(year, month, firstMonthIsApril);
            return getCalendar(design, yearR, monthR)
          }),
          fonts,
          designInfo,
          pageLayout, layoutSvgElm
        ).then(({ workId, pdfContent }) => {
          if (makePdfWorkRef.current[workId]) {
            iframe.src = pdfContent;
            setPdfVisible(true);
          }
          delete makePdfWorkRef.current[workId];
        })
      }
    }
  }, [pageLayout, designInfo, layoutSvgElm, firstMonthIsApril]);

  const layoutRef = useMemo(() => (div: HTMLDivElement | null) => {
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
      onOpenChange={(details: OpenChangeDetails) => !details.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        css={cssStyles}
        ref={dialogContentRef}
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
                    // @ts-ignore なんか定義がおかしい？ string[] を要求しているが実際には number[] が返ってくる...
                    value={pageLayoutIndex}
                    // @ts-ignore なんか定義がおかしい？サンプル通りにやっても数値の配列で返ってくる...
                    onValueChange={(e) => setPageLayoutIndex(e.value)}
                  >
                  <SelectTrigger>
                    <SelectValueText placeholder="印刷サイズを選択してください" />
                  </SelectTrigger>
                  <SelectContent portalRef={dialogContentRef.current ? dialogContentRef as RefObject<HTMLElement> : undefined}>
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
              ref={pdfRef}
              css={css`
                visibility: ${pdfVisible?'visible':'hidden'};
              `}
            />

            <div // svgからPDFへのレンダリング用
              className="svg-pdf-temp"
              ref={contenerRef}
            />

            <div // svgからPDFへのレンダリング用
              className="svg-layout-temp"
              ref={layoutRef}
            ><svg/></div>

          </div>

          <DialogActionTrigger asChild>
            <Button type="submit" alignSelf="stretch">閉じる</Button>
          </DialogActionTrigger>

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
