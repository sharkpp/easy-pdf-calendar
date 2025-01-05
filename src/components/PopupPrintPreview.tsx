// 印刷プレビュー画面

import React from 'react';
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

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PopupPrintPreview({
  open, onOpenChange,
}: PopupImageCropperProps) {

  //const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  //console.log(colorMode)

  return (
    <Dialog 
      size="cover"
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
          
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
