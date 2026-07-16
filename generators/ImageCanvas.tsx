import { useEffect, useRef, useState } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { simplePositions, findSpecialPosition } from './P5/utils/portraitPositions';
import { findNameBox } from './P5/utils/findName';
import { findRandomNumbers, findTextCoords } from './P5/utils/nameAndTextTools';
import p4FindPosition from './P4/utils/portraitPositions';
import findWidth from './P4/utils/portraitWidths';

const P4S = 500 / 800;

const P4_BOX: Record<string, number[]> = {
  goldenBack: [38, 341, 750, 160],
  goldenFront: [27, 388, 750, 107],
  vanillaBack: [39, 328, 766, 171],
  vanillaFront: [47, 375, 750, 109],
};

const getP5Angle = (bt: string) => {
  switch (bt) {
    case 'noPortrait': return -18.55 * Math.PI / 180;
    case 'strikers': return -5.5 * Math.PI / 180;
    case 'dancing': return 0;
    default: return -14.65 * Math.PI / 180;
  }
};

let didLog = false;

const ImageCanvas = ({ activeGame, char, emote, costume, name, text, font, portrait, custom, boxType, setCustom }: any) => {
  const isP5 = activeGame === 'P5';
  const H = 500;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const nameBubbleRef = useRef<HTMLImageElement>(null);
  const dialogueBubbleRef = useRef<HTMLImageElement>(null);
  const customPortraitRef = useRef<HTMLImageElement>(null);
  const loadedFont = new FontFaceObserver(font);

  const [nameBoxSrc, setNameBoxSrc] = useState('');

  const bgSrc = isP5 ? './generators/P5/images/backgroundDot.png' : './generators/P4/images/p4-background.png';
  const p4BoxFront = !isP5 ? `./generators/P4/images/boxes/db-${boxType}-front.png` : '';
  const p4BoxBack = !isP5 ? `./generators/P4/images/boxes/db-${boxType}-back.png` : '';

  if (!didLog) {
    console.log('[ImageCanvas] bgSrc:', bgSrc);
    console.log('[ImageCanvas] p4BoxFront:', p4BoxFront);
    console.log('[ImageCanvas] p4BoxBack:', p4BoxBack);
    console.log('[ImageCanvas] portrait:', portrait);
    didLog = true;
  }

  useEffect(() => {
    if (!isP5) return;
    const c = document.createElement('canvas').getContext('2d');
    if (!c) return;
    c.font = `18pt ${font}`;
    const nm = c.measureText(name);
    let src = '';
    switch (boxType) {
      case 'main': {
        const cbox = findNameBox(name);
        if (cbox && (font === 'KoreanKRSM' || font === 'Optima nova LT')) { src = `./generators/P5/images/boxes/db-${cbox}-${font}.png`; break; }
        if (nm.width <= 195) src = './generators/P5/images/db-main-small.png';
        else if (nm.width <= 275) src = './generators/P5/images/db-main-medium.png';
        else src = './generators/P5/images/db-main-large.png';
        break;
      }
      case 'noPortrait': src = './generators/P5/images/db-noPortrait.png'; break;
      case 'dancing': src = './generators/P5/images/db-dancing.png'; break;
      case 'strikers': src = './generators/P5/images/db-strikers.png'; break;
      default: src = './generators/P5/images/db-main-small.png'; break;
    }
    if (src !== nameBoxSrc) setNameBoxSrc(src);
  }, [name, font, boxType]);

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1275, H);

    /* Step 2: Background */
    const bg = bgRef.current;
    if (bg && bg.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, 1275, H);
    }

    /* Step 3: Portrait */
    if (char !== 'None') {
      const useCustom = custom && customPortraitRef.current?.complete && customPortraitRef.current?.naturalWidth > 0;
      const img = useCustom ? customPortraitRef.current : portraitRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        if (isP5) {
          if (custom && setCustom) setCustom('');
          const pos = simplePositions[char as keyof typeof simplePositions] || findSpecialPosition(char, emote, costume);
          let x = pos[0], y = pos[1], w = 500, h = 500;
          if (costume === "Humanity's Companion") w = 580;
          if (char === 'Haru' && (costume === 'Swimsuit (Okinawa)' || costume === 'Road Trip (Hat)')) w = 570;
          ctx.drawImage(img, x, y, w, h);
        } else {
          if (custom && setCustom) setCustom('');
          const iH = img.height as number, iW = img.width as number;
          if (!iH || !iW) return;
          const sw = findWidth(char, emote, costume) * P4S;
          const ta = iH * sw;
          const nw = Math.sqrt((iW / iH) * ta);
          const nh = ta / nw;
          const pos = p4FindPosition(boxType, char, emote, costume);
          ctx.drawImage(img, pos[0] * P4S, pos[1] * P4S, nw, nh);
        }
      }
    }

    /* Step 4: Name bubble */
    if (isP5) {
      const nb = nameBubbleRef.current;
      if (nb && nb.complete && nb.naturalWidth > 0) {
        const w = nb.width as number, hwb = nb.height as number;
        switch (boxType) {
          case 'main': ctx.drawImage(nb, 320, 250 - (hwb - 250), w, hwb); break;
          case 'noPortrait': ctx.drawImage(nb, 320, 180, w, hwb); break;
          case 'dancing': ctx.drawImage(nb, 320, 300, w, hwb); break;
          case 'strikers': ctx.drawImage(nb, 320, 250, w, hwb); break;
        }
      }

      ctx.save();
      ctx.font = `18pt ${font}`;
      const nm = ctx.measureText(name);
      let textX: number, textY: number;

      const drawName = () => {
        switch (boxType) {
          case 'main':
          case 'noPortrait': {
            ctx.textAlign = 'left';
            textX = boxType === 'main' ? 418 : 392;
            textY = boxType === 'main' ? 438 : 425;

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

            ctx.rotate(getP5Angle(boxType));
            loadedFont.load().then(() => {
              let bx = textX - nm.width / 2, bx2 = 0, bx3 = 0;
              if (name.length > 1 && name.trim()) {
                for (let i = 0; i < r0; i++) bx += ctx.measureText(name[i]).width;
                const tm = ctx.measureText(name[r0]);
                ctx.fillRect(bx, textY - tm.fontBoundingBoxAscent - 4, tm.width, tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent + 7);
                if (name.length >= 8) {
                  bx2 = bx;
                  for (let i = r0; i < r1; i++) bx2 += ctx.measureText(name[i]).width;
                  const sm = ctx.measureText(name[r1]);
                  ctx.fillRect(bx2, textY - sm.fontBoundingBoxAscent - 3, sm.width, sm.fontBoundingBoxAscent + sm.fontBoundingBoxDescent + 7);
                  if (name.length >= 16) {
                    bx3 = bx2;
                    for (let i = r1; i < r2; i++) bx3 += ctx.measureText(name[i]).width;
                    const tmm = ctx.measureText(name[r2]);
                    ctx.fillRect(bx3, textY - tmm.fontBoundingBoxAscent - 3, tmm.width, tmm.fontBoundingBoxAscent + tmm.fontBoundingBoxDescent + 6);
                  }
                }
              } else if (name.length === 1) {
                ctx.fillStyle = '#000000'; ctx.fillText(name, textX, textY);
              }

              ctx.fillStyle = '#000000';
              ctx.fillText(beforeBox, textX - nm.width / 2, textY);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(behindBox, bx, textY);
              ctx.fillStyle = '#000000';
              ctx.fillText(afterBox, bx + ctx.measureText(name[r0]).width, textY);

              if (name.length >= 8) {
                ctx.fillStyle = '#FFFFFF'; ctx.fillText(sb, bx2, textY);
                ctx.fillStyle = '#000000'; ctx.fillText(sa, bx2 + ctx.measureText(name[r1]).width, textY);
                if (name.length >= 16) {
                  ctx.fillStyle = '#FFFFFF'; ctx.fillText(tb, bx3, textY);
                  ctx.fillStyle = '#000000'; ctx.fillText(ta, bx3 + ctx.measureText(name[r2]).width, textY);
                }
              }
            });
            break;
          }
          case 'dancing': { ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(name, 660, 353); break; }
          case 'strikers': { ctx.textAlign = 'center'; ctx.fillStyle = '#000000'; ctx.font = `16.5pt ${font}`; ctx.fillText(name, 500, 371); break; }
        }
      };
      drawName();
      ctx.restore();
    } else {
      const nb = nameBubbleRef.current;
      if (nb && nb.complete && nb.naturalWidth > 0) {
        const key = `${boxType}Front` as keyof typeof P4_BOX;
        ctx.drawImage(nb, P4_BOX[key][0], P4_BOX[key][1], P4_BOX[key][2], P4_BOX[key][3]);
      }
    }

    /* Step 5: Dialogue bubble */
    if (!isP5) {
      const db = dialogueBubbleRef.current;
      if (db && db.complete && db.naturalWidth > 0) {
        const key = `${boxType}Back` as keyof typeof P4_BOX;
        ctx.drawImage(db, P4_BOX[key][0], P4_BOX[key][1], P4_BOX[key][2], P4_BOX[key][3]);
      }
    }

    /* Step 6: Dialogue text */
    if (isP5) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = boxType === 'strikers' ? `16pt ${font}` : `18pt ${font}`;
      const coords = findTextCoords[boxType as keyof typeof findTextCoords] || findTextCoords.main;
      const rows = text.split('\n');
      if (rows[1] === undefined) rows[1] = '';
      if (rows[2] === undefined) rows[2] = '';
      if (rows[0] && rows[1] && !rows[2]) { ctx.fillText(rows[0], coords[0], coords[1] + 14); ctx.fillText(rows[1], coords[0], coords[2] + 14); }
      else { ctx.fillText(rows[0], coords[0], coords[1]); ctx.fillText(rows[1], coords[0], coords[2]); ctx.fillText(rows[2], coords[0], coords[3]); }
    } else {
      ctx.font = `26pt ${font}`;
      loadedFont.load().then(() => {
        if (boxType === 'golden') {
          ctx.fillStyle = '#4B2A14';
          font === 'SkipStd-B' ? ctx.fillText(name, 80, 384) : ctx.fillText(name, 80, 382);
        } else {
          ctx.fillStyle = '#000000';
          font === 'SkipStd-B' ? ctx.fillText(name, 85, 369) : ctx.fillText(name, 85, 367);
        }
      });
      ctx.fillStyle = '#FFFFFF';
      const rows = text.split('\n');
      if (rows[1] === undefined) rows[1] = '';
      if (rows[2] === undefined) rows[2] = '';
      if (boxType === 'golden') { ctx.fillText(rows[0], 93, 419); ctx.fillText(rows[1], 93, 447); ctx.fillText(rows[2], 93, 475); }
      else { ctx.fillText(rows[0], 100, 403); ctx.fillText(rows[1], 100, 431); ctx.fillText(rows[2], 100, 459); }
    }
  };

  useEffect(() => { redraw(); }, [activeGame, char, emote, costume, name, text, font, portrait, custom, boxType, nameBoxSrc]);

  const onLoad = () => redraw();

  return (
    <div id="canvasDiv">
      <canvas ref={canvasRef} id="dialogueCanvas" width="1275" height={H} />
      <img alt="" ref={bgRef} className="hidden" src={bgSrc} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={portraitRef} className="hidden" src={portrait} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={nameBubbleRef} className="hidden" src={isP5 ? nameBoxSrc : p4BoxFront} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={dialogueBubbleRef} className="hidden" src={p4BoxBack} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={customPortraitRef} className="hidden" src={custom} crossOrigin="anonymous" onLoad={onLoad} />
    </div>
  );
};

export default ImageCanvas;
