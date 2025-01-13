// 印刷プレビュー画面

import { useMemo, useState } from 'react';
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
import { Button } from "@chakra-ui/react"
import { OpenChangeDetails } from '@zag-js/dialog';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { PageSize } from '@/utils/jspdf-pagesize';
import { useFont } from '@/hooks/jspdf-usefont';
import { useCalendar } from '@/store/calendar';
import Spinner from '@/components/Spinner';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  design: string;
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MS24H = 24 * 60 * 60 * 1000;

const MONTH_LIST = new Array(12).fill(0).map((_, i: number) => i + 1);

function getSVGLenByMM(n: SVGAnimatedLength) {
  const tmp = n.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
  return tmp.valueInSpecifiedUnits;
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

  const refPdf = useMemo(() => {
    return (iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        // PDF構築
        async function makePdf() {
          // PDFドキュメントを準備
          const doc = new jsPDF({
            orientation: 'l',
            format: PageSize.B6JIS
          });
          // フォントをインストール
          await notosans.install(doc);
          doc.setFont(notosans.name);
          // カレンダーを取得
          let calendarOfMonth;
          for await (const month of MONTH_LIST) {
            if (1 < month) { // 最初の月のみページを追加しない
              doc.addPage(PageSize.B6JIS, 'l');
            }
            // カレンダーのSVGを取得
            calendarOfMonth = getCalendar(design, year, month);console.log({calendarOfMonth})
            // SVGをPDFに変換
            if (calendarOfMonth) {
              await doc.svg(calendarOfMonth as Element);
            }
          }
  
          if (iframe) {
            iframe.src = doc.output('bloburi').toString();
            setPdfVisible(true);
          }
        }
        makePdf();
      }
    };
  }, []);

  return (
    <Dialog 
      size="full"
      open={open}
      onOpenChange={(details: OpenChangeDetails) => onOpenChange(details.open)}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        css={css`
          .chakra-dialog__body {
            position: relative;
            height:     calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
            max-height: calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
          }
        `}
      >
        <DialogHeader>
          <DialogTitle
            css={css`
              > * {
                display: inline-block;
              }
                display: flex;
                gap: 0.5rem;
            `}>
            <PrinterIcon /> 
            カレンダーの印刷
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody
          css={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
            & > iframe {
              flex-grow: 1;
              width: 100%;
              height: 100%;
            }
          `}
        >

          <div
            css={css`
              visibility: ${!pdfVisible?'visible':'hidden'};
              position: absolute;
              top: var(--chakra-spacing-2);
              left: 0px;
              width: 100%;
              height: calc(100% - var(--chakra-sizes-10) - var(--chakra-spacing-2) * 2 - 1rem * 2);
              display: flex;
              justify-content: space-evenly;
              align-items: center;
            `}
          >
            <Spinner />
          </div>
          
          <iframe
            ref={refPdf}
            css={css`
              visibility: ${pdfVisible?'visible':'hidden'};
            `}
          />

          <div
            ref={refContener}
            css={css`
                display: flex;
                display: none;
                & svg {
                  width: 320px;
                }
              `}
          />

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
