// 構築されたカレンダーの情報を保持する

import { JSX } from '@emotion/react/jsx-runtime';
import { create } from 'zustand'

// type CalenderState = {
//   elm: JSX.Element;
// };

type CalenderStoreState = {
  cache: Map<string, JSX.Element>;
  getCalender: (name: string) => JSX.Element | null;
  setCalender: (name: string, data: JSX.Element) => JSX.Element;
};

export const useCalender = create((set, get: () => CalenderStoreState) => ({
  cache: new Map<string, JSX.Element>(),
  getCalender: (name: string): JSX.Element | null => {
    return get().cache.get(name) || null;
  },
  setCalender: (name: string, elm: JSX.Element): JSX.Element => {
    set((prev) => ({
      cache: new Map(prev.cache).set(name, elm),
    }))
    return elm;
  }
} as CalenderStoreState))
