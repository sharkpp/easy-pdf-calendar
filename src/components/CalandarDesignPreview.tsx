// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css } from '@emotion/react';
import { SimpleGrid, IconButton, Button, Heading } from '@chakra-ui/react';
import { Tooltip } from "@/components/ui/tooltip";
import { Printer as PrinterIcon, CalendarCog as CalendarCogIcon, ArrowBigRight as ArrowBigRightIcon,
          Info as InfoIcon, CalendarDays as CalendarDaysIcon, Image as ImageIcon,
          ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
          PanelLeftClose as PanelLeftCloseIcon, PanelLeftOpen as PanelLeftOpenIcon,
          Calendars as CalendarsIcon } from 'lucide-react';
//import { useMeasure } from "@uidotdev/usehooks";
import CalendarPreview from '@/components/CalendarPreview';
import PopupPrintPreview from '@/components/PopupPrintPreview';
import PopupPrintOption from '@/components/PopupPrintOption';
import MessageBox from '@/components/MessageBox';
//import { useDesign } from '@/store/design';
import { useShallow } from 'zustand/react/shallow';
import { useOptions, useVolatileOptions } from '@/store/options';
import { normalizeYearAndMonth } from '@/utils/calendar';
import { useHoliday } from '@/store/holiday';
import { useDesign } from '@/store/design';

type CalanderDesignPreviewProps = {
  design: string;
  year: number;
  month: number;
  onChangeDesign?: (name: string) => void;
  onChangeMonth?: (month: number) => void;
}

const MonthList = [ 1,2,3,4,5,6,7,8,9,10,11,12 ];

const cssStyles = css`
  --line-thickness: 1px;
  --shadow-color: var(--chakra-colors-color-palette-solid);
  --action-acion-size: 64px;

  width: 100cqw;
  height: 100cqw;

  display: grid;
  grid-template-columns: minmax(100px, 20%) var(--action-acion-size) 1fr var(--action-acion-size) var(--action-acion-size); 
  grid-template-rows: var(--action-acion-size) calc(100cqh - var(--action-acion-size) * 2 - 0.5em * 2) var(--action-acion-size); 
  gap: 0.5em 0.5em; 
  grid-template-areas: 
    "sidemenu to-design-action . config-action print-action"
    "sidemenu previous-month calendar calendar next-month"
    "sidemenu ad ad ad ad"; 

  .sidemenu {
    grid-area: sidemenu;

    border-right-width: var(--line-thickness);
    border-right-style: solid;
    border-right-color: var(--global-color-border, currentColor);

    height: 100cqh;

    .design-title {
      height: fit-content;
      text-wrap: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      padding: var(--chakra-spacing-2) var(--chakra-spacing-1);
    }

    .chakra-tabs__list > button {
      padding: var(--chakra-spacing-1);
      flex-grow: 1;
      justify-content: center;
    }
    
    .design-months-list {
      padding: 0.5rem;
      overflow: hidden scroll;
    }

    .design-months-list > div {
      display: grid;
      grid-template-rows: repeat(12, 1fr);
      gap: var(--chakra-spacing-1);
    }

    .design-months-list > div > div {
      grid-row: span 1;
      display: grid;
      grid-template-rows: subgrid;
      cursor: pointer;
      position: relative;
    }

    .design-months-list > div > div:hover::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: var(--chakra-colors-color-palette-subtle);
      background_: red;
      mix-blend-mode: multiply;
    }

    .design-months-list > div > div[data-selected] {
      border-radius: var(--chakra-radii-l2);
      padding: var(--chakra-spacing-2);
      border-width: var(--line-thickness);
      border-style: solid;
      box-shadow: 0 0 0 1px var(--shadow-color);
      border-color: var(--chakra-colors-color-palette-solid);
      container-type: size;
    }
    .design-months-list > div > div[data-selected] svg {
      width: min(64px, 100cqw, 100cqh);
      height: min(64px, 100cqw, 100cqh);
      align-self: center;
      justify-self: center;
    }
  }

  .to-design-action, .config-action, .print-action {
    width: 100%;
    height: 100%;
    justify-self: center; 
    align-self: center; 

    > button {
      width: 100%;
      height: 100%;
    }
    > button > svg {
      width: 75%;
      height: 75%;
    }
  }

  .to-design-action {
    grid-area: to-design-action; 
  }

  .config-action {
    grid-area: config-action; 
  }

  .print-action {
    grid-area: print-action; 
  }

  .calendar {
    grid-area: calendar; 

    overflow: hidden;
    justify-self: center; 
    align-self: center; 
  }
  
  .calendar > div > div:first-of-type > svg {
    width: 100%;
    height: calc(100cqh - var(--action-acion-size) * 2 - 0.5em * 2);
  }

  .previous-month {
    grid-area: previous-month; 

    justify-self: center; 
    align-self: center; 
  }

  .next-month {
    grid-area: next-month; 

    justify-self: center; 
    align-self: center; 
  }

  .previous-month,
  .next-month {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    button {
      height: 100%;
    }
  }
  
  .ad {
    grid-area: ad;
    background: rgba(0,0,0,0.1);
  }

`;

type SidemenuTabPage = "calendars" | "designs";

