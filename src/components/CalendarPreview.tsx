// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useCallback, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import {
  Skeleton,
} from "@/components/ui/skeleton"
import { useShallow } from 'zustand/react/shallow';
import { CALENDAR_DESIGNS_BASE_PATH } from '@/common';
import DropZone from '@/components/DropZone';
import PopupImageCropper from './PopupImageCropper';
import { ImageBlockState, useImageBlock } from '@/store/image-block';
import { useCalendar } from '@/store/calendar';
import { DesignInfoType, useDesign } from '@/store/design';
import { useHoliday, HolidaysType } from '@/store/holiday';
import { FontInfoItemsMap, type FontInfoItemType } from '@/utils/fonts-list.ts';

// カレンダープレビューのプロパティの型
type CalendarPreviewProps = {
  cssStyle?: SerializedStyles;
  design: string;
  year: number;
  month: number;
  readonly?: boolean;
  blankImage?: boolean;
}

// 画像ブロックの情報の型
type ImageBlockInfoType = {
  name: string;
  id: string;
  rectByPixel: DOMRect;
  rectBySVG: SVGRect;
  cssStyle: SerializedStyles;
  baseElm: SVGGraphicsElement;
  openCropper: boolean;
  state: ImageBlockState | null | false; // 値 | 読み込み中 | 未取得
}

const MS24H = 24 * 60 * 60 * 1000;

