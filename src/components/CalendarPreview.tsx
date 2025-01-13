// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useMemo, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import {
  Skeleton,
} from "@/components/ui/skeleton"
import { useShallow } from 'zustand/react/shallow';
import { CALENDAR_DESIGNS_BASE_PATH } from '@/common';
import DropZone from '@/components/DropZone';
import PopupImageCropper from './PopupImageCropper';
import { ImageBlockState, useImageBlock } from '@/store/image-block';
import { calendarSelector, setCalendarSelector, useCalendar } from '@/store/calendar';
import { DesignInfoType, designSelector, useDesign } from '@/store/design';

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

// テキストを追加
function addSvgText(
  baseElm: SVGRectElement,
  text: string,
  { textColor,  }: {
    textColor?: string,
  }
): void {
  const fontSize = baseElm.height.baseVal.value;
  baseElm.ownerSVGElement?.insertAdjacentHTML("beforeend", `
    <text xml:space="preserve" 
      style="
font-style: normal;
font-variant: normal;
font-weight: normal;
font-stretch: normal;
font-size: ${fontSize};
line-height: 1.25;
font-family: &quot;Noto Sans Gothic&quot;;
white-space: pre;
display: inline;
fill: ${textColor};
fill-opacity: 1;
stroke: none;
dominant-baseline: alphabetic;"
      x="0"
      y="0"
    >${text}</text>
  `);
  const textElm: SVGTextElement | null = baseElm.ownerSVGElement?.lastElementChild as SVGTextElement;
  if (textElm) {
    const rect: SVGRect = textElm.getBBox();
    textElm.setAttribute("x", "" + (baseElm.x.baseVal.value + baseElm.width.baseVal.value / 2 - rect.width / 2));
    textElm.setAttribute("y", "" + (baseElm.y.baseVal.value + baseElm.height.baseVal.value));
  }
}

