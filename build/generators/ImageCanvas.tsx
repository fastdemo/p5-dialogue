import { useEffect, useRef, useState } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { simplePositions, findSpecialPosition } from './P5/utils/portraitPositions';
import { findNameBox } from './P5/utils/findName';
import p4FindPosition from './P4/utils/portraitPositions';
import findWidth from './P4/utils/portraitWidths';

const DW = 1275;
const DH = 500;

const getP5Angle = (bt: string) => {
  switch (bt) {
    case 'noPortrait': return -18.55 * Math.PI / 180;
    case 'strikers': return -5.5 * Math.PI / 180;
    case 'dancing': return 0;
    default: return -14.65 * Math.PI / 180;
  }
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    if (ctx.measureText(words[n]).width > maxWidth) {
      let subWord = words[n];
      while (subWord.length > 0) {
        let chunk = '';
        while (chunk.length < subWord.length && ctx.measureText(line + subWord[chunk.length]).width < maxWidth) {
          chunk += subWord[chunk.length];
        }
        if (chunk === '') {
          chunk = subWord[0];
        }
        lines.push(line + chunk);
        line = '';
        subWord = subWord.slice(chunk.length);
      }
      continue;
    }

    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const finalLines = lines.slice(0, maxLines);
  finalLines.forEach((lineStr, index) => {
    ctx.fillText(lineStr.trim(), x, y + (index * lineHeight));
  });
};

