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
import { CropperRef, Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  key: string;
  open: boolean;
  onOpenChange: (details: OpenChangeDetails) => void;
  image: string;
  onImageChange: (image: string) => void;
}

function PopupImageCropper({
  key,
  open, onOpenChange,
  image, onImageChange,
}: PopupImageCropperProps) {

  const onChange = (cropper: CropperRef) => {
    console.log(cropper.getCoordinates(), cropper.getCanvas());
  };

    return (
    <Dialog 
      key={key}
      size="cover"
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent>
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
            className={'cropper'}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupImageCropper;
