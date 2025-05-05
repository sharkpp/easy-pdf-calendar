// 印刷オプション画面

import { css } from '@emotion/react';
import { CalendarCog as CalendarCogIcon } from 'lucide-react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import {
  SelectContent,
  SelectItem,
  //SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"
import { OpenChangeDetails } from '@zag-js/dialog';
import { Button, Stack, Fieldset, createListCollection } from "@chakra-ui/react"
import { Field } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useOptions, useVolatileOptions } from '@/store/options';
import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import PopupAnniversarysEditor from '@/components/PopupAnniversarysEditor';
import { useHoliday } from '@/store/holiday';
import { useYearSelect } from '@/store/date-select';

const nowJST = Date.now() + 9 * 60 * 60 * 1000;
const dateJST = new Date(nowJST);

type YearInfo = {
  value: number;
  label: string;
};

function year2YearInfo(year: number, type_: number): YearInfo {
  return {
    label: [
      `去年(${year}年)`,
      `今年(${year}年)`,
      `来年(${year}年)`,
    ][type_],
    value: year
  };
}

const YearsList = createListCollection({
  // 去年
  // 今年
  // 来年
  items: ([] as YearInfo[]).concat(
    dateJST.getUTCMonth() + 1 < 4 ? [ year2YearInfo(dateJST.getUTCFullYear() - 1, 0) ] : [],
    [ year2YearInfo(dateJST.getUTCFullYear(), 1)  ],
    [ year2YearInfo(dateJST.getUTCFullYear() + 1, 2) ],
  ),
});

// 印刷オプションのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onClose: () => void;
}

function PopupPrintPreview({
  open, onClose,
}: PopupImageCropperProps) {
  
  const yearSelect = useYearSelect.use.year();
  const setYearSelect = useYearSelect.use.setYearSelect();
  const [ dialogContentRef, setDialogContentRef ] = useState<HTMLDivElement | null>(null);
  const useYearlyCalendar = useOptions.use.useYearlyCalendar();
  const firstMonthIsApril = useOptions.use.firstMonthIsApril();
  const anniversarys = useHoliday.use.anniversarys();
  const setAnniversarys = useHoliday.use.setAnniversarys();
  const setOption = useOptions.use.setOption();
  const setVolatileOption = useVolatileOptions.use.setOption();
  const [ openAnniversarysEditor, setOpenAnniversarysEditor ] = useState(false);

  return (
    <Dialog 
      //size="cover"
      open={open}
      onOpenChange={(details: OpenChangeDetails) => !details.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogContent
        css={css`
          .chakra-dialog__body {
            position: relative;
            height:     calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
            max-height: calc(100% - 1.75rem - var(--chakra-spacing-6) - var(--chakra-spacing-4));
          }
        `}
        ref={elm => setDialogContentRef(elm)}
      >
        <DialogHeader>
          <DialogTitle
            css={css`
              > * {
                display: inline-block;
              }
                display: flex;
                gap: 0.5rem;
            `}>
            <CalendarCogIcon /> 
            カレンダーの生成オプション
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>

          <Fieldset.Root size="lg" maxW="md">
            <Fieldset.Content>
              <Stack gap="4" maxW="sm" css={css`
                  width: 100%;
                  max-width: 100%;
                  --field-label-width: auto;
                `}>

                <Field orientation="horizontal" label="カレンダーを作成する年の指定">
                  <SelectRoot
                      collection={YearsList}
                      size="sm"
                      width="320px"
                      // @ts-ignore なんか定義がおかしい？ string[] を要求しているが実際には number[] が返ってくる...
                      value={[yearSelect]}
                      // @ts-ignore なんか定義がおかしい？サンプル通りにやっても数値の配列で返ってくる...
                      onValueChange={(e) => setYearSelect(e.value[0])}
                      css={css`width: 9rem;`}
                    >
                    <SelectTrigger>
                      <SelectValueText placeholder="作成する年の指定" />
                    </SelectTrigger>
                    <SelectContent
                      portalRef={{current:dialogContentRef} as React.RefObject<HTMLDivElement>}
                    >
                      {YearsList.items.map((year) => (
                        <SelectItem item={year} key={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field orientation="horizontal" label="年間カレンダーを追加する">
                  <Switch
                    checked={useYearlyCalendar || false}
                    onCheckedChange={(e) => setOption('useYearlyCalendar', e.checked)}
                  />
                </Field>

                <Field orientation="horizontal" label={<span
                    css={css`
                      word-break: keep-all;
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;
                    `}
                  >４月始まりとする<wbr />（１月〜３月は翌年の月となります）</span>}>
                  <Switch
                    checked={firstMonthIsApril || false}
                    onCheckedChange={(e) => {
                      setOption('firstMonthIsApril', e.checked);
                      if (e.checked) { // 警告を表示
                        setVolatileOption("confirmedNoInformationOfNextYearsHolidays", 0);
                      }
                    }}
                  />
                </Field>

                <Field orientation="horizontal" label="記念日を定義">
                  <Button variant="outline" onClick={() => setOpenAnniversarysEditor(true)}>編集...</Button>
                </Field>

              </Stack>
            </Fieldset.Content>

            <DialogActionTrigger asChild>
              <Button type="submit" alignSelf="stretch">閉じる</Button>
            </DialogActionTrigger>
            
          </Fieldset.Root>

          <PopupAnniversarysEditor
            open={openAnniversarysEditor}
            value={anniversarys}
            onClose={() => setOpenAnniversarysEditor(false)}
            onChange={(newItems) => setAnniversarys(newItems)}
          />

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
