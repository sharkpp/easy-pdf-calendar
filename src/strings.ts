// コンポーネントで利用する文字列定義

export const MonthLongJp = [
  '睦月',
  '如月',
  '弥生',
  '卯月',
  '皐月',
  '水無月',
  '文月',
  '葉月',
  '長月',
  '神無月',
  '霜月',
  '師走',
];

export const MonthLongEn = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MonthLongEnUpperCase = MonthLongEn.map((month) => month.toUpperCase());

export const MonthLongEnLowerCase = MonthLongEn.map((month) => month.toLowerCase());

export const MonthShortEn = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthShortEnUpperCase = MonthShortEn.map((month) => month.toUpperCase());

export const MonthShortEnLowerCase = MonthShortEn.map((month) => month.toLowerCase());