const ImageCanvas = ({ activeGame, char, emote, costume, name, text, font, portrait, custom, boxType, setCustom }: any) => {
  const isP5 = activeGame === 'P5';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const nameBubbleRef = useRef<HTMLImageElement>(null);
  const dialogueBubbleRef = useRef<HTMLImageElement>(null);
  const customPortraitRef = useRef<HTMLImageElement>(null);
  const fallbackFont = 'sans-serif';
  const [nameBoxSrc, setNameBoxSrc] = useState('');
  const [fontReady, setFontReady] = useState(fallbackFont);

  const bgSrc = isP5 ? './generators/P5/images/backgroundDot.png' : './generators/P4/images/p4-background.png';
  const p4BoxFront = !isP5 ? `./generators/P4/images/boxes/db-${boxType}-front.png` : '';
  const p4BoxBack = !isP5 ? `./generators/P4/images/boxes/db-${boxType}-back.png` : '';

  /* Compute P5 name box URL */
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

  /* Synchronously resolve font BEFORE redrawing so text is rendered in the main loop only */
  useEffect(() => {
    let cancelled = false;
    new FontFaceObserver(font)
      .load(null, 1500)
      .then(() => { if (!cancelled) setFontReady(font); })
      .catch(() => { if (!cancelled) setFontReady(fallbackFont); });
    return () => { cancelled = true; };
  }, [font]);

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    try {
      canvas.width = DW;
      canvas.height = DH;

      /* === Absolute matrix reset + clear (every frame) === */
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, DW, DH);

      /* === Layer 1: Wallpaper Background === */
      ctx.save();
      const bg = bgRef.current;
      if (bg && bg.complete && bg.naturalWidth > 0) {
        const scale = Math.max(1275 / bg.naturalWidth, 500 / bg.naturalHeight);
        const w = bg.naturalWidth * scale;
        const h = bg.naturalHeight * scale;
        const x = (1275 - w) / 2;
        const y = (500 - h) / 2;
        ctx.drawImage(bg, x, y, w, h);
      }
      ctx.restore();

      if (isP5) {
        /* === P5 === */

        /* Layer 2: Portrait */
        ctx.save();
        if (char !== 'None') {
          const useCustom = custom && customPortraitRef.current?.complete && customPortraitRef.current?.naturalWidth > 0;
          const img = useCustom ? customPortraitRef.current : portraitRef.current;
          if (img && img.complete && img.naturalWidth > 0) {
            if (custom && setCustom) setCustom('');
            const pos = simplePositions[char as keyof typeof simplePositions] || findSpecialPosition(char, emote, costume);
            let x = pos[0], y = pos[1], w = 500, h = 500;
            if (costume === "Humanity's Companion") w = 580;
            if (char === 'Haru' && (costume === 'Swimsuit (Okinawa)' || costume === 'Road Trip (Hat)')) w = 570;
            ctx.drawImage(img, x, y, w, h);
          }
        }
        ctx.restore();

        /* Layer 3: Name box image */
        ctx.save();
        const nb = nameBubbleRef.current;
        if (nb && nb.complete && nb.naturalWidth > 0) {
          const w = nb.width as number, h = nb.height as number;
          switch (boxType) {
            case 'main': ctx.drawImage(nb, 320, 250 - (h - 250), w, h); break;
            case 'noPortrait': ctx.drawImage(nb, 320, 180, w, h); break;
            case 'dancing': ctx.drawImage(nb, 320, 300, w, h); break;
            case 'strikers': ctx.drawImage(nb, 320, 250, w, h); break;
          }
        }
        ctx.restore();

        /* Layer 4: Name text (strict rotation containment) */
        try {
          const f = fontReady;
          ctx.save();
          ctx.font = `18pt ${f}`;
          switch (boxType) {
            case 'main':
            case 'noPortrait': {
              const textX = boxType === 'main' ? 418 : 392;
              const textY = boxType === 'main' ? 438 : 425;
              ctx.rotate(getP5Angle(boxType));
              ctx.textAlign = 'center';
              ctx.fillStyle = '#000000';
              ctx.fillText(name, textX, textY);
              break;
            }
            case 'dancing': { ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(name, 660, 353); break; }
            case 'strikers': { ctx.textAlign = 'center'; ctx.fillStyle = '#000000'; ctx.font = `16.5pt ${f}`; ctx.fillText(name, 500, 371); break; }
          }
          ctx.restore();

          /* Layer 5: Dialogue text — rendered INSIDE the right-side black bubble.
             Rotation matrix from the nameplate above is fully restored, so coords are clean. */
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `18pt ${f}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          wrapText(ctx, text.replace(/\n/g, ' '), 520, 390, 580, 28, 3);
          ctx.restore();
        } catch (e) { console.error('P5 text draw error:', e); }
      } else {
        /* === P4 === */

        /* Layer 2: Character Sprite — Chie FIRST, anchored bottom-right (x ≈ 820) */
        ctx.save();
        if (char !== 'None') {
          const img = portraitRef.current;
          if (img && img.complete && img.naturalWidth > 0) {
            if (custom && setCustom) setCustom('');
            const iH = img.height as number, iW = img.width as number;
            if (!iH || !iW) { /* skip, don't return */ }
            else {
              const sw = findWidth(char, emote, costume);
              const ta = iH * sw;
              const nw = Math.sqrt((iW / iH) * ta);
              const nh = ta / nw;
              let pX: number, pY: number;
              if (char === 'Chie') {
                pX = 820;
                pY = DH - nh;
              } else {
                const pos = p4FindPosition(boxType, char, emote, costume);
                pX = pos[0];
                pY = pos[1];
              }
              ctx.drawImage(img, pX, pY, nw, nh);
            }
          }
        }
        ctx.restore();

        /* Layer 3: Box back + front — OVER the sprite's lower torso (40, 330, 1195, 145) */
        ctx.save();
        const targetBoxWidth = 1195, targetBoxHeight = 145, boxX = 40, boxY = 330;
        const db = dialogueBubbleRef.current;
        if (db && db.complete && db.naturalWidth > 0) {
          ctx.drawImage(db, boxX, boxY, targetBoxWidth, targetBoxHeight);
        }
        const nb = nameBubbleRef.current;
        if (nb && nb.complete && nb.naturalWidth > 0) {
          ctx.drawImage(nb, boxX, boxY, targetBoxWidth, targetBoxHeight);
        }
        ctx.restore();

        try {
          const f = fontReady;

          /* Layer 4: Dynamic angled yellow nameplate banner polygon */
          ctx.save();
          ctx.fillStyle = '#DCA000';
          ctx.beginPath();
          ctx.moveTo(40, 305);
          ctx.lineTo(430, 305);
          ctx.lineTo(410, 365);
          ctx.lineTo(40, 365);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFE94A';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          /* Layer 5: Name text on banner */
          ctx.save();
          ctx.font = `bold 24px 'New Rodin', 'Skip', ${f}`;
          ctx.fillStyle = '#2C160E';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(name, 75, 322);
          ctx.restore();

          /* Layer 6: Wrapped dialogue text inside dark brown box, never touching the sprite */
          ctx.save();
          ctx.font = `bold 26px ${f}`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          wrapText(ctx, text.replace(/\n/g, ' '), 85, 390, 720, 34, 3);
          ctx.restore();
        } catch (e) { console.error('P4 text draw error:', e); }
      }
    } catch (e) {
      console.error('Redraw error:', e);
    }
  };

  useEffect(() => {
    redraw();
  }, [activeGame, char, emote, costume, name, text, font, portrait, custom, boxType, nameBoxSrc, fontReady]);

  const onLoad = () => redraw();

  return (
    <div id="canvasDiv">
      <canvas ref={canvasRef} id="dialogueCanvas" />
      <img alt="" ref={bgRef} className="hidden" src={bgSrc} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={portraitRef} className="hidden" src={portrait} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={nameBubbleRef} className="hidden" src={isP5 ? nameBoxSrc : p4BoxFront} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={dialogueBubbleRef} className="hidden" src={p4BoxBack} crossOrigin="anonymous" onLoad={onLoad} />
      <img alt="" ref={customPortraitRef} className="hidden" src={custom} crossOrigin="anonymous" onLoad={onLoad} />
    </div>
  );
};

export default ImageCanvas;
