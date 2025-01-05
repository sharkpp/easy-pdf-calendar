// 印刷プレビュー画面

import { useMemo } from 'react';
import { css } from '@emotion/react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenChangeDetails } from '@zag-js/dialog';
import { useCalendar } from '@/store/calendar';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  design: string;
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PopupPrintPreview({
  design, year,
  open, onOpenChange,
}: PopupImageCropperProps) {

  const { getCalendar, setCalendar } = useCalendar();

  //const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  //console.log(colorMode)

  const refContener = useMemo(() => {
    return (div: HTMLDivElement | null) => {
      console.log({div})
      if (div) {
        const calendars = new Array(12).fill(0).map((_, i) => (
          getCalendar(`${design}:${year}:${i+1}`)
        ));
        console.log({calendars})
        div.replaceChildren.apply(div, calendars as Node[]);
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
          <DialogTitle>カレンダーの印刷</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
