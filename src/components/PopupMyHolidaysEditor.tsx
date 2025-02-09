// 独自の記念日を定義

import { css, FunctionInterpolation, Theme } from '@emotion/react';
import { CalendarDays as CalendarDaysIcon } from 'lucide-react';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot as Dialog,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import { createListCollection, Editable } from "@chakra-ui/react"
import { OpenChangeDetails } from '@zag-js/dialog';
import { Button, Stack, Fieldset } from "@chakra-ui/react"
import { Field } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { optionsSelector, useOptions, useVolatileOptions } from '@/store/options';
import { useShallow } from 'zustand/react/shallow';

import { Table } from "@chakra-ui/react"
import { HolidayInfoListType, HolidayInfoType } from '@/store/holiday';
import { useEffect, useRef, useState } from 'react';


// 独自の記念日を定義のプロパティの型
type PopupMyHolidaysEditorProps = {
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


function DatePicker() {
  
}

const defaultItems = new Map();
defaultItems.set('2025/4/30',{date:30,name:"テスト"});
defaultItems.set('2025/4/31',{date:31,name:"テスト"});

function splitDate(date: string): number[] {
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

function compByDate(a: [string, HolidayInfoType], b: [string, HolidayInfoType]): number {
  const ak = a[0];
  const bk = b[0];
  if (a !== b) {
    const a = splitDate(ak);
    const b = splitDate(bk);
    console.log({ak,bk,a,b})
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

const HolidayMarkList = createListCollection({
  items: ["〇","♡","☆"],
});
console.log({HolidayMarkList})
function HolidaysList({
  dialogContentRef,
  holidays,
  onHolidaysChange,
}: HolidaysListProps) {
  console.log("HolidaysList",dialogContentRef)
  const [ newDateField, setNewDateField ] = useState("");
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md" height="160px">
      <Table.Root size="sm" stickyHeader>
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader width="8rem">年月日</Table.ColumnHeader>
            <Table.ColumnHeader>名称</Table.ColumnHeader>
            <Table.ColumnHeader width="5rem">マーク</Table.ColumnHeader>
            </Table.Row>
        </Table.Header>

        <Table.Body>
          {Array.from(holidays.entries()).map(([key, { date, name, mark }]) => (
            <Table.Row key={key}>
              <Table.Cell>
                <EditableField
                  placeholder="YYYY/MM/DD"
                  value={key}
                  onChangeValue={(value) => {console.log(value)
                    const date_ = splitDate(value);
                    if (date_.length < 1) {
                      onHolidaysChange(new Map(holidays));
                    } else {
                      const newHolidays = new Map(holidays);
                      newHolidays.delete(key);
                      newHolidays.set(value, { date, name, mark });
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
                  collection={HolidayMarkList}
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
                    {HolidayMarkList.items.map(item => 
                      <SelectItem item={item} key={item}>
                        {item}
                      </SelectItem>
                    )}
                  </SelectContent>
                </SelectRoot>
              </Table.Cell>
            </Table.Row>
          ))}
            <Table.Row key="new">
              <Table.Cell>
                <EditableField
                  placeholder="YYYY/MM/DD"
                  value={newDateField}
                  onChangeValue={(value) => {
                    const date_ = splitDate(value);
                    if (0 < date_.length) {
                      const newHolidays = new Map(holidays);
                      newHolidays.set(value, { date: date_[2], name: "" });
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
            </Table.Row>
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function PopupMyHolidaysEditor({
  open, onClose,
  value, onChange,
}: PopupMyHolidaysEditorProps) {
  
  const firstMonthIsApril = useOptions(useShallow(optionsSelector('firstMonthIsApril')));
  const setOption = useOptions(useShallow((state) => state.setOption));
  const [ holidaysItems, setHolidaysItems ] = useState<HolidayInfoListType>(defaultItems);
  //const dialogContentRef = useRef<HTMLDivElement>(null);
  const [ dialogContentRef, setDialogContentRef ] = useState<HTMLDivElement | null>(null);
  console.log({holidaysItems,dialogContentRef:!!dialogContentRef})
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
              独自の記念日を定義
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

export default PopupMyHolidaysEditor;
