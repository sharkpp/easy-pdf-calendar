// ポップアップで画像を切り取るコンポーネント

import { useState } from 'react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenChangeDetails } from '@zag-js/dialog';
import { CropperRef, Cropper } from 'react-mobile-cropper';
import 'react-mobile-cropper/dist/style.css'
import { css } from '@emotion/react';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onOpenChange: (details: OpenChangeDetails) => void;
  image: string;
  onImageChange: (image: string) => void;
}

function PopupImageCropper({
  open, onOpenChange,
  image, onImageChange,
}: PopupImageCropperProps) {

  const onChange = (cropper: CropperRef) => {
    console.log(cropper.getCoordinates(), cropper.getCanvas());
  };

  return (
    <Dialog 
      size="cover"
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        css={css`
          .chakra-dialog__body {
            height:     calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
            max-height: calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
          }
        `}
      >
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
          <Cropper
            src={image}
            onChange={onChange}
            css={css`
                /*height: 200px;*/
                max-height: 100%;
              `}
            stencilProps={{
              aspectRatio: 16/9,
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupImageCropper;
