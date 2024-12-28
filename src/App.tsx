import { useCallback, useRef } from 'react';
import { Button } from "@chakra-ui/react";
import { css } from '@emotion/react';
import tmpl from '../designs/simple-light-pict/main.svg?raw';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { useFont } from './hooks/jspdf-usefont';
import { PageSize } from './utils/jspdf-pagesize';
import { convertPointsToUnit } from './utils/jspdf-convert-unit';

const MS24H = 24 * 60 * 60 * 1000;

function getSVGLenByMM(n: SVGAnimatedLength) {
  const tmp = n.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
  return tmp.valueInSpecifiedUnits;
}

type SVG_LENGTH_TYPE = 
  SVGLength["SVG_LENGTHTYPE_UNKNOWN"] |
  SVGLength["SVG_LENGTHTYPE_NUMBER"] |
  SVGLength["SVG_LENGTHTYPE_PERCENTAGE"] |
  SVGLength["SVG_LENGTHTYPE_EMS"] |
  SVGLength["SVG_LENGTHTYPE_EXS"] |
  SVGLength["SVG_LENGTHTYPE_PX"] |
  SVGLength["SVG_LENGTHTYPE_CM"] |
  SVGLength["SVG_LENGTHTYPE_MM"] |
  SVGLength["SVG_LENGTHTYPE_IN"] |
  SVGLength["SVG_LENGTHTYPE_PT"] |
  SVGLength["SVG_LENGTHTYPE_PC"] 
;

function convertSVGUserUnitTo(elm: SVGRectElement, n: number, unit: SVG_LENGTH_TYPE = SVGLength.SVG_LENGTHTYPE_MM) {
  const nn = elm.ownerSVGElement?.createSVGLength();
  nn?.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, n);
  nn?.convertToSpecifiedUnits(unit);
  return nn?.valueInSpecifiedUnits;
}

function getBBoxBy(elm: SVGRectElement, unit: SVG_LENGTH_TYPE = SVGLength.SVG_LENGTHTYPE_MM) {
  const bbox = elm.getBBox();
  return {
    x:      convertSVGUserUnitTo(elm, bbox.x,      unit) || 0,
    y:      convertSVGUserUnitTo(elm, bbox.y,      unit) || 0,
    width:  convertSVGUserUnitTo(elm, bbox.width,  unit) || 0,
    height: convertSVGUserUnitTo(elm, bbox.height, unit) || 0,
  }
}

function App() {

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
            const dateElm: SVGRectElement | null = svgCalender_.querySelector(
              date < 0
                ? `*[id^="d2-${-date}"],*[inkscape\\:label^="d2-${-date}"]` // 先月or来月
                : `*[id^="d-${date}"],*[inkscape\\:label^="d-${date}"]` // 今月
            );
            const dateBoxElm: SVGRectElement | null = svgCalender_.querySelector(
              `*[id^="day-${dateIndex}"],*[inkscape\\:label^="day-${dateIndex}"]`
            );
            if (!dateElm || !dateBoxElm) { 
              return;
            }
            dateElm.style.display = "block";
            const dateBoxBBoxByMM = getBBoxBy(dateBoxElm);

            const dateBoxXByMM = getSVGLenByMM((dateBoxElm as SVGRectElement).x);
            const dateBoxYByMM = getSVGLenByMM((dateBoxElm as SVGRectElement).y);
            const dateBoxWByMM = getSVGLenByMM((dateBoxElm as SVGRectElement).width);
            const dateBoxHByMM = getSVGLenByMM((dateBoxElm as SVGRectElement).height);

            const dateBBoxByMM = getBBoxBy(dateElm);
            const dateWByMM = dateBBoxByMM.width * dateBBoxByMM.width / dateBoxWByMM;
            const dateHByMM = dateBBoxByMM.height * dateBBoxByMM.height / dateBoxHByMM;
            console.log({date,dateElm,dateBoxElm,dateBoxXByMM,dateBoxYByMM,dateBoxWByMM,dateBoxHByMM,dateBoxBBoxByMM,dateBBoxByMM,dateWByMM,dateHByMM});
            const x = dateElm.ownerSVGElement?.createSVGLength();
            const y = dateElm.ownerSVGElement?.createSVGLength();
            x?.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxXByMM);// + (dateBoxWByMM - dateWByMM) / 2);
            y?.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxYByMM);// + (dateBoxHByMM - dateHByMM) / 2);
            //ateElm.x.baseVal.appendItem(x);// newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxXByMM + (dateBoxWByMM - dateWByMM) / 2);
            //dateElm.y.baseVal.appendItem(y);// newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxYByMM + (dateBoxHByMM - dateHByMM) / 2);
            dateElm.firstElementChild?.setAttribute("x", ""+x?.valueAsString);//.x.baseVal.value = x;// newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxXByMM + (dateBoxWByMM - dateWByMM) / 2);
            dateElm.firstElementChild?.setAttribute("y", ""+y?.valueAsString);//y.baseVal.value = y;// newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxYByMM + (dateBoxHByMM - dateHByMM) / 2);
            //dateElm.setAttribute("transform", ""+dateElm.transform().);//y.baseVal.value = y;// newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM, dateBoxYByMM + (dateBoxHByMM - dateHByMM) / 2);
            console.log({date,dateIndex,dateElm});

              // const dateStr = ""+Math.abs(date);
              // const dateStrSizePt = doc.getTextDimensions(dateStr);
              // const dateStrSizeMM = { w: convertPointsToUnit(dateStrSizePt.w, "mm"), h: convertPointsToUnit(dateStrSizePt.h, "mm") };
              // console.log({dateBoxElm,dateBoxXByMM,dateBoxYByMM,dateBoxWByMM,dateBoxHByMM,dateStrSizePt,dateStrSizeMM});
              // doc.text(
              //   dateStr,
              //   dateBoxXByMM + dateBoxWByMM / 2,
              //   dateBoxYByMM + dateBoxHByMM / 2,
              //   {
              //     align: "center",
              //     baseline: "middle",
              //   });
          });

          //console.log( svgCalender_.querySelectorAll('*[id^="day-"],*[inkscape\\:label^="day-"]'));
          // svgCalender_
          //   .querySelectorAll('*[id^="day-"],*[inkscape\\:label^="day-"]')
          //   .forEach((dayElm: Element) => {
          //     const id = dayElm.id;
          //     const inkscapeLabel = ((dayElm&&dayElm.attributes&&dayElm.attributes.getNamedItem("inkscape:label"))||{}).nodeValue;
          //     const dateNo = +((inkscapeLabel||id).match(/day-([0-9]+)/)||[])[1]||0;
          //     doc.text(
          //       ""+dateBox[dateNo],
          //       getSVGLenByMM((dayElm as SVGRectElement).x),
          //       getSVGLenByMM((dayElm as SVGRectElement).y),
          //       {
          //         align: "center",
          //         baseline: "middle",
          //       });
          //   });
          await doc.svg(svgCalender_);

          break;
        }


        if (pdfRef.current) {
          pdfRef.current.src = doc.output('datauristring');
        }
      }
    }
    makePdf();
  }, []);
  return (
    <>
      <div ref={refSvgHideContainer} css={css`width: 0px;height: 200px;`}>
      </div>
      <div css={css`width: 100%;height: 100%;`}>
        <Button
          onClick={handleMakePDF}
        >make pdf</Button>
        <iframe ref={pdfRef} css={css`width: 100%;height: calc(100% - 40px);`} />
      </div>
    </>
  )
}

export default App
