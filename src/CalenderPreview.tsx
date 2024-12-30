// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useRef, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import SVG from 'react-inlinesvg';
import { CALENDER_DESIGNS_BASE_PATH } from './common';

type CalenderPreviewProps = {
  cssStyle?: SerializedStyles;
  design: string;
  year: number;
  month: number;
}

const MS24H = 24 * 60 * 60 * 1000;

const MonthJName = [
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

const makeSelector = (id: string) => `*[id^="${id}"],*[inkscape\\:label^="${id}"]`;

// テキストを追加
function addSvgText(
  baseElm: SVGRectElement,
  text: string,
  { textColor,  }: {
    textColor?: string,
  }
) {
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

function CalenderPreview({ cssStyle: cssProp, design, year, month }: CalenderPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const refCalender = useRef<SVGElement | null>(null);
  const [ calenderElm, setCalenderElm ] = useState<SVGElement | null>(null);

  console.log({refCalender,calenderElm});

  useEffect(() => {

    if (!calenderElm) {
      return;
    }

    const firstDateOfMonth = new Date(year, month-1, 1); // 今月の最初の日
    const firstDayOfWeek = firstDateOfMonth.getDay(); // 今月最初の日の曜日(日曜:0 - 土曜:6)
    const lastDateOfMonth = new Date(new Date(year, month-1+1, 1).getTime() - MS24H).getDate(); // 今月の最後の日
    const lastDateOfPrevMonth = new Date(firstDateOfMonth.getTime() - MS24H).getDate(); // 先月の最後の日

    let dateBox = new Array(7 * 6).fill(0); // 0:空欄 1〜:今月の日 〜-1:先月or来月の日
    // 今月の日を設定
    for (let i = 0; i < lastDateOfMonth; ++i) {
      dateBox[i + firstDayOfWeek] = i + 1;
    }
    // 先月の日を設定
    for (let i = 0; i < 7; ++i) {
      if (0 <= firstDayOfWeek - 1 - i) {
        dateBox[firstDayOfWeek - 1 - i] = -(lastDateOfPrevMonth - i);
      }
    }
    // 来月の日を設定
    for (let i = 0; i < 14; ++i) {
      if (firstDayOfWeek + lastDateOfMonth + i < dateBox.length) {
        dateBox[firstDayOfWeek + lastDateOfMonth + i] = -(i + 1);
      }
    }

    console.log({month,dateBox});

    // 年を追加
    const yearBoxElm = calenderElm.querySelector(makeSelector(`year`)) as SVGRectElement;
    addSvgText(
      yearBoxElm,
      `${year}年`,
      {
        textColor: "rgb(0, 0, 0)"
      }
    );

    // 月を追加
    const monthBoxElm = calenderElm.querySelector(makeSelector(`month`)) as SVGRectElement;
    addSvgText(
      monthBoxElm,
      `${month}月 ${MonthJName[month-1]}`,
      {
        textColor: "rgb(0, 0, 0)"
      }
    );

    // 日付を追加
    dateBox.forEach((date, dateIndex) => {
      const dateBoxElm = calenderElm.querySelector(makeSelector(`day-${dateIndex}`)) as SVGRectElement;
      addSvgText(
        dateBoxElm,
        ""+Math.abs(date),
        {
          textColor: 0 < date ? "rgb(0, 0, 0)" : "rgb(160, 160, 160)"
        }
      );
    });
  
  }, [calenderElm]);

  return (
    <div css={css`${cssProp||""}background: white; border: 1px solid rgb(240,240,240);`}>
      <SVG
        key={[design, year, month].join("-")}
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
      </div>
  );
}

export default CalenderPreview;
