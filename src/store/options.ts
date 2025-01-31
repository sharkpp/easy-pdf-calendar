// デザインの情報を保持する

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type OptionsStoreState = {
  useYearlyCalendar: boolean; // 年間カレンダー
  firstMonthIsApril: boolean; // ４月始まり
}
type OptionsStoreStateKey = keyof OptionsStoreState;

type OptionsStoreAction = {
  getOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey) => OptionsStoreState[K] | null;
  setOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey, value: OptionsStoreState[K]) => OptionsStoreState[K] | null;
}

export const useOptions = create(
  persist(
    (set, get: () => OptionsStoreState & OptionsStoreAction): OptionsStoreState & OptionsStoreAction => ({
      useYearlyCalendar: false,
      firstMonthIsApril: false,
      getOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey): OptionsStoreState[K] | null => {
        return get()[name];
      },
      setOption: <K extends keyof OptionsStoreState>(name: OptionsStoreStateKey, value: OptionsStoreState[K]): OptionsStoreState[K] | null => {
        set({ [name]: value });
      },
    }),
    {
      name: 'ocm-calendar-options',
      storage: createJSONStorage(() => localStorage), 
    },
  ),
)

export const optionsSelector =
  (name: OptionsStoreStateKey) => 
    (state: OptionsStoreAction) => state.getOption(name)
  ;

// --------------

  type VolatileOptionsStoreState = {
    // 確認系
    confirmedNoInformationOfNextYearsHolidays: number, // 来年の祝日情報がないことを確認
  }
  type VolatileOptionsStoreStateKey = keyof VolatileOptionsStoreState;
  
  type VolatileOptionsStoreAction = {
    getOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey) => VolatileOptionsStoreState[K] | null;
    setOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey, value: VolatileOptionsStoreState[K]) => VolatileOptionsStoreState[K] | null;
  }
  
  export const useVolatileOptions = create(
    persist(
      (set, get: () => VolatileOptionsStoreState & VolatileOptionsStoreAction): VolatileOptionsStoreState & VolatileOptionsStoreAction => ({
        confirmedNoInformationOfNextYearsHolidays: 0,
        getOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey): VolatileOptionsStoreState[K] | null => {
          return get()[name];
        },
        setOption: <K extends keyof VolatileOptionsStoreState>(name: VolatileOptionsStoreStateKey, value: VolatileOptionsStoreState[K]): VolatileOptionsStoreState[K] | null => {
          set({ [name]: value });
        },
      }),
      {
        name: 'ocm-calendar-volatile-options',
        storage: createJSONStorage(() => sessionStorage), 
      },
    ),
  )
  
  export const volatileOptionsSelector =
    (name: VolatileOptionsStoreStateKey) => 
      (state: VolatileOptionsStoreAction) =>
        state.getOption(name)
    ;
  