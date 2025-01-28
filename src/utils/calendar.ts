// カレンダー関係のユーティリティ関数

export const normalizeYearAndMonth =
  (year: number, month: number, firstMonthIsApril: boolean): { year: number, month: number } => {
    if (firstMonthIsApril) { // 今年４月〜翌年３月
      return {
        year: 9 < month ? year + 1 : year,
        month: (month - 1 + 3) % 12 + 1,
      }
    }
    else { // 今年１月〜今年１２月
      return { year, month };
    }
  };