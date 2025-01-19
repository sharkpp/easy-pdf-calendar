// ポップアップで画像を切り取るコンポーネント

import { useEffect, useRef, useState } from 'react';
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
import { CropperState } from 'react-advanced-cropper';
import 'react-mobile-cropper/dist/style.css'
import { Check as CheckIcon, Eraser as EraserIcon, Trash2 as TrashIcon } from 'lucide-react';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  image: string;
  cropState?: CropperState;
  aspectRatio: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropApply: (croppedImage: Blob | undefined, cropState: CropperState | undefined) => void;
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
  image, cropState,
  aspectRatio,
  open, onOpenChange,
  onCropApply,
}: PopupImageCropperProps) {

  const colorMode = useColorMode().colorMode as 'dark' | 'light' | undefined;
  
  //console.log({image,cropState,aspectRatio,open})

  useEffect(() => {
    if (cropState) {
      cropperRef.current?.setState(cropState);
    }
  }, [cropState]);

  const cropperRef = useRef<CropperRef>(null);

  const onChange = (cropper: CropperRef) => {
    console.log(cropper.getCoordinates(), cropper.getCanvas());
  };

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
          ${cssColorTheme[colorMode || 'light']}
          .chakra-dialog__body {
            position: relative;
            height:     calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
            max-height: calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
          }
        `}
      >
        <DialogHeader>
          <DialogTitle>画像の切り取り</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Cropper
            ref={cropperRef}
            src={image}
            //onChange={onChange}
            css={css`
                /*height: 200px;*/
                max-height: 100%;
              `}
            stencilProps={{
              aspectRatio: aspectRatio,
            }}

// onChange={(cropper)=>console.log('onChange',{cropper,'status':cropper.getState()})}
// onUpdate={(cropper)=>console.log('onUpdate',{cropper,'status':cropper.getState()})}
// onReady={(cropper)=>console.log('onReady',{cropper,'status':cropper.getState()})}
// onError={(cropper)=>console.log('onError',{cropper,'status':cropper.getState()})}
// onTransitionsStart={(cropper)=>console.log('onTransitionsStart',{cropper,'status':cropper.getState()})}
// onTransitionsEnd={(cropper)=>console.log('onTransitionsEnd',{cropper,'status':cropper.getState()})}
// onResize={(cropper)=>console.log('onResize',{cropper,'status':cropper.getState()})}
// onResizeEnd={(cropper)=>console.log('onResizeEnd',{cropper,'status':cropper.getState()})}
// onMove={(cropper)=>console.log('onMove',{cropper,'status':cropper.getState()})}
// onMoveEnd={(cropper)=>console.log('onMoveEnd',{cropper,'status':cropper.getState()})}
// onTransformImage={(cropper)=>console.log('onTransformImage',{cropper,'status':cropper.getState()})}
// onTransformImageEnd={(cropper)=>console.log('onTransformImageEnd',{cropper,'status':cropper.getState()})}
// onInteractionStart={(cropper)=>console.log('onInteractionStart',{cropper,'status':cropper.getState()})}
// onInteractionEnd={(cropper)=>console.log('onInteractionEnd',{cropper,'status':cropper.getState()})}

            // defaultPosition={cropState?.boundary}
            // //defaultSize={cropState?.boundary}
            // defaultVisibleArea={cropState?.visibleArea || undefined}
            // defaultTransforms={cropState?.transforms}
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
                onCropApply(undefined, undefined); // 画像を削除
              }}
              variant="outline"
            >
              <TrashIcon />
            </IconButton>
            <IconButton
              aria-label="crop-end"
              onClick={() => {
                const canvas = cropperRef.current?.getCanvas();
                canvas?.toBlob((blob) => {
                  blob && onCropApply(
                      blob,
                      cropperRef.current?.getState() || undefined
                    ); // 画像を適用
                  }, 'image/jpeg', 98);
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
