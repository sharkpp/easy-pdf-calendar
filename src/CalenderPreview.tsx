// カレンダーの一月分をデザインと月を指定し描画する

import { useEffect, useRef, useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import SVG from 'react-inlinesvg';
import { CALENDER_DESIGNS_BASE_PATH } from './common';

const MS24H = 24 * 60 * 60 * 1000;

type CalenderPreviewProps = {
  cssStyle?: SerializedStyles;
  design: string;
  year: number;
  month: number;
}

function CalenderPreview({ cssStyle: cssProp, design, year, month }: CalenderPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const refCalender = useRef<SVGElement | null>(null);
  const [ calenderElm, setCalenderElm ] = useState<SVGElement | null>(null);

  console.log({refCalender,calenderElm});

  useEffect(() => {
    console.log({calenderElm});
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

    dateBox.forEach((date, dateIndex) => {
      const dateBoxElm = calenderElm.querySelector(`*[id^="day-${dateIndex}"],*[inkscape\\:label^="day-${dateIndex}"]`) as SVGRectElement;
      const fontSize = dateBoxElm.width.baseVal.value/ 2;
      const textColor = 0 < date ? "rgb(0, 0, 0)" : "rgb(160, 160, 160)";
      calenderElm.insertAdjacentHTML("beforeend", `
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
          y="0">${
            ""+Math.abs(date)
          }</text>
      `);
      const dateNumElm: SVGTextElement | null = calenderElm.lastElementChild as SVGTextElement;
      if (dateNumElm) {
        const rect: SVGRect = dateNumElm.getBBox();
        dateNumElm.setAttribute("x", "" + (dateBoxElm.x.baseVal.value + dateBoxElm.width.baseVal.value / 2 - rect.width / 2));
        dateNumElm.setAttribute("y", "" + (dateBoxElm.y.baseVal.value + dateBoxElm.height.baseVal.value / 2));
      }
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
