// 祝日・休日を保持する

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import holidaysJSON from '../../holidays.json'
import { createSuperJSONStorage } from '@/utils/zustand-middleware-superjson-storage';

export type HolidayInfoType = {
  date: number;
  name: string;
  mark?: string;
};

export type HolidayInfoListType = Map<string, HolidayInfoType>;

export type HolidaysItemType = {
  holiday?: string;
  myHoliday?: string;
};
export type HolidaysItemType_ = string;
export type HolidaysType = [undefined, ...HolidaysItemType[]] & { length: 32 };

type HolidaysJpFileType = [ string, HolidayInfoType ][];

type HolidayStoreState = {
  holidays: HolidayInfoListType;
  myHolidays: HolidayInfoListType;
};

type HolidayStoreAction = {
  getHolidays: (year: number, month: number, OnlyStatutoryHolidays?: boolean) => HolidaysType;
  getMyHolidays: () => HolidayInfoListType;
  setMyHolidays: (holidays: HolidayInfoListType) => void;
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

export const useHoliday = create(
  persist(
    (set, get: () => HolidayStoreState & HolidayStoreAction) => ({
      holidays: new Map<string, HolidayInfoType>(holidaysJSON as HolidaysJpFileType),
      myHolidays: new Map<string, HolidayInfoType>(),
      getHolidays: (year: number, month: number, OnlyStatutoryHolidays?: boolean): HolidaysType => {
        const selector = `${("0000"+year).substr(-4)}/${("00"+month).substr(-2)}/`;
        return memo(
          ([] as [string, HolidayInfoType][]).concat(
            // 国民の祝日
            Array.from((Map.groupBy(get().holidays, (holiday) =>
              0 == holiday[0].indexOf(selector) ? true : false,
            ).get(true) || []) as [string, HolidayInfoType][]),
            // ユーザーの記念日
            Array.from((Map.groupBy(get().myHolidays, (holiday) =>
              0 == holiday[0].indexOf(selector) ? true : false,
            ).get(true) || []) as [string, HolidayInfoType][])
          )
          .reduce((r: HolidaysType, item: [string, HolidayInfoType]) => {
            const key = item[1].date;
            if (!r[key]) {
              r[key] = {};
            }
            r[key].holiday = item[1].name;
            return r;
          }, [] as unknown as HolidaysType)
        );
      },
      getMyHolidays: (): HolidayInfoListType => {
        return get().myHolidays;
      },
      setMyHolidays: (holidays: HolidayInfoListType): void => {
        const state = get();
        set({
          ...state,
          myHolidays: holidays
        });
      }
    }),
    {
      name: 'ocm-calendar-holidays',
      storage: createSuperJSONStorage(() => localStorage), 
    }
  ),
);

export const holidaysSelector =
  (year: number, month: number, OnlyStatutoryHolidays: boolean = false) => 
    (state: HolidayStoreAction) => state.getHolidays(year, month, OnlyStatutoryHolidays)
  ;

export const myHolidaysSelector =
  () => 
    (state: HolidayStoreAction) => state.getMyHolidays()
  ;

export const setMyHolidaysSelector =
  () => 
    (state: HolidayStoreAction) => state.setMyHolidays
  ;
