// デザインの情報を保持する

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSelectors } from '@/utils/zustand';

type OptionsStoreState = {
  useYearlyCalendar: boolean; // 年間カレンダー
  firstMonthIsApril: boolean; // ４月始まり
}
type OptionsStoreStateKey = keyof OptionsStoreState;

type OptionsStoreAction = {
  getOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey) => OptionsStoreState[K] | null;
  setOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey, value: OptionsStoreState[K]) => void;
}

const useOptionsBase = create(
  persist(
    (set, get: () => OptionsStoreState & OptionsStoreAction): OptionsStoreState & OptionsStoreAction => ({
      useYearlyCalendar: false,
      firstMonthIsApril: false,
      getOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey): OptionsStoreState[K] | null => {
        return get()[name];
      },
      setOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey, value: OptionsStoreState[K]): void => {
        set({ [name]: value });
      },
    }),
    {
      name: 'ocm-calendar-options',
      storage: createJSONStorage(() => localStorage), 
    },
  ),
)

export const useOptions = createSelectors(useOptionsBase);

// --------------

type VolatileOptionsStoreState = {
  // 確認系
  confirmedNoInformationOfNextYearsHolidays: number, // 来年の祝日情報がないことを確認
}
type VolatileOptionsStoreStateKey = keyof VolatileOptionsStoreState;

type VolatileOptionsStoreAction = {
  getOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey) => VolatileOptionsStoreState[K] | null;
  setOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey, value: VolatileOptionsStoreState[K]) => void;
}

const useVolatileOptionsBase = create(
  persist(
    (set, get: () => VolatileOptionsStoreState & VolatileOptionsStoreAction): VolatileOptionsStoreState & VolatileOptionsStoreAction => ({
      confirmedNoInformationOfNextYearsHolidays: 0,
      getOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey): VolatileOptionsStoreState[K] | null => {
        return get()[name];
      },
      setOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey, value: VolatileOptionsStoreState[K]): void => {
        set({ [name]: value });
      },
    }),
    {
      name: 'ocm-calendar-volatile-options',
      storage: createJSONStorage(() => sessionStorage), 
    },
  ),
)

export const useVolatileOptions = createSelectors(useVolatileOptionsBase);
