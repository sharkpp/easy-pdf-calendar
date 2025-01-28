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
import { optionsSelector, useOptions } from '@/store/options';
import { useShallow } from 'zustand/react/shallow';

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PopupPrintPreview({
  open, onOpenChange,
}: PopupImageCropperProps) {
  
  const useYearlyCalendar = useOptions(useShallow(optionsSelector('useYearlyCalendar')));
  const firstMonthIsApril = useOptions(useShallow(optionsSelector('firstMonthIsApril')));
  const setOption = useOptions(useShallow((state) => state.setOption));

  return (
    <Dialog 
      //size="cover"
      open={open}
      onOpenChange={(details: OpenChangeDetails) => onOpenChange(details.open)}
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
            {/* <Stack>
              <Fieldset.Legend>カレンダー生成時のオプション</Fieldset.Legend>
              <Fieldset.HelperText>
                カレンダーを生成する際のオプションを設定します。
              </Fieldset.HelperText>
            </Stack> */}

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
                    onCheckedChange={(e) => setOption('firstMonthIsApril', e.checked)}
                  />
                </Field>
              </Stack>
            </Fieldset.Content>

            <DialogActionTrigger asChild>
              <Button type="submit" alignSelf="stretch">閉じる</Button>
            </DialogActionTrigger>
            
          </Fieldset.Root>

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
