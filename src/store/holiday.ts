// 祝日・休日を保持する

import { create } from 'zustand'
import holidaysJSON from '../../holidays.json'

export type HolidayInfoType = {
  date: number;
  name: string;
};

export type HolidaysItemType = string;
export type HolidaysType = [undefined, ...HolidaysItemType[]] & { length: 32 };

type HolidaysJpFileType = [ string, HolidayInfoType ][];

type HolidayStoreState = {
  holidays: Map<string, HolidayInfoType>;
};

type HolidayStoreAction = {
  getHolidays: (year: number, month: number, OnlyStatutoryHolidays: boolean) => HolidaysType;
};

export const useHoliday = create<HolidayStoreState & HolidayStoreAction>(
  (_set, get) => ({
    holidays: new Map<string, HolidayInfoType>(holidaysJSON as HolidaysJpFileType),
    getHolidays: (year: number, month: number, OnlyStatutoryHolidays: boolean = false): HolidaysType => {
      const selector = `${("0000"+year).substr(-4)}/${("00"+month).substr(-2)}/`;
      return Array.from(
        (Map.groupBy(get().holidays, (holiday) =>
          0 == holiday[0].indexOf(selector) ? true : false,
        ).get(true) || []) as [string, HolidayInfoType][]
      ).reduce((r: HolidaysType, item: [string, HolidayInfoType]) => {
        r[item[1].date] = item[1].name;
        return r;
      }, [] as unknown as HolidaysType);
    },
  })
);

export const holidaysSelector =
  (year: number, month: number) => 
    (state: HolidayStoreAction) => state.getHolidays(year, month)
  ;
