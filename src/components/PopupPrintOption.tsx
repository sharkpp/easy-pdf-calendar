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
} from "@/components/ui/dialog";
import { OpenChangeDetails } from '@zag-js/dialog';
import { Button, Stack, Fieldset } from "@chakra-ui/react"
import { Field } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

// 画像切り取りポップアップのプロパティの型
type PopupImageCropperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PopupPrintPreview({
  open, onOpenChange,
}: PopupImageCropperProps) {

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
            カレンダーの印刷オプション
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>

          <Fieldset.Root size="lg" maxW="md">
            <Stack>
              <Fieldset.Legend>カレンダー生成時のオプション</Fieldset.Legend>
              <Fieldset.HelperText>
                カレンダーを生成する際のオプションを設定します。
              </Fieldset.HelperText>
            </Stack>

            <Fieldset.Content>
              <Stack gap="4" maxW="sm" css={css`
                  width: 100%;
                  max-width: 100%;
                  --field-label-width: auto;
                `}>
                <Field orientation="horizontal" label="年間カレンダーを追加する">
                  <Switch />
                </Field>
                <Field orientation="horizontal" label={<span
                    css={css`
                      word-break: keep-all;
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;
                    `}
                  >４月始まりとする<wbr />（１月〜３月は翌年の月となります）</span>}>
                  <Switch />
                </Field>
              </Stack>
            </Fieldset.Content>

            <Button type="submit" alignSelf="stretch">
              オプションを保存
            </Button>
          </Fieldset.Root>

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupPrintPreview;
