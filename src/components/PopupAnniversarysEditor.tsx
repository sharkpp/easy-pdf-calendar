// 記念日を定義

import { css, FunctionInterpolation, Theme } from '@emotion/react';
import { CalendarDays as CalendarDaysIcon, Trash2 as Trash2Icon } from 'lucide-react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import { createListCollection, Editable, IconButton } from "@chakra-ui/react"
import { OpenChangeDetails } from '@zag-js/dialog';
import { Button, Stack, Fieldset } from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

import { Table } from "@chakra-ui/react"
import { HolidayInfoListType, HolidayInfoType } from '@/store/holiday';
import { useEffect, useState } from 'react';


// 記念日を定義のプロパティの型
type PopupAnniversarysEditorProps = {
  open: boolean;
  onClose: () => void;
  value: HolidayInfoListType,
  onChange: (newHolidays: HolidayInfoListType) => void;
}

type HolidaysListProps = {
  dialogContentRef: React.RefObject<HTMLDivElement>;
  holidays: HolidayInfoListType;
  onHolidaysChange: (newHolidays: HolidayInfoListType) => void;
}


// function DatePicker() {
// }

// 年月日を分解
function parseDate(date: string): number[] {
  const date_ = date.split('/');
  if (3 !== date_.length) {
    return [];
  }
  const date__ = date_.map(d => (+d || -1));
  const date___ = new Date(date__[0], date__[1] - 1, date__[2]);
  if (date___.getFullYear() !== date__[0] ||
      date___.getMonth() + 1 !== date__[1] ||
      date___.getDate() !== date__[2]) {
    return [];
  }
  return date__;
}

// 年月日を結合
function joinDate(date: number[]) {
  return `${("0000"+date[0]).substr(-4)}/${("00"+date[1]).substr(-2)}/${("00"+date[2]).substr(-2)}`;
}

// 年月日文字列を比較
function compByDate(a: [string, HolidayInfoType], b: [string, HolidayInfoType]): number {
  const ak = a[0];
  const bk = b[0];
  if (a !== b) {
    const a = parseDate(ak);
    const b = parseDate(bk);
    if (a.length !== b.length) {
      return a.length < b.length ? -1 : 1;
    }
    if (a[0] !== b[0]) {
      return a[0] < b[0] ? -1 : 1;
    }
    if (a[1] !== b[1]) {
      return a[1] < b[1] ? -1 : 1;
    }
    if (a[2] !== b[2]) {
      return a[2] < b[2] ? -1 : 1;
    }
  }
  return 0;
}

// 編集用フィールド
function EditableField(props: {
  value: string, onChangeValue: (value: string) => void,
  clearWhenCommit?: boolean,
} & Editable.RootProps & React.RefAttributes<HTMLDivElement>) {
  const {
      value, onChangeValue,
      clearWhenCommit = false,
      css,
      ...rootProps
    } = props;
  const [ inputValue, setInputValue ] = useState<string>("");
  useEffect(() => { setInputValue(value); }, [value]);
  //console.log("EditableField",{value});
  return (
    <Editable.Root
      textAlign="start"
      css={css as FunctionInterpolation<Theme>}
      {...rootProps}
      value={inputValue}
      onValueChange={(e) => setInputValue(e.value)}
      onValueCommit={(e) => {
        onChangeValue(e.value);
        setInputValue(value);
        if (clearWhenCommit) {
          setInputValue("");
        }
      }}
    >
      <Editable.Preview />
      <Editable.Input />
    </Editable.Root>
  );
}

// 記念日のマークの一覧
const AnniversaryMarkList = createListCollection({
  items: ["〇","♡","☆","🎂"],
});

