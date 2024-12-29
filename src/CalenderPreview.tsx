// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import SVG from 'react-inlinesvg';
import { CALENDER_DESIGNS_BASE_PATH } from './common';

type CalenderPreviewProps = {
  css?: any;
  design: string;
  year: number;
  month: number;
}

function CalenderPreview({ css, design, year, month }: CalenderPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  return (
    <>
      <div css={css}>
      { design } / {year} / {month }
        <SVG
          src={`${CALENDER_DESIGNS_BASE_PATH}/${design}/main.svg`}
          width="auto"
          height="auto"
          title="React"
          preProcessor={(code) => 
            code.replace(/-inkscape-.+?:.+?;/g, '')}
        />
      </div>
    </>
  );
}

export default CalenderPreview;
