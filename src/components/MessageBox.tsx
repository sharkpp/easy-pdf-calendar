// メッセージ表示用コンポーネント

import { Button, For, HStack } from "@chakra-ui/react"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Flex } from "@chakra-ui/react"

// プロパティの型
type MessageBoxProps = {
  title?: string;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactElement;
  onClose: () => void;
  children: React.ReactElement | string;
}

function MessageBox({
  title = "簡単PDFカレンダー",
  size = "md",
  icon = undefined,
  onClose,
  children,
}: MessageBoxProps) {

  return (
    <DialogRoot
      open={true}
      onOpenChange={onClose}
      size={size}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogTrigger asChild>
        <Button variant="outline" size={size}>
          Open ({size})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Flex gap={4}>
            {icon}
            <p>{children}</p>
          </Flex>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button>閉じる</Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default MessageBox;
