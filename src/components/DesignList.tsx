// カレンダーのデザインの一覧

import { JSX, Suspense, use, useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { Box, SimpleGrid } from "@chakra-ui/react";
import { CardRoot as Card, CardHeader, CardBody, Heading } from '@chakra-ui/react'
import { Button, ButtonGroup, Stack, Text } from "@chakra-ui/react";
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

type DesignTagsProps = {
  selectTags: string[];
  setSelectTags?: (tag: string[]) => void;
}

const cssStyles = css`
  --epc-title-font-size: min(calc((100vw - 1rem * 2) / 8.5), calc(100vh / 20)); /* len(簡単PDFカレンダー) = 8.5 */

  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0.5em;

  display: grid; 
  grid-template-columns: 1fr; 
  grid-template-rows: calc(var(--epc-title-font-size) + 1rem) max-content 1fr; 
  gap: 0.5em 0px; 
  grid-template-areas: 
    "title"
    "tags"
    "design-list"; 

  & .title {
    grid-area: title;
    text-align: center;
    font-size: var(--epc-title-font-size);
    line-height: calc(var(--epc-title-font-size) + 1rem);
  }
  & .tags {
    grid-area: tags;
  }
  & .design-list {
    grid-area: design-list;
    overflow: hidden auto;
  }
  & .design-list .design-list-item {
    cursor: pointer;
    max-width: calc(((100vw - 1rem * 2) - 1rem) / 2);
  }
`;

function DesignListCore({ selectTags, design, year, onSelect }: DesignTagsProps & DesignListProps & import("react").RefAttributes<HTMLDivElement>): JSX.Element
{
  const designs = useDesign(useShallow((state) => state.getDesigns()));
  const { setDesigns, getDesginNamesByTags } = useDesign();
  const [ filterdDesigns, setFilterdDesigns ] = useState<DesignInfoType[]>(designs);

  const indexJson: DesignsIndexList = use(
    fetchData(`${CALENDAR_DESIGNS_BASE_PATH}/index.json`, async (res) => res.json())
  );

  useEffect(() => {
    setDesigns(indexJson.index.filter(designInfo => designInfo.disabled !== true));
  }, [indexJson]);

  useEffect(() => {
    if (0 < selectTags.length) {
      const designNames = getDesginNamesByTags(selectTags);
      setFilterdDesigns(designs.filter(designInfo => designNames.includes(designInfo.id)));
    }
    else {
      setFilterdDesigns(designs);
    }
  }, [selectTags, designs]);

  return (
    <SimpleGrid minChildWidth="sm" gap={"1rem"} className="design-list">
      {filterdDesigns.map((designInfo: DesignInfoType) => (
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

function DesignTags({ selectTags, setSelectTags }: DesignTagsProps): JSX.Element
{
  const { getTags } = useDesign();

  return (
    <ButtonGroup variant="subtle">
      {getTags().map(tag => (
        <Button
          key={tag}
          size="xs"
          rounded="2xl"
          variant={selectTags.includes(tag) ? "solid" : "outline"}
          onClick={(event) => {
            if (event.shiftKey) {
              if (selectTags.includes(tag)) {
                setSelectTags(selectTags.filter(t => t !== tag));
              } else {
                setSelectTags([...selectTags, tag]);
              }
            }
            else {
              if (!selectTags.includes(tag)) {
                setSelectTags([tag]);
              }
              else if (1 < selectTags.length) {
                setSelectTags([tag]);
              }
              else {
                setSelectTags(selectTags.filter(t => t !== tag));
              }
            }
          }}
        >
          {tag}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function DesignList(props: DesignListProps & import("react").RefAttributes<HTMLDivElement>): JSX.Element
{
  const [ selectTags, setSelectTags ] = useState<string[]>([]);

  return (
    <>
      <div css={cssStyles}>
        <Heading className="title" size="6xl">簡単PDFカレンダー</Heading>
        <DesignTags selectTags={selectTags} setSelectTags={setSelectTags} />
        <Suspense fallback={<p>Loading...</p>}>
          <DesignListCore selectTags={selectTags} {...props} />
        </Suspense>
      </div>
    </>
  );
}

export default DesignList;
