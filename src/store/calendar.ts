// 構築されたカレンダーの情報を保持する

import { create } from 'zustand'

// type CalendarState = {
//   elm: SVGElement;
// };

type CalendarStoreState = {
  cache: Map<string, SVGElement | null>;
}

type CalendarStoreAction = {
  getCalendar: ((design: string, year: number, month: number) => SVGElement | null) |
               ((design: string) => SVGElement | null);
  setCalendar:  (design: string, yearOrElm: number | SVGElement, month?: number, elm?: SVGElement) => SVGElement | null;
}

export const useCalendar = create<CalendarStoreState & CalendarStoreAction>(
  (set, get) => ({
    cache: new Map<string, SVGElement>(),
    getCalendar: (design: string, year?: number, month?: number): SVGElement | null => {
      const elm = get().cache.get(`${design}:${year||-1}:${month||-1}:`);
      if (elm) {
        return elm.cloneNode(true) as SVGElement;
      }
      return null;
    },
    setCalendar: (design: string, yearOrElm: number | SVGElement, month?: number, elm?: SVGElement): SVGElement | null => {
      if (typeof yearOrElm === "object" && undefined === month && undefined === elm) {
        elm = yearOrElm;
        yearOrElm = -1;
      }
      set((prev) => ({
        cache: new Map(prev.cache).set(`${design}:${yearOrElm||-1}:${month||-1}:`, elm || null),
      }))
      return elm || null;
    }
  })
);

export const calendarSelector =
  (design: string, year?: number, month?: number) => 
    (state: CalendarStoreState) => state.cache.get(`${design}:${year||-1}:${month||-1}:`) ;

export const setCalendarSelector =
  () => 
    (state: CalendarStoreAction) => state.setCalendar ;
