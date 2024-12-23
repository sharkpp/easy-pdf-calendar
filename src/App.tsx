import { useCallback, useRef } from 'react';
import { Button } from "@chakra-ui/react";
import { css } from '@emotion/react';
import tmpl from '../designs/simple-light-pict/main.svg?raw';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { useFont } from './hooks/jspdf-usefont';
import { PageSize } from './utils/jspdf-pagesize';

function getSVGLenByMM(x: SVGAnimatedLength) {
  const tmp = x.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
  return tmp.value;
}

function App() {

  const pdfRef: React.MutableRefObject<null | HTMLIFrameElement> = useRef(null);

  const notosans = useFont("Noto Sans Gothic", "/assets/fonts/NotoSansJP-Medium.ttf")

  const handleMakePDF = useCallback(() => {
    async function makePdf() {
      const doc = new jsPDF({
        orientation: 'l',
        format: PageSize.B6JIS
      });
      const svgContainer = document.createElement("div");
      svgContainer.innerHTML = tmpl;
      const svgCalender = svgContainer.firstElementChild;
      console.log(">>",{svgContainer,svgCalender,notosans});
      await notosans.install(doc);
      console.log(">>",{svgContainer,notosans,svgCalender});
      if (svgCalender) {
        console.log(">>",{svgCalender});
        doc.setFont(notosans.name);
        const monthes = new Array(12).fill(0).map((_, i: number) => i + 1);
        for await (const month of monthes) {
          console.log(">>",{month});
          if (1 < month) {
            doc.addPage(PageSize.B6JIS, 'l');
          }
          const svgCalender_ = svgCalender.cloneNode(true) as SVGElement;
          //const monthElm = svgCalender_.querySelector('*[id="month"],*[inkscape\\:label="month"]');
          const monthElm: SVGElement | null = svgCalender_.querySelector(`*[id="m-${month}"],*[inkscape\\:label="m-${month}"]`);
          console.log(">>",{month,svgCalender_,monthElm});
          if (monthElm) {
            monthElm.style.display = "";
          }
          //doc
          //  .text(
          //    ""+month,
          //    getSVGLenByMM((monthElm as SVGRectElement).x),
          //    getSVGLenByMM((monthElm as SVGRectElement).y),
          //    {
          //      align: "center",
          //      baseline: "middle",
          //    }
          //  );
          svgCalender_
            .querySelectorAll('*[id^="day-"]')
            .forEach((dayElm: Element) => {
              doc.text(
                ""+0,
                getSVGLenByMM((dayElm as SVGRectElement).x),
                getSVGLenByMM((dayElm as SVGRectElement).y),
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
  return (
    <>
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