const MonthLongJp = [
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

const MonthLongEn = [
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
const MonthShortEn = [
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

// Is it possible to use HTML's .querySelector() to select by xlink attribute in an SVG?
// >> https://stackoverflow.com/questions/23034283/
const makeSelector = (id: string) => `*[*|label^="${id}"]`;

function addSvgTextCore(
  baseElm: SVGRectElement,
  text: string,
  textColor?: string,
  align?: string,
  fontName: string = '',
  bold: string = '',
  stroke: boolean = false
) {
  const fontSize = baseElm.height.baseVal.value;
  baseElm.ownerSVGElement?.insertAdjacentHTML("beforeend", `
    <text xml:space="preserve" 
      style="
font-style: normal;
font-variant: normal;
font-weight: ${bold || 'normal'};
font-stretch: normal;
font-size: ${fontSize};
line-height: 1.25;
font-family: &quot;${fontName || "Noto Sans Gothic"}&quot;;
white-space: pre;
display: inline;
fill: ${textColor};
fill-opacity: 1;
dominant-baseline: alphabetic;
alignment-baseline: baseline;
${!stroke ? `stroke: none;` : `
stroke: ${textColor};
stroke-width: max(2px, calc(${fontSize} * 0.3));
stroke-linecap: round;
stroke-linejoin: round;
`}"
      x="0"
      y="0"
    ><tspan>${text}</tspan></text>
  `);
  const textElm: SVGTextElement | null = baseElm.ownerSVGElement?.lastElementChild as SVGTextElement;
  if (textElm) {
    const rect: SVGRect = textElm.getBBox();
    switch (align) {
    case 'left':
      textElm.setAttribute("x", "" + (baseElm.x.baseVal.value));
      break;
    case 'right':
      textElm.setAttribute("x", "" + (baseElm.x.baseVal.value + baseElm.width.baseVal.value - rect.width));
      break;
    default:
      textElm.setAttribute("x", "" + (baseElm.x.baseVal.value + baseElm.width.baseVal.value / 2 - rect.width / 2));
      break;
    }
    textElm.setAttribute("y", "" + (baseElm.y.baseVal.value + baseElm.height.baseVal.value));
  }
}

// テキストを追加
function addSvgText(
  baseElm: SVGRectElement,
  text: string,
  { textColor, align = 'center', fontName, bold, strokeColor }: {
    textColor?: string,
    align?: string,
    fontName?: string,
    bold?: string,
    strokeColor?: string,
  }
): void {
  if (strokeColor) { // ストロークの描画
    // svg2pdf で paint-order: stroke; がサポートされてなさそうなので自力で実装
    addSvgTextCore(baseElm, text, strokeColor, align, fontName, bold, true);
  }
  addSvgTextCore(baseElm, text, textColor, align, fontName, bold);

  baseElm.style.opacity = '0';
}

const updateImageBlock = (name: string, imageBlockPart: Partial<Record<keyof ImageBlockInfoType, any>>, updatedCallback : undefined | (() => void) = undefined) => {
  return (
    (curImageBlocks: { [key: string]: ImageBlockInfoType }) => {
      updatedCallback?.();
      return {
        ...curImageBlocks,
        [name]: {
          ...curImageBlocks[name],
          ...imageBlockPart
        }
      }
    }
  );
};

// カレンダーを構築
function buildCalendar(svgElm: SVGElement, year: number, month: number, designInfo: DesignInfoType, holidays: HolidaysType )
{
  // SVGテンプレート読み込み完了後の書き換え処理

  const dateFontName    = designInfo.fonts?.date || 'Noto Sans Gothic';
  const yearFontName    = designInfo.fonts?.year || dateFontName;
  const monthFontName   = designInfo.fonts?.month || dateFontName;
  const holidayFontName = designInfo.fonts?.holiday || dateFontName;

  const dateColor               = designInfo.colors.date; // その他の日付の色
  const previousMonthDateColor  = designInfo.colors.previousMonthDate || dateColor; // 先月の日付の色
  //const nextMonthDateColor      = designInfo.colors.nextMonthDate || dateColor; // 来月の日付の色
  const dayOfWeekColors = [
    designInfo.colors.sundayDate    || dateColor, // 日曜の日付の色
    designInfo.colors.mondayDate    || dateColor, // 月曜の日付の色
    designInfo.colors.tuesdayDate   || dateColor, // 火曜の日付の色
    designInfo.colors.wednesdayDate || dateColor, // 水曜の日付の色
    designInfo.colors.thursdayDate  || dateColor, // 木曜の日付の色
    designInfo.colors.fridayDate    || dateColor, // 金曜の日付の色
    designInfo.colors.saturdayDate  || dateColor, // 土曜の日付の色
  ];
  const holidayColor = designInfo.colors.holidayDate || designInfo.colors.sundayDate || dateColor;

  const firstDateOfMonth = new Date(year, month-1, 1); // 今月の最初の日
  const firstDayOfWeek = firstDateOfMonth.getDay(); // 今月最初の日の曜日(日曜:0 - 土曜:6)
  const lastDateOfMonth = new Date(new Date(year, month-1+1, 1).getTime() - MS24H).getDate(); // 今月の最後の日
  const lastDateOfPrevMonth = new Date(firstDateOfMonth.getTime() - MS24H).getDate(); // 先月の最後の日

  let dateItems = new Array(7 * 6).fill(0); // 0:空欄 1〜:今月の日 〜-1:先月or来月の日
  // 今月の日を設定
  for (let i = 0; i < lastDateOfMonth; ++i) {
    dateItems[i + firstDayOfWeek] = i + 1;
  }
  // 先月の日を設定
  for (let i = 0; i < 7; ++i) {
    if (0 <= firstDayOfWeek - 1 - i) {
      dateItems[firstDayOfWeek - 1 - i] = -(lastDateOfPrevMonth - i);
    }
  }
  // 来月の日を設定
  for (let i = 0; i < 14; ++i) {
    if (firstDayOfWeek + lastDateOfMonth + i < dateItems.length) {
      dateItems[firstDayOfWeek + lastDateOfMonth + i] = -(i + 1);
    }
  }

  // 年や日を追加
  svgElm
    .querySelectorAll([
        makeSelector(`year`),
        makeSelector(`month`)
      ].join(","))
    .forEach((baseElm: Element) => {
      const name = (baseElm.getAttribute('inkscape:label') || '');
      // format
      const [ _, kind, formats_ ] = /^(.*)\[(.*)\]$/.exec(name) || ['', ''];
      const formats = formats_.split(',');
      //console.log({name,formats_,formats});
      //
      let text = '';
      const isLong = 0<=formats.indexOf('long');
      const isShort = 0<=formats.indexOf('short');
      const isJaJP = 0<=formats.indexOf('jaJP');
      const isEnUS = 0<=formats.indexOf('enUS');
      //const isNumber = 0<=formats.indexOf('number') || '' === formats_;
      // kind  | formats    | sample
      // ------+------------+--------
      // year  | number     | 2025
      //       | long,jaJP  | 2025年
      // month | number     | 1
      //       | short,jaJP | 1月
      //       | long,jaJP  | 睦月
      //       | short,enUS | Jan
      //       | long,enUS  | January
      // ------+------------+--------
      switch (kind) {
        case 'year':
          if      (isLong  && isJaJP) { text = `${year}年`; }
          else                        { text = ""+year; }
          break;
        case 'month':
          if      (isShort && isJaJP) { text = `${month}月`; }
          else if (isLong  && isJaJP) { text = MonthLongJp[month-1]; }
          else if (isShort && isEnUS) { text = MonthShortEn[month-1]; }
          else if (isLong  && isEnUS) { text = MonthLongEn[month-1]; }
          else                        { text = ""+month;}
          break;
      }

      addSvgText(
        baseElm as SVGRectElement,
        text,
        {
          textColor: "rgb(0, 0, 0)",
          fontName: 'year' === kind ? yearFontName : monthFontName,
        }
      );
    });

  // 日付を追加
  svgElm // 項目を表示
    .querySelectorAll([
      makeSelector(`day-`),
      makeSelector(`holidaymark-`),
      makeSelector(`holiday-`),
      makeSelector(`holiday2-`),
    ].join(","))
    .forEach((baseElm: Element) => {
      (baseElm as SVGElement).style.opacity = '1';
    });

  dateItems
    .forEach((date, dateIndex) => {
      if (date < -15) { // 前月
        if (designInfo.options?.disablePreviousMonthDate) {
          return;
        }
      }
      else if (date < 0) { // 次月
        if (designInfo.options?.disableNextMonthDate) {
          return;
        }
      }
      else {
        if (designInfo.options?.disablePreviousMonthDate) {
          dateIndex -= firstDayOfWeek;
        }
      }
      const holidayText = 0 < date ? (holidays[date] || false) : false;
      let name;
      // 日付を追加
      const dateBaseElm = svgElm?.querySelector(makeSelector(`day-${dateIndex}`)) as SVGRectElement;
      const dayOfWeek = 0 < date ? (date - 1 + firstDayOfWeek) % 7 : -1;
      const textColor = (
        date <= 0
          ? previousMonthDateColor
          : (holidayText
            ? holidayColor
            : dayOfWeekColors[dayOfWeek]
          ));

      // 記念日枠を追加
      const holidaymarkBaseElm = svgElm?.querySelector(makeSelector(`holidaymark-${dateIndex}`)) as SVGRectElement;
      if (holidaymarkBaseElm && holidayText && holidayText?.mark) {
        name = (holidaymarkBaseElm.getAttribute('inkscape:label') || '');
        // format
        const [ _, _kind, formats_ ] = /^(.*)\[(.*)\]$/.exec(name) || ['', '', ''];
        const formats = formats_.split(',');
        const align = (
          0<=formats.indexOf('left') ? 'left' :
          0<=formats.indexOf('right')? 'right' :
          'center'
        );
        addSvgText(
          holidaymarkBaseElm,
          holidayText.mark || '',
          {
            textColor: holidayColor,
            align,
            fontName: dateFontName,
            bold: '950'
          }
        );
      }
      // 記念日を追加
      const holiday2BaseElm = svgElm?.querySelector(makeSelector(`holiday2-${dateIndex}`)) as SVGRectElement;
      if (holiday2BaseElm && holidayText && holidayText?.anniversary) {
        name = (holiday2BaseElm.getAttribute('inkscape:label') || '');
        // format
        const [ _, _kind, formats_ ] = /^(.*)\[(.*)\]$/.exec(name) || ['', '', ''];
        const formats = formats_.split(',');
        const align = (
          0<=formats.indexOf('left') ? 'left' :
          0<=formats.indexOf('right')? 'right' :
          'center'
        );
        addSvgText(
          holiday2BaseElm,
          holidayText.anniversary || '',
          {
            textColor: holidayColor,
            align,
            strokeColor: '#FFFFFF',
            fontName: holidayFontName,
          }
        );
      }

      // 祝日名を追加
      const holidayBaseElm = svgElm?.querySelector(makeSelector(`holiday-${dateIndex}`)) as SVGRectElement;
      if (holidayBaseElm && holidayText && holidayText.holiday) {
        name = (holidayBaseElm.getAttribute('inkscape:label') || '');
        // format
        const [ _, _kind, formats_ ] = /^(.*)\[(.*)\]$/.exec(name) || ['', '', ''];
        const formats = formats_.split(',');
        const align = (
          0<=formats.indexOf('left') ? 'left' :
          0<=formats.indexOf('right')? 'right' :
          'center'
        );
        addSvgText(
          holidayBaseElm,
          holidayText.holiday || '',
          {
            textColor: holidayColor,
            align,
            strokeColor: '#FFFFFF',
            fontName: holidayFontName,
          }
        );
      }

      // 日付を追加
      addSvgText(
        dateBaseElm,
        ""+Math.abs(date),
        {
          textColor: textColor,
          strokeColor: '#FFFFFF',
          fontName: dateFontName,
        }
      );
    });

  svgElm // 項目を非表示
    .querySelectorAll([
      makeSelector(`day-`),
      makeSelector(`holidaymark-`),
      makeSelector(`holiday-`),
      makeSelector(`holiday2-`),
    ].join(","))
    .forEach((baseElm: Element) => {
      (baseElm as SVGElement).style.opacity = '0';
    });

  return svgElm;
}

function CalendarPreview({
  cssStyle: cssProp,
  design,
  year,
  month,
  readonly = false,
  blankImage = false,
}: CalendarPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  //const calendarKey = `${design}:${year}:${month}:`;

  // # https://dot-to-ascii.ggerganov.com/
  // digraph {
  //   rankdir = LR;
  //   svgContainerElm -> cachedCalendarElm;
  //   svgContainerElm -> calendarElm;
  //   cachedCalendarTemplateElm -> cachedCalendarElm -> calendarElm;
  //   imageBlocks -> calendarElm;
  // }

  // +---------------------------+     +-------------------+     +-------------+     +-------------+
  // | cachedCalendarTemplateElm | --> | cachedCalendarElm | --> | calendarElm | <-- | imageBlocks |
  // +---------------------------+     +-------------------+     +-------------+     +-------------+
  //                                     ^                         ^
  //                                     |                         |
  //                                     |                         |
  //                                   +-------------------+       |
  //                                   |  svgContainerElm  | ------+
  //                                   +-------------------+
  const ida = Math.random().toString(36);
  const idb = Math.random().toString(36);
//console.log(">>",useHoliday.use,[useHoliday.use.getHolidays,useHoliday.use.getHolidays()])

  const holidays = useHoliday(useShallow((state) => state.getHolidays(year, month)));

  const designInfo = useDesign(useShallow((state) => state.getDesign(design)));

  // カレンダーを埋め込むコンテナ要素
  const [ svgContainerElm, setSvgContainerElm ] = useState<HTMLDivElement | null>(null);
  // カレンダーのsvg
//  const x = useCalendar.use.cache();
  const cachedCalendarTemplateElm = useCalendar(useShallow((state) => state.getCalendar(design)));
  const cachedCalendarElm = useCalendar(useShallow((state) => state.getCalendar(design, year, month)));
  //const cachedCalendarElm = useCalendar((state) => state.cache.get(`${design}:${year||-1}:${month||-1}:`));
  const setCachedCalendarElm = useCalendar.use.setCalendar();
  // 画像を含めたsvg要素
  const [ calendarElm, setCalendarElm ] = useState<SVGElement | null>(null);

  // 画像データ
  const { getImageData, saveImageData } = useImageBlock();
  // 画像ブロックの情報
  const [ imageBlocks, setImageBlocks ] = useState({} as {[key: string]: ImageBlockInfoType});

//console.log(`${design}:${year}:${month}`,Date.now(),{cachedCalendarTemplateElm,cachedCalendarElm,calendarElm,svgContainerElm,[`imageBlocks[data-${month}]`]:imageBlocks[`data-${month}`]});

  // コンテナ要素を取得
  const refSvgContainer = useCallback((svgContainer: HTMLDivElement | null) => {
      if (!svgContainer) {
        return;
      }
      setSvgContainerElm(svgContainer);
//console.log(`${design}:${year}:${month}:${readonly?1:0} Obtaining container element`)
    }, []);

  // カレンダーのテンプレートのsvgを読み込む
  useEffect(() => {
    if (cachedCalendarTemplateElm) {
      return;
    }
    // カレンダーデザインのSVGファイルを読み込む
    fetch(`${CALENDAR_DESIGNS_BASE_PATH}/${design}/main.svg`)
      .then((response) => response.text())
      .then((svgText) => {
        const parser = new DOMParser();
        let calendarElm_ = parser.parseFromString(svgText, "image/svg+xml").documentElement as unknown as SVGElement;
        // 不要な属性を削除
        calendarElm_.removeAttribute('id');
        calendarElm_.removeAttribute('width');
        calendarElm_.removeAttribute('height');
        // 更新
        setCachedCalendarElm(design, calendarElm_);
//console.log(`${design}:${year}:${month}:${readonly?1:0} Loading the calendar template SVG`);
      });
  }, [cachedCalendarTemplateElm]);

  // カレンダーのsvgを読み込む
  useEffect(() => {
    if (!cachedCalendarTemplateElm || !svgContainerElm || !designInfo) {
      return;
    }
    // テンプレートから月の内容を反映
    let calendarElm_ = cachedCalendarTemplateElm.cloneNode(true) as SVGElement;
    calendarElm_.setAttribute('id',ida);
//console.log(`${design}:${year}:${month}:${readonly?1:0} #1`,{svgContainerElm:svgContainerElm?.firstElementChild,calendarElm_});
    // カレンダーを構築
    svgContainerElm?.firstElementChild
      ? svgContainerElm?.firstElementChild?.replaceWith(calendarElm_)
      : svgContainerElm?.appendChild(calendarElm_);
    calendarElm_ = buildCalendar(calendarElm_, year, month, designInfo, holidays);
    // 更新
    setCachedCalendarElm(design, year, month, calendarElm_);
//console.log(`${design}:${year}:${month}:${readonly?1:0} Reflecting the month's content from the template`);
  }, [cachedCalendarTemplateElm, svgContainerElm, designInfo, holidays]);

  // 画像埋め込み枠を列挙
  useEffect(() => {
    if (!cachedCalendarElm || !svgContainerElm) {
      return;
    }
    // カレンダーを更新
//console.log(`${design}:${year}:${month}:${readonly?1:0} #2`,{svgContainerElm:svgContainerElm?.firstElementChild,cachedCalendarElm});
    svgContainerElm?.firstElementChild
      ? svgContainerElm?.firstElementChild?.replaceWith(cachedCalendarElm)
      : svgContainerElm?.appendChild(cachedCalendarElm);

    let newImageBlocks = {} as {[key: string]: ImageBlockInfoType};
    
    // 画像埋め込み枠を列挙
    cachedCalendarElm
      .querySelectorAll(makeSelector(`image`))
      .forEach((baseElm: Element) => {
        (baseElm as SVGElement).style.opacity = '1';

        const blockName = (baseElm.getAttribute('inkscape:label') || '');
        const name = `${(/^(.*)\[(.*)\]$/.exec(blockName) || ['', '', ''])[2] || ''}-${month}`; // {ブロック名}:{月}
        const svgBBox = (baseElm as SVGGraphicsElement).ownerSVGElement?.getBoundingClientRect() ||
                        { x: 0, y: 0, width: 0, height: 0 };
        const baseBBox = baseElm.getBoundingClientRect();
        const baseSvgBBox = (baseElm as SVGGraphicsElement).getBBox();

        const cssImageArea = css`
            position: absolute;
            left:   ${baseBBox.x - svgBBox.x}px;
            top:    ${baseBBox.y - svgBBox.y}px;
            width:  ${baseBBox.width}px;
            height: ${baseBBox.height}px;
          `;
  
        newImageBlocks[name] = {
          name: name,
          id: baseElm.getAttribute('id') || '',
          rectByPixel: new DOMRect(
            baseBBox.x - svgBBox.x,
            baseBBox.y - svgBBox.y,
            baseBBox.width,
            baseBBox.height
          ),
          rectBySVG: baseSvgBBox,
          cssStyle: cssImageArea,
          baseElm: baseElm as SVGGraphicsElement,
          openCropper: false,
          state: false,
        };

        (baseElm as SVGElement).style.opacity = '0';
      });
    if (0 < Object.keys(newImageBlocks).length) {
      // 画像埋め込み枠の情報を更新
      setImageBlocks((curImageBlocks) => ({
        ...curImageBlocks,
        ...newImageBlocks
      }));
    }

//console.log(`${design}:${year}:${month}:${readonly?1:0} Enumerating image embedding frames`);
  }, [cachedCalendarElm, svgContainerElm]);

  // 画像データの読み込み
  useEffect(() => {
    Object.values(imageBlocks)
    .forEach((imageBlock) => {
      if (false !== imageBlock.state) {
        return;
      }
//console.log(`${design}:${year}:${month}:${readonly?1:0} Loading image data`);
      getImageData(imageBlock.name)
      .then((imageBlockData) => {
//console.log(`${design}:${year}:${month}:${readonly?1:0} Loaded image data`,{imageBlocks,imageBlockData});
        setImageBlocks(updateImageBlock(imageBlock.name, {
          state: imageBlockData
        }));
      });
    });
  }, [imageBlocks]);

  // カレンダーのsvgを画像と合成
  useEffect(() => {
    if (!cachedCalendarElm) {
      return;
    }
    const calendarElm_ = cachedCalendarElm.cloneNode(true) as SVGElement;
    calendarElm_.setAttribute('id',idb);
    if (blankImage) {
      setCalendarElm(calendarElm_ as SVGElement);
      return;
    }
    // 画像を合成
    calendarElm_
      .querySelectorAll(makeSelector(`image`))
      .forEach((baseElm: Element) => {
        const blockName = (baseElm.getAttribute('inkscape:label') || '');
        const name = `${(/^(.*)\[(.*)\]$/.exec(blockName) || ['', '', ''])[2] || ''}-${month}`; // {ブロック名}:{月}
        // const svgBBox = (baseElm as SVGGraphicsElement).ownerSVGElement?.getBoundingClientRect() ||
        //                 { x: 0, y: 0, width: 0, height: 0 };
        // const baseBBox = baseElm.getBoundingClientRect();
        const imageBlock: ImageBlockInfoType = imageBlocks[name] || {};

        if (imageBlock.rectBySVG) {
          const imageElm = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          let imageUrl = '';
          if (imageBlock.state) {
            if (imageBlock.state.croppedImageUrl) {
              imageUrl = (
                imageBlock.state.croppedImageUrl
                  + '#.' + (imageBlock.state.croppedImage?.type.split('/')[1] || '')
              );
            }
            else if (imageBlock.state.imageUrl) {
              imageUrl = (
                imageBlock.state.imageUrl
                  + '#.' + (imageBlock.state.image.type.split('/')[1] || '')
              );
            }
          }
          imageElm.setAttribute('id', `image-${imageBlock.name}`);
          imageElm.setAttribute('x', ''+imageBlock.rectBySVG.x);
          imageElm.setAttribute('y', ''+imageBlock.rectBySVG.y);
          imageElm.setAttribute('width', ''+imageBlock.rectBySVG.width);
          imageElm.setAttribute('height', ''+imageBlock.rectBySVG.height);
          imageElm.setAttribute('preserveAspectRatio', 'none');
          imageElm.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl);
          // imageElm.addEventListener('click', () => {
          //   console.error("**");
          // });
          const curImageBlockElm: Element | null = calendarElm_.querySelector(`#image-${imageBlock.name}`);
          if (curImageBlockElm) {
            curImageBlockElm.replaceWith(imageElm);
          }
          else {
            calendarElm_.appendChild(imageElm);
          }
        }
      });
    // カレンダーを更新
    setCalendarElm(calendarElm_ as SVGElement);
    setCachedCalendarElm(design, year, month, calendarElm_);
//console.log(`${design}:${year}:${month}:${readonly?1:0} Combining calendar SVG with images`, {imageBlocks});
  }, [cachedCalendarElm, imageBlocks, blankImage]);

  // カレンダーをコンテナに追加し表示を更新
  useEffect(() => {
    if (!calendarElm || !svgContainerElm) {
      return;
    }

//console.log(`${design}:${year}:${month}:${readonly?1:0} #3`,{svgContainerElm:svgContainerElm?.firstElementChild,calendarElm});
    svgContainerElm?.firstElementChild
      ? svgContainerElm?.firstElementChild?.replaceWith(calendarElm)
      : svgContainerElm?.appendChild(calendarElm);
//console.log(`${design}:${year}:${month}:${readonly?1:0} Updating and displaying the calendar in the container`);
  }, [calendarElm, svgContainerElm]);

//console.log(`${design}:${year}:${month}:${readonly?1:0} CalendarPreview #1`)


//     if (svgContainerElm &&
//         calendarElm) {
// console.log(`${design}:${year}:${month}:${readonly?1:0} -------- `,{svgContainerElm,cachedCalendarTemplateElm,cachedCalendarElm,calendarElm})
//     //svgContainerElm?.firstElementChild
//     //  ? svgContainerElm?.firstElementChild?.replaceWith(calendarElm)
//     //  : svgContainerElm?.appendChild(calendarElm);
//       if (!svgContainerElm?.firstElementChild) {
//         svgContainerElm?.appendChild(calendarElm);
//       }
//     }

  useEffect(() => {
    //console.log(`${design}:${year}:${month}:${readonly?1:0} holidays up`,{svgContainerElm,cachedCalendarTemplateElm,cachedCalendarElm,calendarElm,holidays})
  }, [holidays])

//console.log(`${design}:${year}:${month}:${readonly?1:0} CalendarPreview #2`,{"svgContainerElm?.firstElementChild":svgContainerElm?.firstElementChild,svgContainerElm,cachedCalendarTemplateElm,cachedCalendarElm,calendarElm,holidays})
//console.log(`${design}:${year}:${month}:${readonly?1:0} CalendarPreview #3`,[svgContainerElm?.firstElementChild  ,svgContainerElm?.parentElement,cachedCalendarTemplateElm?.parentElement,cachedCalendarElm?.parentElement,calendarElm?.parentElement])

  return (
    <div
      css={css`${cssProp||""}
        background: white;
        border: 1px solid rgb(240,240,240);
        position: relative;
        svg {
          user-select: none;
          pointer-events: none;
        }
      `}
    >
      <style>
        {designInfo?.fonts?.date    && (FontInfoItemsMap as Record<string, FontInfoItemType>)[designInfo?.fonts?.date]?.web}
        {designInfo?.fonts?.holiday && (FontInfoItemsMap as Record<string, FontInfoItemType>)[designInfo?.fonts?.holiday]?.web}
        {designInfo?.fonts?.month   && (FontInfoItemsMap as Record<string, FontInfoItemType>)[designInfo?.fonts?.month]?.web}
        {designInfo?.fonts?.year    && (FontInfoItemsMap as Record<string, FontInfoItemType>)[designInfo?.fonts?.year]?.web}
      </style>
      <div ref={refSvgContainer} />
      {Object.values(imageBlocks)
      .map(((imageBlock) => {
        let imageBlockType: 'blank' | 'image' | 'dropzone' = 'blank';

        //const imageBlockData = use(getImageData(imageBlock.name));
        //console.log({imageBlockData});

        if      (blankImage)       { imageBlockType = 'blank'; }
        else if (imageBlock.state) { imageBlockType = 'image'; }
        else                       { imageBlockType = 'dropzone'; }

        //console.log(calendarKey,{imageBlock,imageBlockType});

        switch (imageBlockType)
        {
        default:
        case 'blank':
          return (
            <Skeleton
              key={`image-block-${imageBlock.name}-skeleton`}
              css={imageBlock.cssStyle}
            />
          );
        case 'image':
          return (<>
            <div
              key={`image-block-${imageBlock.name}-image`}
              css={readonly ? imageBlock.cssStyle : css`cursor: pointer; ${imageBlock.cssStyle}`}
              onClick={() => {
                //console.log(calendarKey,{imageBlock});
                setImageBlocks(updateImageBlock(imageBlock.name, {
                  openCropper: true
                }));
              }}
            />
            {!blankImage && !readonly && <PopupImageCropper
              key={`image-block-${imageBlock.name}-cropper-popup`}
              open={imageBlock.openCropper}
              onClose={() => {
                //console.log({imageBlock,open});
                setImageBlocks(updateImageBlock(imageBlock.name, {
                  openCropper: false
                }));
              }}
              image={imageBlock.state ? imageBlock.state.imageUrl || '' : ''}
              cropState={imageBlock.state ? imageBlock.state.cropState : undefined}
              onCropApply={(croppedImage, cropState) => {
                //console.log("onCropApply",{croppedImage,cropState});
                if (!croppedImage) {
                  saveImageData(imageBlock.name, null)
                    .then(() => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        state: false,
                        openCropper: false,
                      }));
                    });
                }
                else if (imageBlock.state) {
                  saveImageData(imageBlock.name, {
                    image: imageBlock.state.image,
                    croppedImage: croppedImage,
                    cropState: cropState
                  })
                    .then((/*imageBlockData*/) => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        state: false,
                        openCropper: false
                      }));
                    });
                }
              }}
              aspectRatio={imageBlock.rectByPixel.width / imageBlock.rectByPixel.height}
            />}
          </>);
        case 'dropzone':
          if (blankImage || readonly) {
            return <div key={`image-block-${imageBlock.name}-blank`} />;
          }
          return (
            <DropZone
              key={`image-block-${imageBlock.name}-dropzone`}
              cssStyle={imageBlock.cssStyle}
              onSelectFile={(file, _isDrop) => {
                //console.log({file,isDrop});
                const reader = new FileReader(); // ファイル読み取り用オブジェクト作成
                reader.onload = (event: ProgressEvent<FileReader>) => {
                  //console.log(calendarKey,{'event.target.result':event.target?.result,openCropper:imageBlock.openCropper});
                  if (event.target?.result && event.target?.result.constructor  === ArrayBuffer) {
                    saveImageData(imageBlock.name, {
                      image: new Blob([event.target?.result], { type: file.type }),
                    })
                      .then((imageBlockData) => {
                        setImageBlocks(updateImageBlock(imageBlock.name, {
                          state: imageBlockData
                        }));
                      });
                    setImageBlocks(updateImageBlock(imageBlock.name, {
                      openCropper: true
                    }));
                  }
                };
                reader.readAsArrayBuffer(file);
              }}
            />
          );
        }
      }))}
    </div>
  );
}

export default CalendarPreview;
