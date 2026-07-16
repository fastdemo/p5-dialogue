import { useEffect, useRef, useState } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { simplePositions, findSpecialPosition } from './P5/utils/portraitPositions';
import { findNameBox } from './P5/utils/findName';
import { findRandomNumbers, findTextCoords } from './P5/utils/nameAndTextTools';
import p4FindPosition from './P4/utils/portraitPositions';
import findWidth from './P4/utils/portraitWidths';

const P4_BOX: Record<string, number[]> = {
  goldenBack: [61, 546, 1200, 256],
  goldenFront: [42.5, 621, 1200, 171],
  vanillaBack: [63, 524, 1225, 274],
  vanillaFront: [75, 600, 1200, 175],
};

let didLog = false;

const ImageCanvas = ({ activeGame, char, emote, costume, name, text, font, portrait, custom, boxType, setCustom, boxBack, boxFront }: any) => {
  const isP5 = activeGame === 'P5';
  const H = isP5 ? 500 : 800;
  const loadedFont = new FontFaceObserver(font);

  const portraitCanvas = useRef<HTMLCanvasElement>(null);
  const boxCanvas = useRef<HTMLCanvasElement>(null);
  const tileCanvas = useRef<HTMLCanvasElement>(null);
  const nameCanvas = useRef<HTMLCanvasElement>(null);
  const boxBackCanvas = useRef<HTMLCanvasElement>(null);
  const boxFrontCanvas = useRef<HTMLCanvasElement>(null);
  const textCanvas = useRef<HTMLCanvasElement>(null);
  const character = useRef<HTMLImageElement>(null);
  const customChar = useRef<HTMLImageElement>(null);
  const dialogueBox = useRef<HTMLImageElement>(null);
  const dialogueBoxBack = useRef<HTMLImageElement>(null);
  const dialogueBoxFront = useRef<HTMLImageElement>(null);

  const lastBoxType = useRef(boxType);
  const [p5BoxSrc, setP5BoxSrc] = useState('');

  if (!didLog) {
    console.log('[ImageCanvas] P4 boxBack path:', boxBack);
    console.log('[ImageCanvas] P4 boxFront path:', boxFront);
    console.log('[ImageCanvas] portrait path:', portrait);
    didLog = true;
  }

  /* ---------- P5: init tile/name rotation once ---------- */
  useEffect(() => {
    if (!isP5) return;
    const tc = tileCanvas.current?.getContext('2d');
    if (tc) tc.rotate(-14.65 * Math.PI / 180);
    const nc = nameCanvas.current?.getContext('2d');
    if (nc) { nc.textAlign = 'left'; nc.rotate(-14.65 * Math.PI / 180); }
  }, []);

  /* ---------- P5: box-type rotation update ---------- */
  useEffect(() => {
    if (!isP5) return;
    const tc = tileCanvas.current?.getContext('2d');
    const nc = nameCanvas.current?.getContext('2d');
    if (!tc || !nc) return;

    const rot = (bt: string, s: number) => {
      const a = s * Math.PI / 180;
      switch (bt) {
        case 'main': nc.rotate(a * 14.65); tc.rotate(a * 14.65); break;
        case 'dancing': break;
        case 'noPortrait': nc.rotate(a * 18.55); tc.rotate(a * 18.55); break;
        case 'strikers': nc.rotate(a * 5.5); tc.rotate(a * 5.5); break;
        default: nc.rotate(a * 14.65); tc.rotate(a * 14.65); break;
      }
    };
    tc.clearRect(0, 0, 1275, 500);
    nc.clearRect(0, 0, 1275, 500);
    rot(lastBoxType.current, 1);
    rot(boxType, -1);
    lastBoxType.current = boxType;
  }, [boxType]);

  /* ---------- P5: name + tile drawing + box URL ---------- */
  useEffect(() => {
    if (!isP5) return;
    const tc = tileCanvas.current?.getContext('2d');
    const nc = nameCanvas.current?.getContext('2d');
    if (!tc || !nc) return;

    tc.clearRect(0, 0, 1275, 500);
    nc.font = `18pt ${font}`;
    nc.clearRect(0, 0, 1275, 500);
    const nm = nc.measureText(name);
    let textX: number, textY: number;

    const go = () => {
      switch (boxType) {
        case 'main':
        case 'noPortrait': {
          nc.textAlign = 'left';
          textX = boxType === 'main' ? 418 : 392;
          textY = boxType === 'main' ? 438 : 425;
          if (boxType === 'main') {
            const cbox = findNameBox(name);
            if (cbox && (font === 'KoreanKRSM' || font === 'Optima nova LT')) { setP5BoxSrc(`./generators/P5/images/boxes/db-${cbox}-${font}.png`); return; }
            if (nm.width <= 195) { setP5BoxSrc('./generators/P5/images/db-main-small.png'); textX = 418; }
            else if (nm.width <= 275) { setP5BoxSrc('./generators/P5/images/db-main-medium.png'); textX = 456; }
            else { setP5BoxSrc('./generators/P5/images/db-main-large.png'); textX = 495; }
          } else { setP5BoxSrc('./generators/P5/images/db-noPortrait.png'); }

          const rn = findRandomNumbers(name);
          const r0 = rn[0], r1 = rn[1], r2 = rn[2];
          const beforeBox = name.substring(0, r0);
          const behindBox = name.substring(r0, r0 + 1);
          let afterBox = name.substring(r0 + 1);
          let sb = '', sa = '', tb = '', ta = '';

          if (name.length >= 8) {
            sa = name.substring(r1 + 1);
            sb = name.substring(r1, r1 + 1);
            afterBox = name.substring(r0 + 1, r1);
            if (name.length >= 16) {
              sa = name.substring(r1 + 1, r2);
              tb = name.substring(r2, r2 + 1);
              ta = name.substring(r2 + 1);
            }
          }

          loadedFont.load().then(() => {
            let bx = textX - nm.width / 2, bx2 = 0, bx3 = 0;
            if (name.length > 1 && name.trim()) {
              for (let i = 0; i < r0; i++) bx += nc.measureText(name[i]).width;
              const tm = nc.measureText(name[r0]);
              tc.fillRect(bx, textY - tm.fontBoundingBoxAscent - 4, tm.width, tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent + 7);
              if (name.length >= 8) {
                bx2 = bx;
                for (let i = r0; i < r1; i++) bx2 += nc.measureText(name[i]).width;
                const sm = nc.measureText(name[r1]);
                tc.fillRect(bx2, textY - sm.fontBoundingBoxAscent - 3, sm.width, sm.fontBoundingBoxAscent + sm.fontBoundingBoxDescent + 7);
                if (name.length >= 16) {
                  bx3 = bx2;
                  for (let i = r1; i < r2; i++) bx3 += nc.measureText(name[i]).width;
                  const tmm = nc.measureText(name[r2]);
                  tc.fillRect(bx3, textY - tmm.fontBoundingBoxAscent - 3, tmm.width, tmm.fontBoundingBoxAscent + tmm.fontBoundingBoxDescent + 6);
                }
              }
            } else if (name.length === 1) {
              nc.fillStyle = '#000000'; nc.fillText(name, textX, textY); return;
            }

            nc.fillStyle = '#000000';
            nc.fillText(beforeBox, textX - nm.width / 2, textY);
            nc.fillStyle = '#FFFFFF';
            nc.fillText(behindBox, bx, textY);
            nc.fillStyle = '#000000';
            nc.fillText(afterBox, bx + nc.measureText(name[r0]).width, textY);

            if (name.length >= 8) {
              nc.fillStyle = '#FFFFFF'; nc.fillText(sb, bx2, textY);
              nc.fillStyle = '#000000'; nc.fillText(sa, bx2 + nc.measureText(name[r1]).width, textY);
              if (name.length >= 16) {
                nc.fillStyle = '#FFFFFF'; nc.fillText(tb, bx3, textY);
                nc.fillStyle = '#000000'; nc.fillText(ta, bx3 + nc.measureText(name[r2]).width, textY);
              }
            }
          });
          break;
        }
        case 'dancing': { nc.textAlign = 'center'; nc.fillStyle = '#FFFFFF'; nc.fillText(name, 660, 353); setP5BoxSrc('./generators/P5/images/db-dancing.png'); break; }
        case 'strikers': { nc.textAlign = 'center'; nc.fillStyle = '#000000'; nc.font = `16.5pt ${font}`; nc.fillText(name, 500, 371); setP5BoxSrc('./generators/P5/images/db-strikers.png'); break; }
      }
    };
    go();
  }, [name, font, boxType]);

  /* ---------- text drawing ---------- */
  useEffect(() => {
    const tCtx = textCanvas.current?.getContext('2d');
    if (!tCtx) return;
    if (isP5) {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.font = boxType === 'strikers' ? `16pt ${font}` : `18pt ${font}`;
      tCtx.clearRect(0, 0, 1275, 500);
      const coords = findTextCoords[boxType as keyof typeof findTextCoords] || findTextCoords.main;
      const rows = text.split('\n');
      if (rows[1] === undefined) rows[1] = '';
      if (rows[2] === undefined) rows[2] = '';
      if (rows[0] && rows[1] && !rows[2]) { tCtx.fillText(rows[0], coords[0], coords[1] + 14); tCtx.fillText(rows[1], coords[0], coords[2] + 14); }
      else { tCtx.fillText(rows[0], coords[0], coords[1]); tCtx.fillText(rows[1], coords[0], coords[2]); tCtx.fillText(rows[2], coords[0], coords[3]); }
    } else {
      tCtx.clearRect(0, 0, 1275, 800);
      tCtx.font = `26pt ${font}`;
      loadedFont.load().then(() => {
        if (boxType === 'golden') {
          tCtx.fillStyle = '#4B2A14';
          font === 'SkipStd-B' ? tCtx.fillText(name, 80, 615) : tCtx.fillText(name, 80, 612);
        } else {
          tCtx.fillStyle = '#000000';
          font === 'SkipStd-B' ? tCtx.fillText(name, 85, 590) : tCtx.fillText(name, 85, 587);
        }
      });
      tCtx.fillStyle = '#FFFFFF';
      const rows = text.split('\n');
      if (rows[1] === undefined) rows[1] = '';
      if (rows[2] === undefined) rows[2] = '';
      if (boxType === 'golden') { tCtx.fillText(rows[0], 93, 670); tCtx.fillText(rows[1], 93, 715); tCtx.fillText(rows[2], 93, 760); }
      else { tCtx.fillText(rows[0], 100, 645); tCtx.fillText(rows[1], 100, 690); tCtx.fillText(rows[2], 100, 735); }
    }
  }, [text, font, boxType, name, isP5]);

  /* ---------- redraw portrait via effect (catches cached images) ---------- */
  useEffect(() => {
    const img = character.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      drawPortrait(img, isP5 ? 500 : findWidth(char, emote, costume));
    }
  }, [portrait, char, emote, costume, boxType, isP5]);

  /* ---------- P4: redraw boxBack via effect ---------- */
  useEffect(() => {
    if (isP5) return;
    const img = dialogueBoxBack.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) drawBoxBack(img);
  }, [boxBack, isP5]);

  /* ---------- P4: redraw boxFront via effect ---------- */
  useEffect(() => {
    if (isP5) return;
    const img = dialogueBoxFront.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) drawBoxFront(img);
  }, [boxFront, isP5]);

  /* ---------- P4: redraw portrait on version change ---------- */
  useEffect(() => {
    if (isP5 || char === 'None') return;
    const img = character.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      drawPortrait(img, findWidth(char, emote, costume));
    }
  }, [boxType]);

  /* ---------- clear portrait on None ---------- */
  useEffect(() => {
    if (char !== 'None') return;
    const pCtx = portraitCanvas.current?.getContext('2d');
    if (pCtx) pCtx.clearRect(0, 0, 1275, H);
  }, [char, boxType]);

  /* ============ helpers ============ */
  const drawPortrait = (img: CanvasImageSource, width: number) => {
    const pCtx = portraitCanvas.current?.getContext('2d');
    if (!pCtx) return;
    if (isP5) {
      pCtx.clearRect(0, 0, 1275, 500);
      const pos = simplePositions[char as keyof typeof simplePositions] || findSpecialPosition(char, emote, costume);
      let x = pos[0], y = pos[1], w = 500, h = 500;
      if (costume === "Humanity's Companion") w = 580;
      if (char === 'Haru' && (costume === 'Swimsuit (Okinawa)' || costume === 'Road Trip (Hat)')) w = 570;
      pCtx.drawImage(img, x, y, w, h);
    } else {
      if (custom && setCustom) setCustom('');
      pCtx.clearRect(0, 0, 1275, 800);
      const iH = img.height as number, iW = img.width as number;
      if (!iH || !iW) return;
      const ta = iH * width;
      const nw = Math.sqrt((iW / iH) * ta);
      const nh = ta / nw;
      const pos = p4FindPosition(boxType, char, emote, costume);
      pCtx.drawImage(img, pos[0], pos[1], nw, nh);
    }
  };

  const drawCustomPortrait = (img: CanvasImageSource) => {
    const pCtx = portraitCanvas.current?.getContext('2d');
    if (!pCtx) return;
    if (isP5) { pCtx.clearRect(0, 0, 1275, 500); pCtx.drawImage(img, 0, 0, img.width as number, img.height as number); }
    else { pCtx.clearRect(0, 0, 1275, 800); const x = boxType === 'golden' ? 795 : 870; const y = boxType === 'golden' ? 175 : 154; pCtx.drawImage(img, x, y, img.width as number, img.height as number); }
  };

  const drawBox = (img: CanvasImageSource) => {
    if (!isP5) return;
    const bCtx = boxCanvas.current?.getContext('2d');
    if (!bCtx) return;
    bCtx.clearRect(0, 0, 1275, 500);
    const w = img.width as number, h = img.height as number;
    switch (boxType) {
      case 'main': bCtx.drawImage(img, 320, 250 - (h - 250), w, h); break;
      case 'noPortrait': bCtx.drawImage(img, 320, 180, w, h); break;
      case 'dancing': bCtx.drawImage(img, 320, 300, w, h); break;
      case 'strikers': bCtx.drawImage(img, 320, 250, w, h); break;
    }
  };

  const drawBoxBack = (img: CanvasImageSource) => {
    if (isP5) return;
    const bCtx = boxBackCanvas.current?.getContext('2d');
    if (!bCtx) return;
    bCtx.clearRect(0, 0, 1275, 800);
    const pos = boxType === 'golden' ? P4_BOX.goldenBack : P4_BOX.vanillaBack;
    bCtx.drawImage(img, pos[0], pos[1], pos[2], pos[3]);
  };

  const drawBoxFront = (img: CanvasImageSource) => {
    if (isP5) return;
    const bCtx = boxFrontCanvas.current?.getContext('2d');
    if (!bCtx) return;
    bCtx.clearRect(0, 0, 1275, 800);
    const pos = boxType === 'golden' ? P4_BOX.goldenFront : P4_BOX.vanillaFront;
    bCtx.drawImage(img, pos[0], pos[1], pos[2], pos[3]);
  };

  return (
    <main id="canvasDiv">
      {isP5 ? (
        <>
          <canvas ref={portraitCanvas} id="portraitCanvas" width="1275" height="500" />
          <canvas ref={boxCanvas} id="boxCanvas" width="1275" height="500" />
          <canvas ref={tileCanvas} id="tileCanvas" width="1275" height="500" />
          <canvas ref={nameCanvas} id="nameCanvas" width="1275" height="500" />
          <canvas ref={textCanvas} id="textCanvas" width="1275" height="500" />
        </>
      ) : (
        <>
          <canvas ref={boxBackCanvas} id="boxBackCanvas" width="1275" height="800" />
          <canvas ref={portraitCanvas} id="portraitCanvas" width="1275" height="800" />
          <canvas ref={boxFrontCanvas} id="boxFrontCanvas" width="1275" height="800" />
          <canvas ref={textCanvas} id="textCanvas" width="1275" height="800" />
        </>
      )}

      {isP5 && <img alt="" ref={dialogueBox} id="box" className="hidden" src={p5BoxSrc} crossOrigin="anonymous" onLoad={() => { const i = dialogueBox.current; if (i) drawBox(i); }} />}
      {!isP5 && (
        <>
          <img alt="" ref={dialogueBoxBack} id="boxBack" className="hidden" src={boxBack} crossOrigin="anonymous" onLoad={() => { const i = dialogueBoxBack.current; if (i) drawBoxBack(i); }} />
          <img alt="" ref={dialogueBoxFront} id="boxFront" className="hidden" src={boxFront} crossOrigin="anonymous" onLoad={() => { const i = dialogueBoxFront.current; if (i) drawBoxFront(i); }} />
        </>
      )}
      <img alt="" ref={character} id="portrait" className="hidden" src={portrait} crossOrigin="anonymous"
        onLoad={() => { const i = character.current; if (i) drawPortrait(i, isP5 ? 500 : findWidth(char, emote, costume)); }} />
      <img alt="" ref={customChar} id="custom" className="hidden" src={custom} crossOrigin="anonymous"
        onLoad={() => { const i = customChar.current; if (i) drawCustomPortrait(i); }} />
    </main>
  );
};

export default ImageCanvas;
