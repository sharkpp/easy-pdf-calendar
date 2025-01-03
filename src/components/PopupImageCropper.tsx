// ポップアップで画像を切り取るコンポーネント

import { useRef, useState } from 'react';
import { css } from '@emotion/react';
import { IconButton } from "@chakra-ui/react"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenChangeDetails } from '@zag-js/dialog';
import { useColorMode } from '@/components/ui/color-mode';
import { CropperRef, Cropper } from 'react-mobile-cropper';
//import { CropperWrapper } from 'react-advanced-cropper';
import 'react-mobile-cropper/dist/style.css'
import { Check as CheckIcon, Eraser as EraserIcon, Trash2 as TrashIcon } from 'lucide-react';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onOpenChange: (details: OpenChangeDetails) => void;
  image: string;
  onImageChange: (image: string | undefined) => void;
  aspectRatio: number;
}

const cssColorTheme = {
  dark: css`
    .rmc-cropper-wrapper {
      background-color: #333;
    }
  `,
  light: css`
    .rmc-cropper-wrapper {
      background-color: #fff;
    }
  `,
};

function PopupImageCropper({
  open, onOpenChange,
  image, onImageChange,
  aspectRatio,
}: PopupImageCropperProps) {

  const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  console.log(colorMode)

  const cropperRef = useRef<CropperRef>(null);

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
          ${cssColorTheme[colorMode || 'light']}
          .chakra-dialog__body {
            position: relative;
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
          <Cropper
            ref={cropperRef}
            src={image}
            onChange={onChange}
            css={css`
                /*height: 200px;*/
                max-height: 100%;
              `}
            stencilProps={{
              aspectRatio: aspectRatio,
            }}
          />
          <div
            css={css`
              position: absolute;
              _width: calc(100% - var(--chakra-spacing-6) * 2);
              right:  var(--chakra-spacing-6);
              bottom: var(--chakra-spacing-6);
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              gap: var(--chakra-spacing-2);
            `}
          >
            <IconButton
              aria-label="crop-reset"
              onClick={() => {
                cropperRef.current?.reset(); // 画像をリセット
              }}
              variant="outline"
            >
              <EraserIcon />
            </IconButton>
            <IconButton
              aria-label="image-drop"
              onClick={() => {
                onImageChange(undefined); // 画像を削除
              }}
              variant="outline"
            >
              <TrashIcon />
            </IconButton>
            <IconButton
              aria-label="crop-end"
              onClick={() => {
              }}
              variant="outline"
            >
              <CheckIcon />
            </IconButton>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupImageCropper;
