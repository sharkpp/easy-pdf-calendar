// デザインの情報を保持する

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type OptionsStoreState = {
  useYearlyCalendar: boolean; // 年間カレンダー
  firstMonthIsApril: boolean; // ４月始まり
}
type OptionsStoreStateKey = keyof OptionsStoreState;

type OptionsStoreAction = {
  getOption: (name: keyof OptionsStoreState) => boolean | null;
  setOption: (name: keyof OptionsStoreState, value: any) => any | null;
}

export const useOptions = create(
  persist(
    (set, get: () => OptionsStoreState & OptionsStoreAction): OptionsStoreState & OptionsStoreAction => ({
      useYearlyCalendar: false,
      firstMonthIsApril: false,
      getOption: (name: keyof OptionsStoreState): boolean | null => {
        return get()[name];
      },
      setOption: (name: keyof OptionsStoreState, value: any): any | null => {
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
  (name: keyof OptionsStoreState) => 
    (state: OptionsStoreAction) => state.getOption(name)
  ;
