import { useCallback, useRef, useState } from 'react'
import { PDFDocument, PageSizes, rgb } from 'pdf-lib'
import { Button } from "@chakra-ui/react";
import { css } from '@emotion/react'
import tmpl from '../templates/simple-light-pict/main.svg';

const makePageSize = (w: number, h: number): [number, number] => [
  w/25.4*72,
  h/25.4*72,
];
const MyPageSize = {
  ...PageSizes,
  B0JIS: makePageSize(1030,1456),
  B1JIS: makePageSize( 728,1030),
  B2JIS: makePageSize( 515, 728),
  B3JIS: makePageSize( 364, 515),
  B4JIS: makePageSize( 257, 364),
  B5JIS: makePageSize( 182, 257),
  B6JIS: makePageSize( 128, 182),
  B7JIS: makePageSize(  91, 128),
  B8JIS: makePageSize(  64,  91),
  B9JIS: makePageSize(  45,  64),
  B10JIS:makePageSize(  32,  45),
};

function getSVGLenByPDFUnit(x: SVGAnimatedLength) {
  const tmp = x.baseVal;
  tmp.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_IN);
  return tmp.value * 72;
}

function App() {

  const pdfRef: React.MutableRefObject<null | HTMLIFrameElement> = useRef(null);

  595.28
  210/2.54

  const handleMakePDF = useCallback(() => {
    async function createPdf() {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(MyPageSize.B6JIS);
      page.moveTo(110, 200);
      page.drawText('Hello World!');

      const parser = new DOMParser();
      const doc = parser.parseFromString(tmpl, "application/xml");
      doc.querySelectorAll("rect").forEach((rect) => {
        page.drawRectangle({
          x: getSVGLenByPDFUnit(rect.x),
          y: getSVGLenByPDFUnit(rect.y),
          width: getSVGLenByPDFUnit(rect.width),
          height: getSVGLenByPDFUnit(rect.height),
          borderColor: rgb(1, 0, 0),
          borderWidth: 1.5,
        })
      })

      const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
      if (pdfRef.current) {
        pdfRef.current.src = pdfDataUri;
      }
    }
    createPdf();
  }, []);

  return (
    <>
      <div>
        <Button
          onClick={handleMakePDF}
        >make pdf</Button>
        <iframe ref={pdfRef} css={css`width: 100%;`} />
      </div>
    </>
  )
}

export default App
