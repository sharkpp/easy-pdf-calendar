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
import { OpenChangeDetails } from '@zag-js/dialog';
import { Button, Stack, Fieldset } from "@chakra-ui/react"
import { Field } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { optionsSelector, useOptions, useVolatileOptions } from '@/store/options';
import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import PopupAnniversarysEditor from '@/components/PopupAnniversarysEditor';
import { anniversarysSelector, setAnniversarysSelector, useHoliday } from '@/store/holiday';

// 印刷オプションのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onClose: () => void;
}

function PopupPrintPreview({
  open, onClose,
}: PopupImageCropperProps) {
  
  const useYearlyCalendar = useOptions(useShallow(optionsSelector('useYearlyCalendar')));
  const firstMonthIsApril = useOptions(useShallow(optionsSelector('firstMonthIsApril')));
  const anniversarys = useHoliday(useShallow(anniversarysSelector()));
  const setAnniversarys = useHoliday(useShallow(setAnniversarysSelector()));
  const setOption = useOptions(useShallow((state) => state.setOption));
  const setVolatileOption = useVolatileOptions(useShallow((state) => state.setOption));
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

                <Field orientation="horizontal" label="独自の記念日を定義">
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
