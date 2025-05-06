// カレンダーのデザインの一覧

import { Suspense, use, useEffect } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid } from "@chakra-ui/react";
import { CardRoot as Card, CardHeader, CardBody, Heading } from '@chakra-ui/react'
import { useShallow } from 'zustand/react/shallow';
import { CALENDAR_DESIGNS_BASE_PATH } from '@/common';
import { fetchData } from '@/fetch';
import CalendarPreview from '@/components/CalendarPreview';
import { useDesign, DesignInfoType } from '@/store/design';

type DesignsIndexList = {
  index: DesignInfoType[];
};

type DesignListProps = {
  design: string;
  year: number;
  onSelect?: (name: string) => void;
}

function DesignListCore({ design, year, onSelect }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  const designs = useDesign.use.getDesigns()();
  const { setDesigns } = useDesign();

  const indexJson: DesignsIndexList = use(
    fetchData(`${CALENDAR_DESIGNS_BASE_PATH}/index.json`, async (res) => res.json())
  );

  useEffect(() => {
    setDesigns(indexJson.index.filter(designInfo => designInfo.disabled !== true));
  }, [indexJson])

  return (
    <SimpleGrid minChildWidth="sm" gap={"1rem"}>
      {designs.map((designInfo: DesignInfoType) => (
        <Box key={designInfo.id}>
          <Card
            size="sm"
            onClick={() => (onSelect && onSelect(designInfo.id))}
            {...(design !== designInfo.id ? {} : { bg: "orange", variant: "subtle" })}
          >
            <CardHeader>
              <Heading size='sm'>{designInfo.name}</Heading>
            </CardHeader>
            <CardBody>
              {/*<Text>View a summary of all your customers over the last month.</Text>*/}
              <CalendarPreview
                design={designInfo.id}
                year={year}
                month={1}
                blankImage={true}
              />
            </CardBody>
          </Card>
        </Box>
      ))}
    </SimpleGrid>
  );
}
function DesignList(props: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  return (
    <>
      <div
        css={css`
          height: 100%;
          width: 100%;
          overflow-y: auto;
        `}
      >
        <Suspense fallback={<p>Loading...</p>}>
          <DesignListCore {...props} />
        </Suspense>
      </div>
    </>
  );
}

export default DesignList;
