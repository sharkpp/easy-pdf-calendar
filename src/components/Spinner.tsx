// カレンダーの形のスピナー

import { css } from "@emotion/react";

// プロパティの型
type SpinnerProps = {
}

const cssStyle = css`
  /* カラーテーマ用変数 */
  --bg-color: #fff;          /* 全体の背景色 */
  --border-color: #333;      /* 枠線の色 */
  --header-color: #333;      /* ヘッダー部分の色 */
  --date-color: #f0f0f0;     /* 日付セルの通常色（明るいグレー） */
  --active-date-color: #000; /* 日付セルのアクティブ色（真っ黒） */
  --shadow-color: rgba(0, 0, 0, 0.1); /* シャドウの色 */

  /* 全体のスタイル */
  .calendar-spinner {
    width: 120px;
    height: 140px;
    border: 2px solid var(--border-color);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: var(--bg-color);
    box-shadow: 0 4px 8px var(--shadow-color);
  }

  /* カレンダーのヘッダー部分 */
  .calendar-header {
    width: 100%;
    height: 16px;
    background-color: var(--header-color);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  /* 日付部分の配置 */
  .calendar-dates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
    padding: 5px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-left:   2px solid var(--border-color);
    border-right:  2px solid var(--border-color);
    border-bottom: 2px solid var(--border-color);
  }

  /* 各日付セル */
  .calendar-dates > div {
    width: 15px;
    height: 15px;
    background-color: var(--date-color);
    border-radius: 4px;
    animation: blink 1.5s infinite ease-in-out;
  }

  /* 点滅アニメーション */
  @keyframes blink {
    0%, 100% {
      background-color: var(--date-color); /* 明るい状態 */
    }
    50% {
      background-color: var(--active-date-color); /* 暗い状態 */
    }
  }

  /* 各日付セルのアニメーション遅延 */
  .calendar-dates > div:nth-of-type(1) { animation-delay: 0s; }
  .calendar-dates > div:nth-of-type(2) { animation-delay: 0.2s; }
  .calendar-dates > div:nth-of-type(3) { animation-delay: 0.4s; }
  .calendar-dates > div:nth-of-type(4) { animation-delay: 0.6s; }
  .calendar-dates > div:nth-of-type(5) { animation-delay: 0.8s; }
  .calendar-dates > div:nth-of-type(6) { animation-delay: 1s; }
  .calendar-dates > div:nth-of-type(7) { animation-delay: 1.2s; }
  .calendar-dates > div:nth-of-type(8) { animation-delay: 1.4s; }
  .calendar-dates > div:nth-of-type(9) { animation-delay: 1.6s; }

`;

function Spinner({
}: SpinnerProps) {

  return (
    <div css={cssStyle}>
      <div className="calendar-header"></div>
      <div className="calendar-dates">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  )
}

export default Spinner;
