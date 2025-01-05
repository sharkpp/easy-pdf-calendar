// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useMemo, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import {
  Skeleton,
} from "@/components/ui/skeleton"
import { CALENDAR_DESIGNS_BASE_PATH } from '@/common';
import DropZone from '@/components/DropZone';
import PopupImageCropper from './PopupImageCropper';
import { ImageBlockState, useImageBlock } from '@/store/image-block';
import { useCalendar } from '@/store/calendar';

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
  rect: DOMRect;
  cssStyle: SerializedStyles;
  baseElm: SVGGraphicsElement;
  openCropper: boolean;
  state?: ImageBlockState | undefined;
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
const makeSelector = (id: string) => `*[id^="${id}"],*[*|label^="${id}"]`;

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
dominant-baseline: central;"
      x="0"
      y="0"
    >${text}</text>
  `);
  const textElm: SVGTextElement | null = baseElm.ownerSVGElement?.lastElementChild as SVGTextElement;
  if (textElm) {
    const rect: SVGRect = textElm.getBBox();
    textElm.setAttribute("x", "" + (baseElm.x.baseVal.value + baseElm.width.baseVal.value / 2 - rect.width / 2));
    textElm.setAttribute("y", "" + (baseElm.y.baseVal.value + baseElm.height.baseVal.value / 2));
  }
}

const updateImageBlock = (name: string, imageBlockPart: Partial<Record<keyof ImageBlockInfoType, any>>) => {
  return (
    (curImageBlocks: { [key: string]: ImageBlockInfoType }) => ({
      ...curImageBlocks,
      [name]: {
        ...curImageBlocks[name],
        ...imageBlockPart
      }
    })
  );
};



function CalendarPreview({
  cssStyle: cssProp,
  design,
  year,
  month,
  readonly = false,
  blankImage = false,
}: CalendarPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const { getImageData, saveImageData } = useImageBlock();
  const { getCalendar, setCalendar } = useCalendar();

  //const refCalendar = useRef<SVGElement | null>(null);
  const [ calendarElm, setCalendarElm ] = useState<SVGElement | null>(null);

  // 画像ブロックの情報
  const [ imageBlocks, setImageBlocks ] = useState({} as {[key: string]: ImageBlockInfoType});

  //console.log({now:Date.now(),refCalendar,calendarElm});

  const refSvgContainer = useMemo(() => {
    return (svgContainer: HTMLDivElement | null) => {
      if (!svgContainer) {
        return;
      }

      let calendarElm_ = getCalendar(`${design}:${year}:${month}`);
      if (calendarElm_) {
        svgContainer.firstElementChild?.replaceWith(calendarElm_);
        setCalendarElm(calendarElm_);
        return;
      }

      // カレンダーデザインのSVGファイルを読み込む
      fetch(`${CALENDAR_DESIGNS_BASE_PATH}/${design}/main.svg`)
        .then((response) => response.text())
        .then((svgText) => {
          const parser = new DOMParser();
          calendarElm_ = parser.parseFromString(svgText, "image/svg+xml").documentElement as unknown as SVGElement;
          // 不要な属性を削除
          calendarElm_.removeAttribute('id');
          calendarElm_.removeAttribute('width');
          calendarElm_.removeAttribute('height');

          svgContainer.firstElementChild?.replaceWith(calendarElm_);
          setCalendarElm(calendarElm_);
        });
    };
  }, []);

  useEffect(() => {
    if (!calendarElm) {
      return;
    }

    // SVGテンプレート読み込み完了後の書き換え処理

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

    //console.log({month,dateItems});

    // 年や日を追加
    calendarElm
      .querySelectorAll([
          makeSelector(`year`),
          makeSelector(`month`)
        ].join(","))
      .forEach((baseElm: Element) => {
        const name = (
            baseElm.getAttribute('inkscape:label') ||
            baseElm.getAttribute('id') ||
            ''
          );
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
        const dateBaseElm = calendarElm?.querySelector(makeSelector(`day-${dateIndex}`)) as SVGRectElement;
        addSvgText(
          dateBaseElm,
          ""+Math.abs(date),
          {
            textColor: 0 < date ? "rgb(0, 0, 0)" : "rgb(160, 160, 160)"
          }
        );
      });

    // 画像アップローダ
    calendarElm
      .querySelectorAll(makeSelector(`image`))
      .forEach((baseElm: Element) => {
        const blockName = (
            baseElm.getAttribute('inkscape:label') ||
            baseElm.getAttribute('id') ||
            ''
          );
        const name = `${(/^(.*)\[(.*)\]$/.exec(blockName) || ['', '', ''])[2] || ''}:${month}`; // {ブロック名}:{月}
        const svgBBox = (baseElm as SVGGraphicsElement).ownerSVGElement?.getBoundingClientRect() ||
                        { x: 0, y: 0, width: 0, height: 0 };
        const baseBBox = baseElm.getBoundingClientRect();
  
        const cssImageArea = css`
            position: absolute;
            left:   ${baseBBox.x - svgBBox.x}px;
            top:    ${baseBBox.y - svgBBox.y}px;
            width:  ${baseBBox.width}px;
            height: ${baseBBox.height}px;
          `;
  
        setImageBlocks((curImageBlocks) => ({
          ...curImageBlocks,
          [name]: {
            name: name,
            rect: baseBBox,
            cssStyle: cssImageArea,
            baseElm: baseElm as SVGGraphicsElement,
            openCropper: false
          }
        }));
  
      });

    setCalendar(`${design}:${year}:${month}`, calendarElm);

  }, [calendarElm]);

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
      `}
    >
      <svg />
      {Object.values(imageBlocks).map(((imageBlock) => {
        let imageBlockType: 'blank' | 'image' | 'dropzone' = 'blank';
        let requestImage = false;

        //const imageBlockData = use(getImageData(imageBlock.name));
        //console.log({imageBlockData});

        if      (blankImage)     { imageBlockType = 'blank'; }
        else if (imageBlock.state) { imageBlockType = 'image'; }
        else if (readonly)       { imageBlockType = 'blank'; requestImage = true; }
        else                     { imageBlockType = 'dropzone'; requestImage = true; }

        if (requestImage) {
          getImageData(imageBlock.name)
            .then((imageBlockData) => {
              setImageBlocks(updateImageBlock(imageBlock.name, {
                state: imageBlockData
              }));
            });
        }

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
            <img
              key={`image-block-${imageBlock.name}-image`}
              css={imageBlock.cssStyle}
              src={imageBlock.state?.croppedImage || imageBlock.state?.image || ''}
              alt=""
              onClick={() => {
                console.log({imageBlock});
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
              image={imageBlock.state?.image || ''}
              cropState={imageBlock.state?.cropState}
              onCropApply={(croppedImage, cropState) => {
                console.log("onCropApply",{croppedImage,cropState});
                if (!croppedImage) {
                  saveImageData(imageBlock.name, null)
                    .then(() => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        state: undefined
                      }));
                    });
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openCropper: false,
                  }));
                }
                else {
                  saveImageData(imageBlock.name, {
                    image: imageBlock.state?.image || '',
                    croppedImage: croppedImage,
                    cropState: cropState
                  })
                    .then((imageBlockData) => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        state: imageBlockData
                      }));
                    });
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openCropper: false
                  }));
                }
              }}
              aspectRatio={imageBlock.rect.width / imageBlock.rect.height}
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
                  console.log({'event.target.result':event.target?.result,openCropper:imageBlock.openCropper});
                  saveImageData(imageBlock.name, {
                    image: event.target?.result as string || '',
                  })
                    .then((imageBlockData) => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        state: imageBlockData
                      }));
                    });
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openCropper: true
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
          );
        }
      }))}
    </div>
  );
}

export default CalendarPreview;
