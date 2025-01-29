// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid, IconButton } from '@chakra-ui/react';
import { Printer as PrinterIcon, CalendarCog as CalendarCogIcon } from 'lucide-react';
import { useMeasure } from "@uidotdev/usehooks";
import CalendarPreview from '@/components/CalendarPreview';
import PopupPrintPreview from '@/components/PopupPrintPreview';
import PopupPrintOption from '@/components/PopupPrintOption';
import { designNextSelector, designPrevSelector, useDesign } from '@/store/design';
import { useShallow } from 'zustand/react/shallow';
import { optionsSelector, useOptions } from '@/store/options';
import { normalizeYearAndMonth } from '@/utils/calendar';

type CalanderDesignPreviewProps = {
  design: string;
  year: number;
  month: number;
  onChangeDesign?: (name: string) => void;
  onChangeMonth?: (month: number) => void;
}

const MonthList = [ 1,2,3,4,5,6,7,8,9,10,11,12 ];

const cssStyles = css`
width: 250vw;
height: 250vh;
margin-left: calc(-75vw - 1rem);
margin-top:  calc(-75vh - 1rem);
grid-template-columns: 1fr 1fr min(60vw, 100vh) 1fr 1fr;
grid-template-rows:    1fr 1fr max-content      1fr 1fr;
grid-template-areas: 
  ".        .        design-p2 .        .      "
  ".        .        design-p1 .        .      "
  "month-p2 month-p1 calendar  month-n1 month-n2"
  ".        .        design-n1 .        .      "
  ".        .        design-n2 .        .      "; 
.calendar { grid-area: calendar; }
.design-p1 {
  display: flex;
  justify-content: center;
  align-content: flex-end;
  flex-wrap: wrap;
  grid-area: design-p1; 
}
.design-p2 {
  display: flex;
  justify-content: center;
  align-content: flex-end;
  flex-wrap: wrap;
  grid-area: design-p2; 
}
.design-n1 {
  display: flex;
  justify-content: center;
  align-content: flex-start;
  flex-wrap: wrap;
  grid-area: design-n1; 
}
.design-n2 {
  display: flex;
  justify-content: center;
  align-content: flex-start;
  flex-wrap: wrap;
  grid-area: design-n2; 
}
.month-p1 {
  align-self: center; 
  grid-area: month-p1; 
}
.month-p2 {
  align-self: center; 
  grid-area: month-p2; 
}
.month-n1 {
  align-self: center; 
  grid-area: month-n1; 
}
.month-n2 {
  align-self: center; 
  grid-area: month-n2; 
}
`;

const cssStyles2 = css`
position: absolute;
width: 100vw;
height: 100vh;
left: 0px;
top: 0px;
display: grid;
/*grid-template-columns: 1fr 0px  1fr;
grid-template-rows:    1fr 0px 1fr;*/
gap: 0px 0px;
grid-auto-flow: row;
grid-template-areas:
  "area-tl .        print-action"
  ".       calendar ."
  "area-bl .        config-action";
pointer-events: none;
user-select: none;

.calendar {
  grid-area: calendar;
}
.area-tl {
  grid-area: area-tl;
  pointer-events: auto;
  user-select: auto;
}
.print-action {
  grid-area: print-action;
  pointer-events: auto;
  user-select: auto;
}
.area-bl {
  grid-area: area-bl;
  pointer-events: auto;
  user-select: auto;
}
.config-action {
  grid-area: config-action;
  pointer-events: auto;
  user-select: auto;
}

button {
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  svg {
    width: auto;
    height: 100%;
  }
}
`;