const updateImageBlock = (name: string, imageBlockPart: Partial<Record<keyof ImageBlockInfoType, any>>, updatedCallback : undefined | (() => void) = undefined) => {
  return (
    (curImageBlocks: { [key: string]: ImageBlockInfoType }) => {
      updatedCallback && updatedCallback();
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
function buildCalendar(svgElm: SVGElement, year: number, month: number, designInfo: DesignInfoType)
{
  // SVGテンプレート読み込み完了後の書き換え処理

  const dateColor               = designInfo.colors.date; // その他の日付の色
  const previousMonthDateColor  = designInfo.colors.previousMonthDate || dateColor; // 先月の日付の色
  const nextMonthDateColor      = designInfo.colors.nextMonthDate || dateColor; // 来月の日付の色
  const dayOfWeekColors = [
    designInfo.colors.sundayDate    || dateColor, // 日曜の日付の色
    designInfo.colors.mondayDate    || dateColor, // 月曜の日付の色
    designInfo.colors.tuesdayDate   || dateColor, // 火曜の日付の色
    designInfo.colors.wednesdayDate || dateColor, // 水曜の日付の色
    designInfo.colors.thursdayDate  || dateColor, // 木曜の日付の色
    designInfo.colors.fridayDate    || dateColor, // 金曜の日付の色
    designInfo.colors.saturdayDate  || dateColor, // 土曜の日付の色
    designInfo.colors.holidayDate   || dateColor, // 祝日の日付の色
  ];



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
          textColor: "rgb(0, 0, 0)"
        }
      );
    });

  // 日付を追加
  dateItems
    .forEach((date, dateIndex) => {
      const dateBaseElm = svgElm?.querySelector(makeSelector(`day-${dateIndex}`)) as SVGRectElement;
      const dayOfWeek = 0 < date ? (date - 1 + firstDayOfWeek) % 7 : -1;
      const textColor = 0 < date ? dayOfWeekColors[dayOfWeek] : previousMonthDateColor;

      addSvgText(
        dateBaseElm,
        ""+Math.abs(date),
        {
          textColor: textColor
        }
      );
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
  const calendarTemplateKey = `${design}:${-1}:${-1}:`;
  const calendarKey = `${design}:${year}:${month}:`;

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

  const designInfo = useDesign(useShallow(designSelector(design)));

  // カレンダーを埋め込むコンテナ要素
  const [ svgContainerElm, setSvgContainerElm ] = useState<HTMLDivElement | null>(null);
  // カレンダーのsvg
  const cachedCalendarTemplateElm = useCalendar(useShallow(calendarSelector(design)));
  const cachedCalendarElm = useCalendar(useShallow(calendarSelector(design, year, month)));
  const setCachedCalendarElm = useCalendar(useShallow(setCalendarSelector));
  // 画像を含めたsvg要素
  const [ calendarElm, setCalendarElm ] = useState<SVGElement | null>(null);

  // 画像データ
  const { getImageData, saveImageData } = useImageBlock();
  // 画像ブロックの情報
  const [ imageBlocks, setImageBlocks ] = useState({} as {[key: string]: ImageBlockInfoType});

console.log(calendarKey,Date.now(),{cachedCalendarTemplateElm,cachedCalendarElm,calendarElm,svgContainerElm,[`imageBlocks[data-${month}]`]:imageBlocks[`data-${month}`]});

  // コンテナ要素を取得
  const refSvgContainer = useMemo(() => {
    return (svgContainer: HTMLDivElement | null) => {
      if (!svgContainer) {
        return;
      }
      setSvgContainerElm(svgContainer);
console.warn(`${calendarKey} Obtaining container element`)
    };
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
console.warn(`${calendarKey} Loading the calendar template SVG`);
      });
  }, [cachedCalendarTemplateElm]);

  // カレンダーのsvgを読み込む
  useEffect(() => {
    if (!cachedCalendarTemplateElm || !svgContainerElm || !designInfo) {
      return;
    }
    // テンプレートから月の内容を反映
    let calendarElm_ = cachedCalendarTemplateElm.cloneNode(true) as SVGElement;
    // カレンダーを構築
    svgContainerElm.firstElementChild?.replaceWith(calendarElm_);
    calendarElm_ = buildCalendar(calendarElm_, year, month, designInfo);
    // 更新
    setCachedCalendarElm(design, year, month, calendarElm_);
console.warn(`${calendarKey} Reflecting the month's content from the template`);
  }, [cachedCalendarTemplateElm, svgContainerElm, designInfo]);

  // 画像埋め込み枠を列挙
  useEffect(() => {
    if (!cachedCalendarElm || !svgContainerElm) {
      return;
    }
    // カレンダーを更新
    svgContainerElm.firstElementChild?.replaceWith(cachedCalendarElm);

    let newImageBlocks = {} as {[key: string]: ImageBlockInfoType};
    
    // 画像埋め込み枠を列挙
    cachedCalendarElm
      .querySelectorAll(makeSelector(`image`))
      .forEach((baseElm: Element) => {
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
      });
    if (0 < Object.keys(newImageBlocks).length) {
      // 画像埋め込み枠の情報を更新
      setImageBlocks((curImageBlocks) => ({
        ...curImageBlocks,
        ...newImageBlocks
      }));
    }

console.warn(`${calendarKey} Enumerating image embedding frames`);
  }, [cachedCalendarElm, svgContainerElm]);

  // 画像データの読み込み
  useEffect(() => {
    Object.values(imageBlocks)
    .forEach((imageBlock) => {
      if (false !== imageBlock.state) {
        return;
      }
console.warn(`${calendarKey} Loading image data`);
      getImageData(imageBlock.name)
      .then((imageBlockData) => {
console.warn(`${calendarKey} Loaded image data`,{imageBlocks,imageBlockData});
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
    if (blankImage) {
      setCalendarElm(cachedCalendarElm.cloneNode(true) as SVGElement);
      return;
    }
    // 画像を合成
    const calendarElm_ = cachedCalendarElm.cloneNode(true) as SVGElement;
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
          imageElm.setAttribute('id', `image-${imageBlock.name}`);
          imageElm.setAttribute('x', ''+imageBlock.rectBySVG.x);
          imageElm.setAttribute('y', ''+imageBlock.rectBySVG.y);
          imageElm.setAttribute('width', ''+imageBlock.rectBySVG.width);
          imageElm.setAttribute('height', ''+imageBlock.rectBySVG.height);
          imageElm.setAttribute('preserveAspectRatio', 'none');
          imageElm.setAttributeNS(
            'http://www.w3.org/1999/xlink',
            'xlink:href',
            imageBlock.state ? (imageBlock.state.croppedImageUrl || imageBlock.state.imageUrl || '') : ''
            //'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'
          );
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
    console.warn(`${calendarKey} Combining calendar SVG with images`, {imageBlocks});
  }, [cachedCalendarElm, imageBlocks, blankImage]);

  // カレンダーをコンテナに追加し表示を更新
  useEffect(() => {
    if (!calendarElm || !svgContainerElm) {
      return;
    }
    svgContainerElm.firstElementChild?.replaceWith(calendarElm);
    console.warn(`${calendarKey} Updating and displaying the calendar in the container`);
  }, [calendarElm, svgContainerElm]);

  return (
    <div
      ref={refSvgContainer}
      css={css`${cssProp||""}
        background: white;
        border: 1px solid rgb(240,240,240);
        position: relative;
        svg {
          user-select: none;
          pointer-events: none;
        }
        svg {
          user-select: none;
          pointer-events: none;
        }
      `}
    >
      <svg/>
      {Object.values(imageBlocks)
      .map(((imageBlock) => {
        let imageBlockType: 'blank' | 'image' | 'dropzone' = 'blank';

        //const imageBlockData = use(getImageData(imageBlock.name));
        //console.log({imageBlockData});

        if      (blankImage)     { imageBlockType = 'blank'; }
        else if (readonly)       { imageBlockType = 'blank'; }
        else if (imageBlock.state) { imageBlockType = 'image'; }
        else                     { imageBlockType = 'dropzone'; }

        console.log(calendarKey,{imageBlock,imageBlockType});

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
              css={imageBlock.cssStyle}
              onClick={() => {
                console.log(calendarKey,{imageBlock});
                setImageBlocks(updateImageBlock(imageBlock.name, {
                  openCropper: true
                }));
              }}
            />
            <PopupImageCropper
              key={`image-block-${imageBlock.name}-cropper-popup`}
              open={imageBlock.openCropper}
              onOpenChange={(open) => {
                console.log({imageBlock,open});
                setImageBlocks(updateImageBlock(imageBlock.name, {
                  openCropper: open
                }));
              }}
              image={imageBlock.state ? imageBlock.state.imageUrl || '' : ''}
              cropState={imageBlock.state ? imageBlock.state.cropState : undefined}
              onCropApply={(croppedImage, cropState) => {
                console.log("onCropApply",{croppedImage,cropState});
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
            />
          </>);
        case 'dropzone':
          return (
            <DropZone
              key={`image-block-${imageBlock.name}-dropzone`}
              cssStyle={imageBlock.cssStyle}
              onSelectFile={(file, isDrop) => {
                console.log({file,isDrop});
                const reader = new FileReader(); // ファイル読み取り用オブジェクト作成
                reader.onload = (event: ProgressEvent<FileReader>) => {
                  console.log(calendarKey,{'event.target.result':event.target?.result,openCropper:imageBlock.openCropper});
                  if (event.target?.result && event.target?.result.constructor  === ArrayBuffer) {
                    saveImageData(imageBlock.name, {
                      image: new Blob([event.target?.result]),
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
