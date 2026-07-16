import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ImageCanvas from './components/ImageCanvas';
import TextAndTools from './components/TextAndTools';
import Header from './components/Header';

const Persona5 = () => {
  const [char, setChar] = useState<string>('Ann');
  const [emote, setEmote]= useState<string>('Happy');
  const [costume, setCostume] = useState<string>('Gym Clothes');
  const [name, setName] = useState<string>('Ann');
  const [text, setText] = useState<string>('');
  const [font, setFont] = useState<string>('Optima nova LT');
  const [portrait, setPortrait] =
    useState<string>(`./generators/P5/images/portraits/${char}/${emote}/${char}-${emote}-${costume}.png`);
  const [custom, setCustom] = useState<string>('');
  const [box, setBox] = useState<string>('./generators/P5/images/boxes/db-Ann-Optima nova LT.png');
  const [boxType, setBoxType] = useState<string>('main');
  const [lastBoxType, setLastBoxType] = useState<string>(boxType);
  const [boxSize, setBoxSize] = useState<string>('small');
  const [flashing, setFlashing] = useState(false);

  const appProps: any = {
    char,
    setChar,
    emote,
    setEmote,
    costume,
    setCostume,
    name,
    setName,
    text,
    setText,
    portrait,
    setPortrait,
    custom,
    setCustom,
    font,
    setFont,
    box,
    setBox,
    boxType,
    setBoxType,
    boxSize,
    setBoxSize,
    lastBoxType,
    setLastBoxType,
  };

  const trimCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = source.getContext('2d');
    if (!ctx) return source;
    const { width, height } = source;
    const data = ctx.getImageData(0, 0, width, height).data;
    let top = height, bottom = 0, left = width, right = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }
    const trimmedW = right - left + 1;
    const trimmedH = bottom - top + 1;
    if (trimmedW <= 0 || trimmedH <= 0) return source;
    const trimmed = document.createElement('canvas');
    trimmed.width = trimmedW;
    trimmed.height = trimmedH;
    trimmed.getContext('2d')!.drawImage(source, left, top, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);
    return trimmed;
  };

  const downloadImage = (): void => {
    const composite: HTMLCanvasElement = document.createElement('canvas');
    composite.width = 1275;
    composite.height = 500;

    const portraitCanvas: HTMLCanvasElement =
      document.getElementById('portraitCanvas') as HTMLCanvasElement;
    const boxCanvas: HTMLCanvasElement =
      document.getElementById('boxCanvas') as HTMLCanvasElement;
    const tileCanvas: HTMLCanvasElement =
      document.getElementById('tileCanvas') as HTMLCanvasElement;
    const nameCanvas: HTMLCanvasElement =
      document.getElementById('nameCanvas') as HTMLCanvasElement;
    const textCanvas: HTMLCanvasElement =
      document.getElementById('textCanvas') as HTMLCanvasElement;
    const nameField: HTMLTextAreaElement =
      document.getElementById('nameField') as HTMLTextAreaElement;
    const textField: HTMLTextAreaElement =
      document.getElementById('textField') as HTMLTextAreaElement;

    const ctx: CanvasRenderingContext2D = composite.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(portraitCanvas, 0, 0, 1275, 500);
    ctx.drawImage(boxCanvas, 0, 0, 1275, 500);
    ctx.drawImage(tileCanvas, 0, 0, 1275, 500);
    ctx.drawImage(nameCanvas, 0, 0, 1275, 500);
    ctx.drawImage(textCanvas, 0, 0, 1275, 500);

    const trimmed = trimCanvas(composite);
    const link: HTMLAnchorElement = document.createElement('a');
    link.download = `${nameField.value}-${textField.value}.png`;
    link.href = trimmed.toDataURL('image/png');
    link.click();
  };

  const downloadWithFlash = (): void => {
    setFlashing(true);
    setTimeout(() => {
      downloadImage();
      setFlashing(false);
    }, 180);
  };

  const resetCanvas = (): void => {
    const nameField = document.getElementById('nameField') as HTMLTextAreaElement;
    const textField = document.getElementById('textField') as HTMLTextAreaElement;
    if (nameField) nameField.value = 'Ann';
    if (textField) textField.value = '';
    setName('Ann');
    setText('');
    setChar('Ann');
    setEmote('Happy');
    setCostume('Gym Clothes');
    setFont('Optima nova LT');
    setBoxType('main');
  };

  return (
    <>
      <Helmet>
        <title>Persona 5 Dialogue Generator</title>
        <meta name="description" content="Persona 5 Dialogue Generator" />
        <link rel="shortcut icon" type="image/png" href="./images/logos/persona5logo.png" />
      </Helmet>
      <div className="p5-app">
        <aside className="p5-sidebar">
          <Header />
          <TextAndTools {...appProps} />
        </aside>
        <main className={`p5-main${flashing ? ' is-flashing' : ''}`}>
          <div className="p5-viewport">
            <ImageCanvas {...appProps} />
          </div>
          <div className="p5-actions">
            <button className="p5-btn p5-btn-download" onClick={downloadWithFlash}>
              Download Dialogue Image
            </button>
            <button className="p5-btn p5-btn-reset" onClick={resetCanvas}>
              Clear / Reset Canvas
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default Persona5;
