
export type PageSizeType = [number, number];

const makePageSize = (w: number, h: number): PageSizeType => [
  w,// /25.4*72,
  h,// /25.4*72,
];

export const PageSize: { [key:  string]: PageSizeType } = {
  B0JIS: makePageSize(1030,1456),
  B1JIS: makePageSize( 728,1030),
  B2JIS: makePageSize( 515, 728),
  B3JIS: makePageSize( 364, 515),
  B4JIS: makePageSize( 257, 364),
  B5JIS: makePageSize( 182, 257),
  B6JIS: makePageSize( 128, 182),
  B7JIS: makePageSize(  91, 128),
  B8JIS: makePageSize(  64,  91),
  B9JIS: makePageSize(  45,  64),
  B10JIS:makePageSize(  32,  45),
} as const;
