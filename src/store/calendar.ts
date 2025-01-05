// 構築されたカレンダーの情報を保持する

import { create } from 'zustand'

// type CalendarState = {
//   elm: SVGElement;
// };

type CalendarStoreState = {
  cache: Map<string, SVGElement>;
  getCalendar: (name: string) => SVGElement | null;
  setCalendar: (name: string, data: SVGElement) => SVGElement;
};

export const useCalendar = create((set, get: () => CalendarStoreState) => ({
  cache: new Map<string, SVGElement>(),
  getCalendar: (name: string): SVGElement | null => {
    console.log("useCalendar",Date.now(),get().cache);
    return get().cache.get(name) || null;
  },
  setCalendar: (name: string, elm: SVGElement): SVGElement => {
    set((prev) => ({
      cache: new Map(prev.cache).set(name, elm),
    }))
    return elm;
  }
} as CalendarStoreState))
