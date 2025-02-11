// 年の選択情報を保持する

import { createSelectors } from '@/utils/zustand';
import { create } from 'zustand'

const nowJST = Date.now() + 9 * 60 * 60 * 1000;
const dateJST = new Date(nowJST);

type YearSelectStoreState = {
  year: number;
}

type YearSelectStoreAction = {
  setYearSelect: (year: number) => void;
}

export const useYearSelectBase = create<YearSelectStoreState & YearSelectStoreAction>(
  (set, _get) => ({
    year: dateJST.getUTCFullYear(),
    setYearSelect: (year: number): void => {
      set((prev) => ({
        ...prev,
        year,
      }))
    }
  })
);

export const useYearSelect = createSelectors(useYearSelectBase)