function CalanderDesignPreview({
  design,
  year,
  month,
  onChangeDesign,
  onChangeMonth,
  }: CalanderDesignPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const firstMonthIsApril = useOptions(useShallow(optionsSelector('firstMonthIsApril'))) || false;
  const { year: yearR, month: monthR } = normalizeYearAndMonth(year, month, firstMonthIsApril);

  const prevDesignName = useDesign(useShallow(designPrevSelector(design)));
  const nextDesignName = useDesign(useShallow(designNextSelector(design)));

  const [ ref, { width, height } ] = useMeasure();
  const [ openPrintPreview, setOpenPrintPreview ] = useState(false);
  const [ openPrintOption, setOpenPrintOption ] = useState(false);

  return (
    <>
      <SimpleGrid
        columns={5}
        //gap="1rem"
        css={cssStyles}
      >
        <Box ref={ref} className="calendar" width="100%" padding="4" color="white">
          <CalendarPreview
            key={`${design}-${yearR}-${monthR}-preview`}
            //cssStyle={css`width: 80%;`}
            design={design}
            year={yearR}
            month={monthR}
          />
        </Box>

        <Box className="design-p2" width="100%" padding="4" color="white">
        </Box>
        <Box
          className="design-p1" width="100%" padding="4" color="white"
          onClick={() => (prevDesignName&&onChangeDesign&&onChangeDesign(prevDesignName))}
        >
          {prevDesignName && <CalendarPreview
              key={`${prevDesignName}-${yearR}-${monthR}-preview`}
              cssStyle={css`width: 80%;`}
              design={prevDesignName}
              year={yearR}
              month={monthR}
              readonly={true}
            />}
        </Box>
        <Box
          className="design-n1" width="100%" padding="4" color="white"
          onClick={() => (nextDesignName&&onChangeDesign&&onChangeDesign(nextDesignName))}
        >
          {nextDesignName && <CalendarPreview
              key={`${nextDesignName}-${yearR}-${monthR}-preview`}
              cssStyle={css`width: 80%;`}
              design={nextDesignName}
              year={yearR}
              month={monthR}
              readonly={true}
            />}
        </Box>
        <Box className="design-n2" width="100%" padding="4" color="white">
        </Box>

        <Box className="month-p2" width="100%" padding="4" color="white">
        </Box>
        <Box
          className="month-p1" width="100%" padding="4" color="white"
          onClick={() => (1<=month-1&&onChangeMonth&&onChangeMonth(month-1))}
        >
          {1<=month-1&&<CalendarPreview
            key={`${design}-${year}-${month-1}-preview`}
            //cssStyle={css`width: 80%;`}
            design={design}
            year={ normalizeYearAndMonth(year, month-1, firstMonthIsApril).year}
            month={normalizeYearAndMonth(year, month-1, firstMonthIsApril).month}
            readonly={true}
          />}
        </Box>
        <Box
          className="month-n1" width="100%" padding="4" color="white"
          onClick={() => (month+1<=12&&onChangeMonth&&onChangeMonth(month+1))}
        >
          {month+1<=12&&<CalendarPreview
            key={`${design}-${year}-${month+1}-preview`}
            //cssStyle={css`width: 80%;`}
            design={design}
            year={ normalizeYearAndMonth(year, month-1, firstMonthIsApril).year}
            month={normalizeYearAndMonth(year, month+1, firstMonthIsApril).month}
            readonly={true}
          />}
        </Box>
        <Box className="month-n2" width="100%" padding="4" color="white">
        </Box>

      </SimpleGrid>

      <SimpleGrid
        columns={5}
        //gap="1rem"
        css={css`
          ${cssStyles2}
          grid-template-columns: 1fr ${width}px  1fr;
          grid-template-rows:    1fr ${height}px 1fr;
        `}
      >
        <Box className="calendar" width="100%" padding="4" color="white">
        </Box>

        <Box className="area-tl" width="100%" padding="4" color="white">
        </Box>
        <Box className="print-action" width="100%" padding="4" color="white">
          <IconButton
            aria-label="print-calendar"
            onClick={() => setOpenPrintPreview(true)}
            variant="ghost"
            size="lg"
          >
            <PrinterIcon />
          </IconButton>
        </Box>
        <Box className="area-bl" width="100%" padding="4" color="white">
        </Box>
        <Box className="config-action" width="100%" padding="4" color="white">
          <IconButton
            aria-label="print-calendar"
            onClick={() => setOpenPrintOption(true)}
            variant="ghost"
            size="lg"
          >
            <CalendarCogIcon />
          </IconButton>
        </Box>

      </SimpleGrid>

      <PopupPrintPreview
        design={design}
        year={year}
        open={openPrintPreview}
        onOpenChange={(open) => setOpenPrintPreview(open)}
      />

      <PopupPrintOption
        open={openPrintOption}
        onOpenChange={(open) => setOpenPrintOption(open)}
      />

      <div css={css`width: 0px; height: 0px;`}>
        {MonthList.reduce((r, month_) => { // カレンダーなどを生成するため非表示で残りの月も作る
          if ([month-1, month, month+1].indexOf(month_) < 0) {
            r.push(
              <CalendarPreview
                design={design}
                year={ normalizeYearAndMonth(year, month_, firstMonthIsApril).year}
                month={normalizeYearAndMonth(year, month_, firstMonthIsApril).month}
              />
            );
          }
          return r;
        }, [] as any)}
      </div>
    </>
  );
}

export default CalanderDesignPreview;
