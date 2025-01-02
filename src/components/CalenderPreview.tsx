// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useRef, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import SVG from 'react-inlinesvg';
import {
  Skeleton,
} from "@/components/ui/skeleton"
import { OpenChangeDetails } from '@zag-js/dialog';
import { get as getIdb, set as setIdb } from 'idb-keyval';

import { CALENDER_DESIGNS_BASE_PATH } from '@/common';
import DropZone from '@/components/DropZone';
import PopupImageCropper from './PopupImageCropper';

// カレンダープレビューのプロパティの型
type CalenderPreviewProps = {
  cssStyle?: SerializedStyles;
  design: string;
  year: number;
  month: number;
  readonly?: boolean;
}

// 画像ブロックの情報の型
type ImageBlockInfoType = {
  name: string;
  rect: DOMRect;
  cssStyle: SerializedStyles;
  baseElm: SVGGraphicsElement;
  openClopper: boolean;
  imageCache?: string;
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

const makeSelector = (id: string) => `*[id^="${id}"],*[inkscape\\:label^="${id}"]`;

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

// 画像を保存
function saveImage(name: string, imageData: string): Promise<string | null> {
  return setIdb(name, imageData)
    .catch((err) => {
      console.log('It failed!', err);
      return null;
    })
    .then(() => imageData);
}

// 画像を取得
function getImage(name: string): Promise<string | null> {
  return getIdb(name)
    .then((val) => val || null)
    .catch((err) => {
      console.log('It failed!', err);
      return null;
    });
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

function CalenderPreview({
  cssStyle: cssProp,
  design,
  year,
  month,
  readonly = false
}: CalenderPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const refCalender = useRef<SVGElement | null>(null);
  const [ calenderElm, setCalenderElm ] = useState<SVGElement | null>(null);

  // 画像ブロックの情報
  const [ imageBlocks, setImageBlocks ] = useState({} as {[key: string]: ImageBlockInfoType});

  //console.log({now:Date.now(),refCalender,calenderElm});

  // SVGテンプレート読み込み完了後の書き換え処理
  useEffect(() => {

    if (!calenderElm) {
      return;
    }

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
    calenderElm
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
    dateItems.forEach((date, dateIndex) => {
      const dateBaseElm = calenderElm.querySelector(makeSelector(`day-${dateIndex}`)) as SVGRectElement;
      addSvgText(
        dateBaseElm,
        ""+Math.abs(date),
        {
          textColor: 0 < date ? "rgb(0, 0, 0)" : "rgb(160, 160, 160)"
        }
      );
    });

    // 画像アップローダ
    calenderElm
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
      //console.log({baseBBox});

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
          openClopper: false
        }
      }));

    });

  }, [calenderElm, readonly]);

  return (
    <div
      css={css`${cssProp||""}
        background: white;
        border: 1px solid rgb(240,240,240);
        position: relative;
      `}
    >
      <SVG
        innerRef={refCalender}
        src={`${CALENDER_DESIGNS_BASE_PATH}/${design}/main.svg`}
        width="auto"
        height="auto"
        title="React"
        preProcessor={(code) => 
          code
            .replace(/-inkscape-.+?:.+?;/g, '')
        }
        onLoad={() => {
          setCalenderElm(refCalender.current);
        }}
        css={css`user-select: none;`}
      />
      {Object.values(imageBlocks).map(((imageBlock) => {
        if (readonly) {
          return (<></>);
          return (
            <Skeleton
              key={`image-block-${imageBlock.name}-skeleton`}
              css={imageBlock.cssStyle}
            />
          );
        }
        else {
          if (imageBlock.imageCache) {
            return (<>
              <img
                key={`image-block-${imageBlock.name}-image`}
                css={imageBlock.cssStyle}
                src={imageBlock.imageCache}
                alt=""
                onClick={() => {
                  console.log({imageBlock});
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openClopper: true
                  }));
                }}
              />
              <PopupImageCropper
                key={`image-block-${imageBlock.name}-clopper-popup`}
                open={imageBlock.openClopper}
                onOpenChange={(details: OpenChangeDetails) => {
                  console.log({imageBlock,details});
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openClopper: details.open
                  }));
                }}
                image={imageBlock.imageCache}
                onImageChange={(image) => {
                  saveImage(imageBlock.name, image)
                    .then((imageData) => {
                      setImageBlocks(updateImageBlock(imageBlock.name, {
                        imageCache: imageData
                      }));
                    });
                  setImageBlocks(updateImageBlock(imageBlock.name, {
                    openClopper: false
                  }));
                }}
              />
            </>);
          }
          else {
            getImage(imageBlock.name)
              .then((imageData) => {
                setImageBlocks(updateImageBlock(imageBlock.name, {
                  imageCache: imageData
                }));
              });
            return (
              <DropZone
                key={`image-block-${imageBlock.name}-dropzone`}
                cssStyle={imageBlock.cssStyle}
                onSelectFile={(file, isDrop) => {
                  console.log({file,isDrop});
                  const reader = new FileReader(); // ファイル読み取り用オブジェクト作成
                  reader.onload = (event: ProgressEvent<FileReader>) => {
                    console.log({'event.target.result':event.target?.result,openClopper:imageBlock.openClopper});
                    saveImage(imageBlock.name, event.target?.result as string || '')
                      .then((imageData) => {
                        setImageBlocks(updateImageBlock(imageBlock.name, {
                          imageCache: imageData
                        }));
                      });
                    setImageBlocks(updateImageBlock(imageBlock.name, {
                      openClopper: true
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
            );
          }
        }
      }))}
    </div>
  );
}

export default CalenderPreview;
