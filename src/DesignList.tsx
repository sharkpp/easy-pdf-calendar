// カレンダーのデザインの一覧

import { Suspense, use } from 'react';
import { css } from '@emotion/react';
import { Box, Button, SimpleGrid } from "@chakra-ui/react";
import { CardRoot as Card, CardHeader, CardBody, Heading, Text } from '@chakra-ui/react'
import { CALENDER_DESIGNS_BASE_PATH, DesignsIndexItemType, DesignsIndexList } from './common';
import { fetchData } from './fetch';
import CalenderPreview from './CalenderPreview';

type DesignListProps = {
  design: string;
  year: number;
  onSelect?: (name: string) => void;
}

function DesignListCore({ design, year, onSelect }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  const designsList: DesignsIndexList = use(
    fetchData(`${CALENDER_DESIGNS_BASE_PATH}/index.json`, async (res) => res.json())
  );
  return (
    <SimpleGrid minChildWidth="sm" gap={"1rem"}>
      {designsList.index.map((designItem: DesignsIndexItemType) => (
        <Box key={designItem.id}>
          <Card
            size="sm"
            onClick={() => (onSelect && onSelect(designItem.id))}
            {...(design !== designItem.id ? {} : { bg: "orange", variant: "subtle" })}
          >
            <CardHeader>
              <Heading size='sm'>{designItem.id}</Heading>
            </CardHeader>
            <CardBody>
              {/*<Text>View a summary of all your customers over the last month.</Text>*/}
              <CalenderPreview
                design={designItem.id}
                year={year}
                month={1}
                readonly={true}
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
      <div>
        <Suspense fallback={<p>Loading...</p>}>
          <DesignListCore {...props} />
        </Suspense>
      </div>
    </>
  );
}

export default DesignList;
