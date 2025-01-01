import { useCallback, useRef, useState } from 'react';
import { css } from '@emotion/react';
import tmpl from '../designs/simple-light-pict/main.svg?raw';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { useFont } from './hooks/jspdf-usefont';
import { PageSize } from './utils/jspdf-pagesize';
import DesignList from './components/DesignList';
import CalanderDesignPreview from './components/CalanderDesignPreview';

const MS24H = 24 * 60 * 60 * 1000;

function getSVGLenByMM(n: SVGAnimatedLength) {
  const tmp = n.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
  return tmp.valueInSpecifiedUnits;
}

const UI = {
  SelectDesign: 0,
  PreviewCalenderMonth: 1,
};

function App()
{
  const refSvgHideContainer: React.MutableRefObject<null | HTMLIFrameElement> = useRef(null);
  const pdfRef: React.MutableRefObject<null | HTMLIFrameElement> = useRef(null);
  const notosans = useFont("Noto Sans Gothic", "/assets/fonts/NotoSansJP-Medium.ttf")
  const handleMakePDF = useCallback(() => {
    async function makePdf() {
      const year = 2025;
      const doc = new jsPDF({
        orientation: 'l',
        format: PageSize.B6JIS
      });
      const svgContainer = document.createElement("div");
      svgContainer.innerHTML = tmpl;
      const svgCalender = svgContainer.firstElementChild;
      await notosans.install(doc);
      if (svgCalender) {
        doc.setFont(notosans.name);
        const monthes = new Array(12).fill(0).map((_, i: number) => i + 1);
        for await (const month of monthes) {
          if (1 < month) {
            doc.addPage(PageSize.B6JIS, 'l');
          }
          const svgCalender_ = svgCalender.cloneNode(true) as SVGElement;
          if (refSvgHideContainer.current) {
            refSvgHideContainer.current.replaceChildren(svgCalender_);
          }
          //const monthElm = svgCalender_.querySelector('*[id="month"],*[inkscape\\:label="month"]');
          // 月は *[inkscape\\:label="month"] 要素の表示を変える
          const monthElm: SVGElement | null = svgCalender_.querySelector(`*[id="m-${month}"],*[inkscape\\:label="m-${month}"]`);
          if (monthElm) {
            monthElm.style.display = "";
          }
          const firstDateOfMonth = new Date(year, month-1, 1); // 今月の最初の日
          const firstDayOfWeek = firstDateOfMonth.getDay(); // 今月最初の日の曜日(日曜:0 - 土曜:6)
          const lastDateOfMonth = new Date(new Date(year, month-1+1, 1).getTime() - MS24H).getDate(); // 今月の最後の日
          const lastDateOfPrevMonth = new Date(firstDateOfMonth.getTime() - MS24H).getDate(); // 先月の最後の日

          let dateBox = new Array(7 * 6).fill(0); // 0:空欄 1〜:今月の日 〜-1:先月or来月の日
          // 今月の日を設定
          for (let i = 0; i < lastDateOfMonth; ++i) {
            dateBox[i + firstDayOfWeek] = i + 1;
          }
          // 先月の日を設定
          for (let i = 0; i < 7; ++i) {
            if (0 <= firstDayOfWeek - 1 - i) {
              dateBox[firstDayOfWeek - 1 - i] = -(lastDateOfPrevMonth - i);
            }
          }
          // 来月の日を設定
          for (let i = 0; i < 14; ++i) {
            if (firstDayOfWeek + lastDateOfMonth + i < dateBox.length) {
              dateBox[firstDayOfWeek + lastDateOfMonth + i] = -(i + 1);
            }
          }

          console.log({firstDateOfMonth,firstDayOfWeek,lastDateOfMonth,lastDateOfPrevMonth,dateBox});

          dateBox.forEach((date, dateIndex) => {
            const dateBoxElm = svgCalender_.querySelector(`*[id^="day-${dateIndex}"],*[inkscape\\:label^="day-${dateIndex}"]`);
            console.log({date,dateIndex,dateBoxElm,x:getSVGLenByMM((dateBoxElm as SVGRectElement).x),y:getSVGLenByMM((dateBoxElm as SVGRectElement).y)});
            doc.text(
              ""+Math.abs(date),
              (dateBoxElm as SVGRectElement).x.baseVal.value + (dateBoxElm as SVGRectElement).width.baseVal.value / 2,
              (dateBoxElm as SVGRectElement).y.baseVal.value + (dateBoxElm as SVGRectElement).height.baseVal.value / 2,
              {
                align: "center",
                baseline: "middle",
              });
          });

          await doc.svg(svgCalender_);
        }


        if (pdfRef.current) {
          pdfRef.current.src = doc.output('datauristring');
        }
      }
    }
    makePdf();
  }, []);

  const [ design, setDesign ] = useState("");
  const [ year, setYear ] = useState(2025);
  const [ month, setMonth ] = useState(1);
  const [ ui, setUi ] = useState(UI.SelectDesign);

  return (
    <>
      <div
        css={css`padding: 1rem; width: 100%; height: 100%;`}
      >
        {ui == UI.SelectDesign && <DesignList
          design={design}
          year={year}
          onSelect={(designName) => {
            setDesign(designName);
            setUi(UI.PreviewCalenderMonth);
          }}
        />}
        {ui == UI.PreviewCalenderMonth && <CalanderDesignPreview
          design={design}
          year={year}
          month={month}
          onChangeDesign={(designName) => {
            setDesign(designName);
          }}
          onChangeMonth={(month) => {
            setMonth(month);
          }}
        />}
      </div>
      {/*
      <div ref={refSvgHideContainer} css={css`width: 0px;height: 200px;`}>
      </div>
      <div css={css`width: 100%;height: 100%;`}>
        <Button
          onClick={handleMakePDF}
        >make pdf</Button>
        <iframe ref={pdfRef} css={css`width: 100%;height: calc(100% - 40px);`} />
      </div>*/}
    </>
  )
}

export default App
