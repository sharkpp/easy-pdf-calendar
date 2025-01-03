// イメージブロックの収納

import { create } from 'zustand'
import { CropperState } from 'react-advanced-cropper';
import { get as getIdb, set as setIdb, del as delIdb } from 'idb-keyval';

export type ImageBlockState = {
  image: string;
  croppedImage?: string;
  cropState?: CropperState;
};

type ImageBlockStoreState = {
  cache: Map<string, ImageBlockState>;
  getImageData: (name: string) => Promise<ImageBlockState | null>;
  saveImageData: (name: string, data: ImageBlockState | null) => Promise<ImageBlockState | null>;
};

const IDB_PREFIX = 'image-block-';

export const useImageBlock = create((set, get: () => ImageBlockStoreState) => ({

  cache: new Map<string, ImageBlockState>(),

  getImageData: async (name: string): Promise<ImageBlockState | null> => {
    let state = get().cache.get(name) as ImageBlockState | undefined;
    if (!state) {
      state = await getIdb(IDB_PREFIX+name);
    }
    return state || null;
  },

  saveImageData: async (name: string, data: ImageBlockState | null): Promise<ImageBlockState | null> => {
    if (!data) {
      await delIdb(IDB_PREFIX+name);
      get().cache.delete(name);
      return null;
    }
    await setIdb(IDB_PREFIX+name, data);
    get().cache.set(name, data);
    return data;
  },

} as ImageBlockStoreState))
