// カレンダーのデザインの一覧

import { Suspense, use } from 'react';
import { css } from '@emotion/react';
import { Box, Button, SimpleGrid } from "@chakra-ui/react";
import { CardRoot as Card, CardHeader, CardBody, Heading, Text } from '@chakra-ui/react'
import { CALENDER_DESIGNS_BASE_PATH, DesignsIndexItemType, DesignsIndexList } from './common';
import { fetchData } from './fetch';
import CalenderPreview from './CalenderPreview';

type DesignListProps = {
  onSelect?: (name: string) => void;
}

function DesignListCore({ onSelect }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  const designsList: DesignsIndexList = use(
    fetchData(`${CALENDER_DESIGNS_BASE_PATH}/index.json`, async (res) => res.json())
  );
  return (
    <SimpleGrid columns={[2, null, 3]} css={css`gap: 2rem`}>
      {designsList.index.map((design: DesignsIndexItemType) => (
        <Box key={design.id} height='80px'>
          <Card size="sm" onClick={() => (onSelect && onSelect(design.id))}>
            <CardHeader>
              <Heading size='sm'>{design.id}</Heading>
            </CardHeader>
            <CardBody>
              {/*<Text>View a summary of all your customers over the last month.</Text>*/}
              <CalenderPreview
                design={design.id}
                year={2025}
                month={1}
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
