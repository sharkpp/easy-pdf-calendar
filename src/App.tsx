import { useCallback, useRef } from 'react';
import { Button } from "@chakra-ui/react";
import { css } from '@emotion/react';
import tmpl from '../designs/simple-light-pict/main.svg?raw';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { useFont } from './hooks/jspdf-use-font';

function App() {

  const pdfRef: React.MutableRefObject<null | HTMLIFrameElement> = useRef(null);

  const notosans = useFont("Noto Sans Gothic", "/assets/fonts/NotoSansJP-Medium.ttf")

  const handleMakePDF = useCallback(() => {
    const doc = new jsPDF();
    const svgContainer = document.createElement("div");
    svgContainer.innerHTML = tmpl;
    notosans.install(doc).then(() => {
      if (svgContainer.firstElementChild) {
        doc
          .setFont(notosans.name)
          .svg(svgContainer.firstElementChild, {
          })
          .then(() => {
            if (pdfRef.current) {
              pdfRef.current.src = doc.output('datauristring');
            }
          })
      }
    });
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
