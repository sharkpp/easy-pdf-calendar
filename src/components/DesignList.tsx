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

const cssStyles = css`
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 1rem;
  & > h2 {
    text-align: center;
    margin-bottom: 1rem;
  }
  & .design-list-item {
    max-width: calc(((100vw - 1rem * 2) - 1rem) / 2);
  }
  & .design-list-item:hover .chakra-card__root {
    border-width: 5px;
    margin: -4px;
  }
`;

function DesignListCore({ design, year, onSelect }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  const designs = useDesign(useShallow((state) => state.getDesigns()));
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
        <Box key={designInfo.id} className="design-list-item">
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
      <div css={cssStyles}>
        <Heading size="6xl">簡単PDFカレンダー</Heading>
        <Suspense fallback={<p>Loading...</p>}>
          <DesignListCore {...props} />
        </Suspense>
      </div>
    </>
  );
}

export default DesignList;
