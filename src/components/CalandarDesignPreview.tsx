// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid, IconButton, Tabs, Button } from '@chakra-ui/react';
import { Printer as PrinterIcon, CalendarCog as CalendarCogIcon, ArrowBigRight as ArrowBigRightIcon,
          Info as InfoIcon, CalendarDays as CalendarDaysIcon, Image as ImageIcon,
          ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
          PanelLeftClose as PanelLeftCloseIcon, PanelLeftOpen as PanelLeftOpenIcon } from 'lucide-react';
import { useMeasure } from "@uidotdev/usehooks";
import CalendarPreview from '@/components/CalendarPreview';
import PopupPrintPreview from '@/components/PopupPrintPreview';
import PopupPrintOption from '@/components/PopupPrintOption';
import MessageBox from '@/components/MessageBox';
//import { useDesign } from '@/store/design';
import { useShallow } from 'zustand/react/shallow';
import { useOptions, useVolatileOptions } from '@/store/options';
import { normalizeYearAndMonth } from '@/utils/calendar';
import { useHoliday } from '@/store/holiday';

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

    > * {
      height: 100cqh;
    }

    .chakra-tabs__list > button {
      padding: var(--chakra-spacing-1);
      flex-grow: 1;
      justify-content: center;
    }
    
    .chakra-tabs__content {
      padding: 0.5rem;
      height: calc(100% - var(--tabs-height));
      overflow: hidden scroll;
    }

    .chakra-tabs__content > div {
      display: grid;
      grid-template-rows: repeat(12, 1fr);
      gap: var(--chakra-spacing-1);
    }

    .chakra-tabs__content > div > div {
      grid-row: span 1;
      display: grid;
      grid-template-rows: subgrid;
    }

    .chakra-tabs__content > div > div[data-selected] {
      border-radius: var(--chakra-radii-l2);
      padding: var(--chakra-spacing-2);
      border-width: var(--line-thickness);
      border-style: solid;
      box-shadow: 0 0 0 1px var(--shadow-color);
      border-color: var(--chakra-colors-color-palette-solid);
    }
    .chakra-tabs__content > div > div[data-selected] svg {
      width: 64px;
      height: 64px;
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
  
  .calendar > div > div:first-child > svg {
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

  const [ openPrintPreview, setOpenPrintPreview ] = useState(false);
  const [ openPrintOption, setOpenPrintOption ] = useState(false);

  const [ submenuTab, setSubmenuTab ] = useState<SidemenuTabPage>("calendars");

  return (
    <>
      <SimpleGrid
        css={cssStyles}
      >
        <SimpleGrid
          className="sidemenu"
        >
          <Tabs.Root
            variant="outline"
            value={submenuTab}
            onValueChange={(e) => setSubmenuTab(e.value as SidemenuTabPage)}
          >
            <Tabs.List>
              <Tabs.Trigger value="designs">
                {/*<CalendarDaysIcon />*/}
                デザイン
              </Tabs.Trigger>
              <Tabs.Trigger value="calendars">
                {/*<ImageIcon />*/}
                カレンダー
              </Tabs.Trigger>
              <Button variant="ghost">
                <PanelLeftCloseIcon />
              </Button>
            </Tabs.List>

            <Tabs.Content value="designs" className="designs-list">
              Manage your team members {submenuTab}
            </Tabs.Content>

            <Tabs.Content value="calendars" className="calendars-list">
              <div>
                {MonthList.map((month_: number) => { // カレンダーなどを生成するため非表示で残りの月も作る
                  const { year: year__, month: month__ } = normalizeYearAndMonth(year, month_, firstMonthIsApril);
                  if (month === month_) { // 選択している月
                    return (
                      <div
                        data-selected={month === month_ ? "yes" : undefined}
                      >
                        <ArrowBigRightIcon />
                      </div>
                    );
                  }
                  return (
                    <div
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
            </Tabs.Content>

          </Tabs.Root>
        </SimpleGrid>

        <SimpleGrid className="to-design-action">
        </SimpleGrid>

        <SimpleGrid className="config-action">
          <IconButton
            aria-label="print-calendar"
            onClick={() => setOpenPrintOption(true)}
            variant="ghost"
            size="lg"
          >
            <CalendarCogIcon />
          </IconButton>
        </SimpleGrid>

        <SimpleGrid className="print-action">
          <IconButton
            aria-label="print-calendar"
            onClick={() => setOpenPrintPreview(true)}
            variant="ghost"
            size="lg"
          >
            <PrinterIcon />
          </IconButton>
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
            disabled={!(month+1<12)}
            onClick={() => month+1<12&&onChangeMonth&&onChangeMonth(month+1)}
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
