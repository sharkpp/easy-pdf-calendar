// カレンダーの一月分をデザインと月を指定し描画する

import { useState } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import CalenderPreview from '@/components/CalenderPreview';

type CalanderDesignPreviewProps = {
  design: string;
  year: number;
  month: number;
  onChangeDesign?: (name: string) => void;
  onChangeMonth?: (month: number) => void;
}

const MonthList = [ 1,2,3,4,5,6,7,8,9,10,11,12 ];

function CalanderDesignPreview({
  design,
  year,
  month,
  onChangeDesign,
  onChangeMonth,
  }: CalanderDesignPreviewProps & import("react").RefAttributes<HTMLDivElement>)
{
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
            "area-tl  area-tl  design-p2 area-tr  area-tr"
            "area-tl  area-tl  design-p1 area-tr  area-tr"
            "month-p2 month-p1 calender  month-n1 month-n2"
            "area-bl  area-bl  design-n1 area-br  area-br"
            "area-bl  area-bl  design-n2 area-br  area-br"; 
          .calender { grid-area: calender; }
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
          .area-tr { grid-area: area-tr; }
          .area-tl { grid-area: area-tl; }
          .area-bl { grid-area: area-bl; }
          .area-br { grid-area: area-br; }
        `}
      >
        <Box className="calender" width="100%" padding="4" color="white">
          <CalenderPreview
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
          {1<=month-1&&<CalenderPreview
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
        {month+1<=12&&<CalenderPreview
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

        <Box className="area-tl" width="100%" padding="4" color="white">
        </Box>
        <Box className="area-tr" width="100%" padding="4" color="white">
        </Box>
        <Box className="area-bl" width="100%" padding="4" color="white">
        </Box>
        <Box className="area-br" width="100%" padding="4" color="white">
        </Box>

      </SimpleGrid>

      {/*<div css={css`width: 0px; height: 0px;`}>
          {MonthList.reduce((r, month_) => {
            if ([month-1, month, month+1].indexOf(month_) < 0) {
              r.push(
                <CalenderPreview
                  design={design}
                  year={year}
                  month={month_}
                />
              );
            }
            return r;
          }, [] as any)}
      </div>*/}
    </>
  );
}

export default CalanderDesignPreview;