function CalanderDesignPreview({
  design,
  year,
  month,
  onChangeDesign,
  onChangeMonth,
  }: CalanderDesignPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const confirmedNoInformationOfNextYearsHolidays = useVolatileOptions.use.confirmedNoInformationOfNextYearsHolidays();
  const setVolatileOption = useVolatileOptions.use.setOption();
  const hasNextYearHolidays = useHoliday(useShallow((state) => 0 < Object.keys(state.getHolidays(year + 1, 3, true)).length));

  const firstMonthIsApril = useOptions.use.firstMonthIsApril() || false;
  const { year: yearR, month: monthR } = normalizeYearAndMonth(year, month, firstMonthIsApril);

  //const prevDesignName = useDesign(useShallow(designPrevSelector(design)));
  //const nextDesignName = useDesign(useShallow(designNextSelector(design)));
  const { getDesign } = useDesign();
  const designName = getDesign(design)?.name || design;

  const [ openPrintPreview, setOpenPrintPreview ] = useState(false);
  const [ openPrintOption, setOpenPrintOption ] = useState(false);

  const [ submenuTab, setSubmenuTab ] = useState<SidemenuTabPage>("calendars");

  return (
    <>
      <SimpleGrid
        css={cssStyles}
      >
        <SimpleGrid className="sidemenu">
          <Tooltip showArrow content={designName}>
            <Heading className="design-title">
              {designName}
            </Heading>
          </Tooltip>
          <div className="design-months-list">
            <div>
              {MonthList.map((month_: number) => { // カレンダーなどを生成するため非表示で残りの月も作る
                const { year: year__, month: month__ } = normalizeYearAndMonth(year, month_, firstMonthIsApril);
                if (month === month_) { // 選択している月
                  return (
                    <div
                      key={`calendar-${design}-${year}-${month_}`}
                      data-selected={month === month_ ? "yes" : undefined}
                    >
                      <ArrowBigRightIcon />
                    </div>
                  );
                }
                return (
                  <div
                    key={`calendar-${design}-${year}-${month_}`}
                    data-selected={month === month_ ? "yes" : undefined}
                    onClick={() => onChangeMonth&&onChangeMonth(month_)}
                  >
                    <CalendarPreview
                      key={`calendar-${design}-${year}-${month_}`}
                      design={design}
                      year={ year__}
                      month={month__}
                      readonly
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </SimpleGrid>

        <SimpleGrid className="to-design-action">
          <Tooltip showArrow content="トップに戻ってデザインを変更">
            <IconButton
              aria-label="print-calendar"
              onClick={() => onChangeDesign && onChangeDesign("")}
              variant="ghost"
              size="lg"
            >
              <CalendarsIcon />
            </IconButton>
          </Tooltip>
        </SimpleGrid>

        <SimpleGrid className="config-action">
          <Tooltip showArrow content="設定を変更">
            <IconButton
              aria-label="print-calendar"
              onClick={() => setOpenPrintOption(true)}
              variant="ghost"
              size="lg"
            >
              <CalendarCogIcon />
            </IconButton>
          </Tooltip>
        </SimpleGrid>

        <SimpleGrid className="print-action">
          <Tooltip showArrow content="印刷プレビューを表示">
            <IconButton
              aria-label="print-calendar"
              onClick={() => setOpenPrintPreview(true)}
              variant="ghost"
              size="lg"
            >
              <PrinterIcon />
            </IconButton>
          </Tooltip>
        </SimpleGrid>

        <SimpleGrid className="previous-month">
          <Button
            variant="ghost"
            disabled={!(1<=month-1)}
            onClick={() => 1<=month-1&&onChangeMonth&&onChangeMonth(month-1)}
          >
            <ChevronLeftIcon />
          </Button>
        </SimpleGrid>

        <SimpleGrid className="next-month">
          <Button
            variant="ghost"
            disabled={!(month+1<=12)}
            onClick={() => month+1<=12&&onChangeMonth&&onChangeMonth(month+1)}
          >
            <ChevronRightIcon />
          </Button>
        </SimpleGrid>

        <SimpleGrid className="calendar">
          <CalendarPreview
            key={`${design}-${yearR}-${monthR}-preview`}
            design={design}
            year={yearR}
            month={monthR}
          />
        </SimpleGrid>

        <SimpleGrid className="ad">
        </SimpleGrid>

      </SimpleGrid>

      <PopupPrintPreview
        design={design}
        year={year}
        open={openPrintPreview}
        onClose={() => setOpenPrintPreview(false)}
      />

      <PopupPrintOption
        open={openPrintOption}
        onClose={() => setOpenPrintOption(false)}
      />

      {(!hasNextYearHolidays &&
        (!confirmedNoInformationOfNextYearsHolidays ||
         confirmedNoInformationOfNextYearsHolidays < year)) && 
      <MessageBox
        icon={<InfoIcon size={72} />}
        onClose={() => setVolatileOption('confirmedNoInformationOfNextYearsHolidays', year)}
      >
        翌年１月から３月分までの国民の祝日は２月に告示されるため日程が正確でない場合があります。
      </MessageBox>}

    </>
  );
}

export default CalanderDesignPreview;
