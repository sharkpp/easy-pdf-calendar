// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import SVG from 'react-inlinesvg';
import { CALENDER_DESIGNS_BASE_PATH } from './common';

type CalenderPreviewProps = {
  cssStyle?: SerializedStyles;
  design: string;
  year: number;
  month: number;
}

function CalenderPreview({ cssStyle: cssProp, design, year, month }: CalenderPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  return (
    <div css={css`${cssProp||""}background: white;`}>
      <SVG
        src={`${CALENDER_DESIGNS_BASE_PATH}/${design}/main.svg`}
        width="auto"
        height="auto"
        title="React"
        preProcessor={(code) => 
          code.replace(/-inkscape-.+?:.+?;/g, '')}
        css={css`user-select: none;`}
      />
      </div>
  );
}

export default CalenderPreview;
