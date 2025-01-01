// ファイルドロップ用のコンポーネント

import React, { useCallback, useId } from 'react';
import { css, SerializedStyles } from '@emotion/react';
import { ImageUp } from 'lucide-react';

type DropZoneProps = {
  cssStyle?: SerializedStyles;
  onSelectFile?: (file: File, isDropped: boolean) => void;
}

// ドロップ領域のデザイン
const cssDropZone = css`
  border: 1px solid rgb(240,240,240);
  border-radius: 4px;
  label {
    padding: 5px 20px;
    cursor: pointer;
    border-radius:10px;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
  }
  input[type="file"] {
    display: none;
  }
  div {
    width: 100%;
    height: 100%;
    color: #ccc;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    word-break: keep-all;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    span {
      width: min-content;
      text-align: center;
      color: #999;
    }
  }
`;
// https://qiita.com/debiru/items/0a349bee3669b776d8e2
// https://zenn.dev/nbr41to/articles/55c08685c2d65f

function DropZone({ cssStyle, onSelectFile }: DropZoneProps)
{
  const fileInputId = useId();

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    //console.log(e.dataTransfer?.files,onSelectFile);
    if (0 < e.dataTransfer?.files.length) {
      if (onSelectFile) {
        onSelectFile(e.dataTransfer?.files[0], true);
      }
    }
  }, [onSelectFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    //console.log(e.target.files,onSelectFile);
    if (e.target.files && 0 < e.target.files.length) {
      if (onSelectFile) {
        onSelectFile(e.target.files[0], false);
      }
    }
  }, [onSelectFile]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      css={css`${cssStyle||''}${cssDropZone}`}
    >
      <label
        htmlFor={fileInputId}
      />
      <input
        type="file"
        id={fileInputId}
        onChange={onFileChange}
        accept="image/png, image/jpeg"
      />
      <div
      >
        <span>画像を<wbr />ドロップ<wbr />もしくは<wbr />クリックで<wbr />選択してください</span>
        <ImageUp size={64} />
      </div>
    </div>
  );
}

export default DropZone;

