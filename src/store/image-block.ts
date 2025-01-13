// イメージブロックの収納

import { create } from 'zustand'
import { CropperState } from 'react-advanced-cropper';
import { get as getIdb, set as setIdb, del as delIdb } from 'idb-keyval';

export type ImageBlockState = {
  image:             string; // 画像
  croppedImage?:     string; // 切り取られた画像
  imageUrl?:         string; // 画像のBlob URL
  croppedImageUrl?:  string; // 切り取られた画像のBlob URL
  cropState?:        CropperState; // 切り取り状態
};

type ImageBlockStoreState = {
  cache: Map<string, ImageBlockState>;
};

type ImageBlockStoreAction = {
  getImageData:  (name: string) => Promise<ImageBlockState | null>;
  saveImageData: (name: string, data: ImageBlockState | null) => Promise<ImageBlockState | null>;
};

const IDB_PREFIX = 'image-block-';

// Blob URL を Data URL から生成
async function blobUrlFromDataUrl(dataUrl: string | undefined): Promise<string> {
  console.log({dataUrl});
  return (
    dataUrl
      ? URL.createObjectURL(await (await fetch(dataUrl)).blob()).toString()
      : ''
  );
}

export const useImageBlock = create<ImageBlockStoreState & ImageBlockStoreAction>((set, get) => ({

  cache: new Map<string, ImageBlockState>(),

  getImageData: async (name: string): Promise<ImageBlockState | null> => {
    const cache = get().cache;
    let state = cache.get(name) as ImageBlockState | undefined;
    if (!state) {
      state = await getIdb(IDB_PREFIX+name);
      if (state) {
        state.imageUrl = await blobUrlFromDataUrl(state.image);
        state.croppedImageUrl = await blobUrlFromDataUrl(state.croppedImage);
        cache.set(name, state);
      }
    }
    return state || null;
  },

  saveImageData: async (name: string, state: ImageBlockState | null): Promise<ImageBlockState | null> => {
    const cache = get().cache;
    if (!state) {
      await delIdb(IDB_PREFIX+name);
      cache.delete(name);
      return null;
    }
    await setIdb(IDB_PREFIX+name, { // 項目をフィルタ
      image: state.image,
      croppedImage: state.croppedImage,
      cropState: state.cropState,
    });
    state.imageUrl = await blobUrlFromDataUrl(state.image);
    state.croppedImageUrl = await blobUrlFromDataUrl(state.croppedImage);
    cache.set(name, state);
    return state;
  },

}));
