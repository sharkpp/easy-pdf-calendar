// 構築されたカレンダーの情報を保持する

import { JSX } from '@emotion/react/jsx-runtime';
import { create } from 'zustand'

// type CalendarState = {
//   elm: JSX.Element;
// };

type CalendarStoreState = {
  cache: Map<string, JSX.Element>;
  getCalendar: (name: string) => JSX.Element | null;
  setCalendar: (name: string, data: JSX.Element) => JSX.Element;
};

export const useCalendar = create((set, get: () => CalendarStoreState) => ({
  cache: new Map<string, JSX.Element>(),
  getCalendar: (name: string): JSX.Element | null => {
    return get().cache.get(name) || null;
  },
  setCalendar: (name: string, elm: JSX.Element): JSX.Element => {
    set((prev) => ({
      cache: new Map(prev.cache).set(name, elm),
    }))
    return elm;
  }
} as CalendarStoreState))
