import { useState } from 'react';
import { css } from '@emotion/react';
import DesignList from './components/DesignList';
import CalanderDesignPreview from './components/CalandarDesignPreview';
import { useYearSelect } from '@/store/date-select';

// 表示するUIの種類
const UI = {
  SelectDesign: 0, // デザインの選択画面
  PreviewCalendarMonth: 1, // カレンダーのプレビュー画面
};

function App()
{
  const [ design, setDesign ] = useState("");
  const year = useYearSelect.use.year();
  const [ month, setMonth ] = useState(1);
  const [ ui, setUi ] = useState(UI.SelectDesign);

  return (
    <>
      <div
        css={css`width: 100%; height: 100%;`}
      >
        {ui == UI.SelectDesign && <DesignList
          design={design}
          year={year}
          onSelect={(designName) => {
            setDesign(designName);
            setUi(UI.PreviewCalendarMonth);
          }}
        />}
        {ui == UI.PreviewCalendarMonth && <CalanderDesignPreview
          design={design}
          year={year}
          month={month}
          onChangeDesign={(designName) => setDesign(designName)}
          onChangeMonth={(month) => setMonth(month)}
        />}
      </div>
    </>
  )
}

export default App
