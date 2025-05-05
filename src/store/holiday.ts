// 祝日・休日を保持する

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSelectors } from '@/utils/zustand';
import { createSuperJSONStorage } from '@/utils/zustand-middleware-superjson-storage';
import holidaysJSON from '../../holidays.json'

export type HolidayInfoType = {
  date: number;
  name: string;
  mark?: string;
};

export type HolidayInfoListType = Map<string, HolidayInfoType>;

export type HolidaysItemType = {
  holiday?: string;
  anniversary?: string;
  mark?: string;
};
export type HolidaysItemType_ = string;
export type HolidaysType = [undefined, ...HolidaysItemType[]] & { length: 32 };

type HolidaysJpFileType = [ string, HolidayInfoType ][];

type HolidayStoreState = {
  holidays: HolidayInfoListType;
  anniversarys: HolidayInfoListType;
};

type HolidayStoreAction = {
  getHolidays: (year: number, month: number, OnlyStatutoryHolidays?: boolean) => HolidaysType;
  getAnniversarys: () => HolidayInfoListType;
  setAnniversarys: (holidays: HolidayInfoListType) => void;
};

const cache = new Map();
function memo(value: any) {
  const cacheKey = JSON.stringify(value,(_key, value) => {
    if (value && value.constructor && value.constructor.name === "Map") {
      return Array.from(value);
    }
    return value;
  });
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  cache.set(cacheKey, value);
  return value;
}

const useHolidayBase = create(
  persist(
    (set, get: () => HolidayStoreState & HolidayStoreAction) => ({
      holidays: new Map<string, HolidayInfoType>(holidaysJSON as HolidaysJpFileType),
      anniversarys: new Map<string, HolidayInfoType>(),
      getHolidays: (year: number, month: number, holidaysOnly?: boolean): HolidaysType => {
        const selector = `${("0000"+year).substr(-4)}/${("00"+month).substr(-2)}/`;
        return memo(
          ([] as [string, HolidayInfoType][]).concat(
            // 国民の祝日
            Array.from((Map.groupBy(get().holidays, (holiday) =>
              0 == holiday[0].indexOf(selector) ? true : false,
            ).get(true) || []) as [string, HolidayInfoType][]),
            // ユーザーの記念日
            holidaysOnly ? [] : Array.from((Map.groupBy(get().anniversarys, (holiday) =>
              0 == holiday[0].indexOf(selector) ? true : false,
            ).get(true) || []) as [string, HolidayInfoType][])
          )
          .reduce((r: HolidaysType, item: [string, HolidayInfoType]) => {
            const key = item[1].date;
            if (!r[key]) {
              r[key] = {};
            }
            if (item[1].mark) {
              r[key].anniversary = item[1].name;
              r[key].mark = item[1].mark;
            }
            else {
              r[key].holiday = item[1].name;
            }
            return r;
          }, [] as unknown as HolidaysType)
        );
      },
      getAnniversarys: (): HolidayInfoListType => {
        return get().anniversarys;
      },
      setAnniversarys: (holidays: HolidayInfoListType): void => {
        const state = get();
        set({
          ...state,
          anniversarys: holidays
        });
      }
    }),
    {
      name: 'ocm-calendar-holidays',
      storage: createSuperJSONStorage(() => localStorage), 
    }
  ),
);

export const useHoliday = createSelectors(useHolidayBase);
