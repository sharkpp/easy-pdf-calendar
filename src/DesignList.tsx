// カレンダーのデザインの一覧

import { Suspense, use } from 'react';
import { css } from '@emotion/react';
import { Box, Button, SimpleGrid } from "@chakra-ui/react";
import { CardRoot as Card, CardHeader, CardBody, CardFooter, Text } from '@chakra-ui/react'
import { CALENDER_DESIGNS_BASE_PATH } from './common';
import CalenderPreview from './CalenderPreview';

type DesignListProps = {
  tmp?: any
}

async function readDesignListData() {
  return (
    fetch(`/${CALENDER_DESIGNS_BASE_PATH}/index.json`)
      .then((res) => res.json())
  );
}

function DesignListCore({ tmp }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  const designsList = use(readDesignListData());
  return (
    <SimpleGrid columns={[2, null, 3]} css={css`gap: 40px`}>
      {designsList.index.map((design) => (
        <Box bg='tomato' height='80px'>
          <Card>
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
function DesignList({ tmp }: DesignListProps & import("react").RefAttributes<HTMLDivElement>)
{
  return (
    <>
      <div>
        <Suspense fallback={<p>Loading...</p>}>
          <DesignListCore />
        </Suspense>
      </div>
    </>
  );
}

export default DesignList;