// 記念日の一覧
function HolidaysList({
  dialogContentRef,
  holidays,
  onHolidaysChange,
}: HolidaysListProps) {
  const [ newDateField, setNewDateField ] = useState("");
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md" height="160px">
      <Table.Root size="sm" stickyHeader>
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader width="8rem">年月日</Table.ColumnHeader>
            <Table.ColumnHeader>名称</Table.ColumnHeader>
            <Table.ColumnHeader width="5rem">マーク</Table.ColumnHeader>
            <Table.ColumnHeader width="5rem">削除</Table.ColumnHeader>
            </Table.Row>
        </Table.Header>

        <Table.Body>
          {Array.from(holidays.entries()).map(([key, { date, name, mark }]) => (
            <Table.Row key={key}>
              <Table.Cell>
                <EditableField
                  placeholder="YYYY/MM/DD"
                  value={key}
                  onChangeValue={(value) => {
                    const date_ = parseDate(value);
                    if (date_.length < 1) {
                      onHolidaysChange(new Map(holidays));
                    } else {
                      const newHolidays = new Map(holidays);
                      newHolidays.delete(key);
                      newHolidays.set(joinDate(date_), { date, name, mark });
                      onHolidaysChange(new Map([...newHolidays].sort(compByDate)));
                    }
                  }}
                />
              </Table.Cell>
              <Table.Cell>
                <EditableField
                  placeholder="記念日の名称を入力してください"
                  value={name}
                  onChangeValue={(value) => {
                    const newHolidays = new Map(holidays);
                    newHolidays.set(key, { date, name: value, mark });
                    onHolidaysChange(new Map([...newHolidays].sort(compByDate)));
                  }}
                />
              </Table.Cell>
              <Table.Cell>
                <SelectRoot
                  collection={AnniversaryMarkList}
                  size="xs"
                  // @ts-ignore なんか定義がおかしい？
                  value={[mark]}
                  onValueChange={(e) => {
                    const newHolidays = new Map(holidays);
                    newHolidays.set(key, { date, name, mark: e.value[0] });
                    onHolidaysChange(new Map([...newHolidays].sort(compByDate)));
                  }}
                >
                  <SelectLabel />
                  <SelectTrigger>
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectContent
                    portalRef={dialogContentRef.current ? dialogContentRef as React.RefObject<HTMLElement> : undefined}
                  >
                    {AnniversaryMarkList.items.map(item => 
                      <SelectItem item={item} key={item}>
                        {item}
                      </SelectItem>
                    )}
                  </SelectContent>
                </SelectRoot>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  size="md"
                  variant="outline"
                  colorPalette="red"
                  onClick={() => {
                      const newHolidays = new Map(holidays);
                      newHolidays.delete(key);
                      onHolidaysChange(new Map([...newHolidays].sort(compByDate)));
                    }}
                >
                  <Trash2Icon />
                </IconButton>
              </Table.Cell>
            </Table.Row>
          ))}
            <Table.Row key="new">
              <Table.Cell>
                <EditableField
                  placeholder="YYYY/MM/DD"
                  value={newDateField}
                  onChangeValue={(value) => {
                    const date_ = parseDate(value);
                    if (0 < date_.length) {
                      const newHolidays = new Map(holidays);
                      newHolidays.set(joinDate(date_), {
                        date: date_[2],
                        name: "",
                        mark: AnniversaryMarkList.items[0]
                      });
                      onHolidaysChange(new Map([...newHolidays].sort(compByDate)));
                      setNewDateField("");
                    }
                  }}
                />
              </Table.Cell>
              <Table.Cell>
              </Table.Cell>
              <Table.Cell>
              </Table.Cell>
              <Table.Cell>
              </Table.Cell>
            </Table.Row>
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function PopupAnniversarysEditor({
  open, onClose,
  value, onChange,
}: PopupAnniversarysEditorProps) {
  
  const [ holidaysItems, setHolidaysItems ] = useState<HolidayInfoListType>(new Map());
  const [ dialogContentRef, setDialogContentRef ] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setHolidaysItems(new Map([...value].sort(compByDate)));
  }, [value]);

  return (
    <Dialog 
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
            <CalendarDaysIcon />
              記念日を定義
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

                <HolidaysList
                  dialogContentRef={{current:dialogContentRef} as React.RefObject<HTMLDivElement>}
                  holidays={holidaysItems}
                  onHolidaysChange={(newHolidays) => setHolidaysItems(newHolidays)}
                />

              </Stack>

              <Stack direction="row" gap="4" maxW="sm" css={css`
                  width: 100%;
                  max-width: 100%;
                  --field-label-width: auto;
              `} justifyContent="flex-end">

                <DialogActionTrigger asChild>
                  <Button variant="outline" alignSelf="stretch">変更を破棄</Button>
                </DialogActionTrigger>

                <Button 
                  type="submit" 
                  alignSelf="stretch" 
                  onClick={() => (onChange(holidaysItems), onClose())}
                >変更を保存</Button>
                
              </Stack>
            </Fieldset.Content>

          </Fieldset.Root>

        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default PopupAnniversarysEditor;
