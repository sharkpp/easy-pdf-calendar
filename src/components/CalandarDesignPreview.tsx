// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid, IconButton } from '@chakra-ui/react';
import CalendarPreview from '@/components/CalendarPreview';
import { Printer as PrinterIcon } from 'lucide-react';
import { useMeasure } from "@uidotdev/usehooks";
import PopupPrintPreview from '@/components/PopupPrintPreview';

type CalanderDesignPreviewProps = {
  design: string;
  year: number;
  month: number;
  onChangeDesign?: (name: string) => void;
  onChangeMonth?: (month: number) => void;
  onPrint?: (design: string, year: number, month: number) => void;
}

const MonthList = [ 1,2,3,4,5,6,7,8,9,10,11,12 ];

function CalanderDesignPreview({
  design,
  year,
  month,
  onChangeDesign,
  onChangeMonth,
  onPrint,
  }: CalanderDesignPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
  const [ ref, { width, height } ] = useMeasure();
  const [ openPrintPreview, setOpenPrintPreview ] = useState(false);

  return (
    <>
      <SimpleGrid
        columns={5}
        //gap="1rem"
        css={css`
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
            justify-self: center; 
            grid-area: design-p1; 
          }
          .design-p2 {
            justify-self: center; 
            grid-area: design-p2; 
          }
          .design-n1 {
            justify-self: center; 
            grid-area: design-n1; 
          }
          .design-n2 {
            justify-self: center; 
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
        `}
      >
        <Box ref={ref} className="calendar" width="100%" padding="4" color="white">
          <CalendarPreview
            key={`${design}-${year}-${month}-preview`}
            //cssStyle={css`width: 80%;`}
            design={design}
            year={year}
            month={month}
          />
        </Box>

        <Box className="design-p2" width="100%" padding="4" color="white">
        </Box>
        <Box className="design-p1" width="100%" padding="4" color="white">
        </Box>
        <Box className="design-n1" width="100%" padding="4" color="white">
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
            year={year}
            month={month-1}
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
            year={year}
            month={month+1}
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
          position: absolute;
          width: 100vw;
          height: 100vh;
          left: 0px;
          top: 0px;
          display: grid;
          grid-template-columns: 1fr ${width}px  1fr;
          grid-template-rows:    1fr ${height}px 1fr;
          gap: 0px 0px;
          grid-auto-flow: row;
          grid-template-areas:
            "area-tl .        print-action"
            ".       calendar ."
            "area-bl .        area-br";

          .calendar {background: rgba(255,255,0,0.3);
            grid-area: calendar;
          }
          .area-tl {background: rgba(255,0,255,0.3);
            grid-area: area-tl;
          }
          .print-action {
            grid-area: print-action;
            button {
              width: 100%;
              height: 100%;
            }
          }
          .area-bl {background: rgba(0,255,0,0.3);
            grid-area: area-bl;
          }
          .area-br {background: rgba(0,0,255,0.3);
            grid-area: area-br;
          }
        `}
      >
        <Box className="calendar" width="100%" padding="4" color="white">
        </Box>

        <Box className="area-tl" width="100%" padding="4" color="white">
        </Box>
        <Box className="print-action" width="100%" padding="4" color="white">
          <IconButton
            aria-label="print-calendar"
            onClick={() => {
              setOpenPrintPreview(true);
            }}
            variant="outline"
          >
            <PrinterIcon />
          </IconButton>
        </Box>
        <Box className="area-bl" width="100%" padding="4" color="white">
        </Box>
        <Box className="area-br" width="100%" padding="4" color="white">
        </Box>

      </SimpleGrid>

      <PopupPrintPreview
        open={openPrintPreview}
        onOpenChange={(open) => {
          setOpenPrintPreview(open);
        }}
      />

    </>
  );
}

export default CalanderDesignPreview;
