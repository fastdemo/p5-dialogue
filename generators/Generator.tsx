import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ImageCanvas from './ImageCanvas';
import portraitDataP5 from './P5/utils/emotionsData';
import portraitDataP4 from './P4/utils/emotionsData';

type Game = 'P5' | 'P4';

interface FontEntry {
  value: string; label: string; cls: string; subtitle?: string;
}
interface BoxOption {
  value: string; label: string;
}
interface GameConfig {
  title: string; description: string; icon: string; logo: string;
  defaultChar: string; defaultEmote: string; defaultCostume: string;
  defaultName: string; defaultFont: string; s3Base: string;
  fonts: FontEntry[]; boxOptions: BoxOption[]; defaultBox: string; uploadNote: string;
}

const GAMES: Record<Game, GameConfig> = {
  P5: {
    title: 'Persona 5 Dialogue Generator', description: 'Persona 5 Dialogue Generator',
    icon: './images/logos/persona5logo.png', logo: './images/logos/persona5logo.png',
    defaultChar: 'Ann', defaultEmote: 'Happy', defaultCostume: 'Gym Clothes',
    defaultName: 'Ann', defaultFont: 'Optima nova LT',
    s3Base: 'https://testing-s3-p5.s3.amazonaws.com/portraits',
    fonts: [
      { value: 'KoreanKRSM', label: 'KoreanKRSM', cls: 'KRSMDivs' },
      { value: 'Optima nova LT', label: 'Optima Nova', cls: 'optimaDivs' },
      { value: 'SlumpDB', label: 'Slump DB', cls: 'slumpDivs' },
      { value: 'aCinema', label: 'aCinema', cls: 'cinemaDivs' },
      { value: 'DF Li Yuan', label: 'DF Li Yuan', cls: 'liDivs' },
      { value: 'a근림헤드B', label: '근림헤드B', cls: 'koreanStrikersDivs' },
      { value: 'DF Ping Ju', label: 'DF Ping Ju', cls: 'pingDivs' },
    ],
    boxOptions: [
      { value: 'main', label: 'Persona 5/Royal' },
      { value: 'noPortrait', label: 'Persona 5 (No Portrait)' },
      { value: 'strikers', label: 'Strikers/Scramble' },
      { value: 'dancing', label: 'Dancing in Starlight' },
    ],
    defaultBox: 'main', uploadNote: '500px x 500px recommended',
  },
  P4: {
    title: 'Persona 4 Dialogue Generator', description: 'Persona 4 Dialogue Generator',
    icon: './images/logos/persona4logo.png', logo: './images/logos/persona4logo.png',
    defaultChar: 'Chie', defaultEmote: 'Happy', defaultCostume: 'Spring Uniform',
    defaultName: 'Chie', defaultFont: 'SkipStd-B',
    s3Base: 'https://p4generator.s3.amazonaws.com/portraits',
    fonts: [
      { value: 'SkipStd-B', label: 'Skip', cls: 'skipDivs', subtitle: '(Latin Script/日本語)' },
      { value: 'KoreanHSE', label: 'a한글세상M', cls: 'koreanGoldenDivs', subtitle: '(한국어 - 페르소나 4 골든)' },
    ],
    boxOptions: [
      { value: 'vanilla', label: 'Persona 4' },
      { value: 'golden', label: 'Persona 4 Golden' },
    ],
    defaultBox: 'golden', uploadNote: '400px x 450px recommended',
  },
};

const Generator = () => {
  const [activeGame, setActiveGame] = useState<Game>('P5');
  const [char, setChar] = useState(GAMES.P5.defaultChar);
  const [emote, setEmote] = useState(GAMES.P5.defaultEmote);
  const [costume, setCostume] = useState(GAMES.P5.defaultCostume);
  const [name, setName] = useState(GAMES.P5.defaultName);
  const [text, setText] = useState('');
  const [font, setFont] = useState(GAMES.P5.defaultFont);
  const [portrait, setPortrait] = useState('');
  const [custom, setCustom] = useState('');
  const [boxType, setBoxType] = useState(GAMES.P5.defaultBox);
  const [boxBack, setBoxBack] = useState('');
  const [boxFront, setBoxFront] = useState('');
  const [flashKey, setFlashKey] = useState(0);

  const cfg = GAMES[activeGame];

  const switchGame = (game: Game) => {
    if (game === activeGame) return;
    const g = GAMES[game];
    setActiveGame(game);
    setFlashKey(k => k + 1);
    setChar(g.defaultChar);
    setEmote(g.defaultEmote);
    setCostume(g.defaultCostume);
    setName(g.defaultName);
    setText('');
    setFont(g.defaultFont);
    setCustom('');
    setBoxType(g.defaultBox);
    setPortrait(`${g.s3Base}/${g.defaultChar}/${g.defaultEmote}/${g.defaultChar}-${g.defaultEmote}-${g.defaultCostume}.png`);
    if (game === 'P5') {
      setBoxBack(''); setBoxFront('');
    } else {
      setBoxBack(`./generators/P4/images/boxes/db-${g.defaultBox}-back.png`);
      setBoxFront(`./generators/P4/images/boxes/db-${g.defaultBox}-front.png`);
    }
    const nf = document.getElementById('nameField') as HTMLTextAreaElement;
    if (nf) nf.value = g.defaultName;
    const tf = document.getElementById('textField') as HTMLTextAreaElement;
    if (tf) tf.value = '';
  };

  useEffect(() => {
    setPortrait(`${cfg.s3Base}/${char}/${emote}/${char}-${emote}-${costume}.png`);
  }, [char, emote, costume]);

  useEffect(() => {
    if (activeGame === 'P4') {
      setBoxBack(`./generators/P4/images/boxes/db-${boxType}-back.png`);
      setBoxFront(`./generators/P4/images/boxes/db-${boxType}-front.png`);
    }
  }, [boxType, activeGame]);

  useEffect(() => {
    document.documentElement.setAttribute('data-game', activeGame);
  }, [activeGame]);

  const portraitData = activeGame === 'P5' ? portraitDataP5 : portraitDataP4;

  useEffect(() => {
    const emotions = Object.keys(portraitData[char] || {});
    if (!emotions.includes(emote) && emotions.length > 0) setEmote(emotions[0]);
  }, [char]);

  useEffect(() => {
    const costumes = (portraitData[char]?.[emote] as string[]) || [];
    if (!costumes.includes(costume) && costumes.length > 0) setCostume(costumes[0]);
  }, [char, emote]);

  const trimCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = source.getContext('2d');
    if (!ctx) return source;
    const { width, height } = source;
    const data = ctx.getImageData(0, 0, width, height).data;
    let top = height, bottom = 0, left = width, right = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          if (y < top) top = y; if (y > bottom) bottom = y;
          if (x < left) left = x; if (x > right) right = x;
        }
      }
    }
    const tw = right - left + 1, th = bottom - top + 1;
    if (tw <= 0 || th <= 0) return source;
    const trimmed = document.createElement('canvas');
    trimmed.width = tw; trimmed.height = th;
    trimmed.getContext('2d')!.drawImage(source, left, top, tw, th, 0, 0, tw, th);
    return trimmed;
  };

  const p5Download = () => {
    const composite = document.createElement('canvas');
    composite.width = 1275; composite.height = 500;
    const ctx = composite.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(document.getElementById('portraitCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('boxCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('tileCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('nameCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('textCanvas') as HTMLCanvasElement, 0, 0);
    const trimmed = trimCanvas(composite);
    const link = document.createElement('a');
    const nv = (document.getElementById('nameField') as HTMLTextAreaElement)?.value || name;
    const tv = (document.getElementById('textField') as HTMLTextAreaElement)?.value || text;
    link.download = `${nv}-${tv}.png`;
    link.href = trimmed.toDataURL('image/png');
    link.click();
  };

  const p4Download = () => {
    const composite = document.createElement('canvas');
    composite.width = 1275; composite.height = 800;
    const ctx = composite.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(document.getElementById('boxBackCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('portraitCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('boxFrontCanvas') as HTMLCanvasElement, 0, 0);
    ctx.drawImage(document.getElementById('textCanvas') as HTMLCanvasElement, 0, 0);
    const link = document.createElement('a');
    link.download = `${char}-${text}.png`;
    link.href = composite.toDataURL('image/png');
    link.click();
  };

  const downloadWithFlash = () => {
    setFlashKey(k => k + 1);
    setTimeout(() => {
      if (activeGame === 'P5') p5Download(); else p4Download();
    }, 180);
  };

  const resetCanvas = () => {
    const g = GAMES[activeGame];
    setChar(g.defaultChar); setEmote(g.defaultEmote); setCostume(g.defaultCostume);
    setName(g.defaultName); setText(''); setFont(g.defaultFont); setCustom('');
    setBoxType(g.defaultBox);
    setPortrait(`${g.s3Base}/${g.defaultChar}/${g.defaultEmote}/${g.defaultChar}-${g.defaultEmote}-${g.defaultCostume}.png`);
    if (activeGame === 'P5') { setBoxBack(''); setBoxFront(''); }
    else { setBoxBack(`./generators/P4/images/boxes/db-${g.defaultBox}-back.png`); setBoxFront(`./generators/P4/images/boxes/db-${g.defaultBox}-front.png`); }
    const nf = document.getElementById('nameField') as HTMLTextAreaElement;
    if (nf) nf.value = g.defaultName;
    const tf = document.getElementById('textField') as HTMLTextAreaElement;
    if (tf) tf.value = '';
  };

  const changeName = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let curr = e.target.value, result = '';
    for (let i = 0; i < curr.length; i++) { if (curr[i] !== ' ' || curr[i + 1] !== ' ') result += curr[i]; }
    e.target.value = result; setName(result);
  };

  const switchChar = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; setChar(val);
    if (val !== 'None') { setName(val); const nf = document.getElementById('nameField') as HTMLTextAreaElement; if (nf) nf.value = val; }
    else { setName(''); const nf = document.getElementById('nameField') as HTMLTextAreaElement; if (nf) nf.value = ''; }
  };

  const customPortrait = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCustom(URL.createObjectURL(e.target.files[0]));
  };

  const charList = activeGame === 'P5' ? Object.keys(portraitDataP5) : Object.keys(portraitDataP4);
  const charEmotes = portraitData[char] ? Object.keys(portraitData[char]) : [];
  const charCostumes = (portraitData[char]?.[emote] as string[]) || [];

  return (
    <>
      <Helmet>
        <title>{cfg.title}</title>
        <meta name="description" content={cfg.description} />
        <link rel="shortcut icon" type="image/png" href={cfg.icon} />
      </Helmet>
      <div className="p5-app">
        <div className="p5-container">
          <aside className="p5-sidebar">
            <div className="p5-sidebar-header">
              <img alt={`${activeGame} logo`} className="p5-sidebar-logo" src={cfg.logo} width="38" height="23" />
              <div className="p5-sidebar-titles">
                <div className="p5-sidebar-title-optima">DIALOGUE GENERATOR</div>
                <div className="p5-sidebar-sub-row">
                  <span className="p5-sidebar-title-jp">{'\u5BFE\u8A71\u30B8\u30A7\u30CD\u30EC\u30FC\u30BF'}</span>
                </div>
              </div>
            </div>
            <div className="p5-sidebar-content">
              <div className="menu-group">
                <div className="menu-label">Game</div>
                <div className="game-toggle">
                  <button className={`game-toggle-btn${activeGame === 'P5' ? ' active' : ''}`} onClick={() => switchGame('P5')}>Persona 5</button>
                  <button className={`game-toggle-btn${activeGame === 'P4' ? ' active' : ''}`} onClick={() => switchGame('P4')}>Persona 4</button>
                </div>
              </div>
              <div className="p5-divider" />
              <div className="menus">
                <div className="menu-group">
                  <div className="menu-label">Character</div>
                  <select id="charMenu" className="menuOptions knife" value={char} onChange={switchChar}>
                    {charList.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="None">No Portrait</option>
                  </select>
                </div>
                <div className="menu-group">
                  <div className="menu-label">Emotion</div>
                  <select id="emoteMenu" className="menuOptions knife" value={emote} onChange={(e) => setEmote(e.target.value)}>
                    {charEmotes.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="menu-group">
                  <div className="menu-label">Costume</div>
                  <select id="costumeMenu" className="menuOptions knife" value={costume} onChange={(e) => setCostume(e.target.value)}>
                    {charCostumes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="p5-divider" />
              <div className="text-group">
                <div className="text-label">Name</div>
                <textarea id="nameField" rows={1} cols={45} defaultValue={name} onChange={changeName} />
                <div id="nameNote">Character auto-fills; edit freely</div>
              </div>
              <div className="text-group">
                <div className="text-label">Dialogue</div>
                <textarea id="textField" placeholder="Hey, Inmate! Character portraits contain spoilers!" rows={3} cols={45} defaultValue={text} onChange={(e) => setText(e.target.value)} />
              </div>
              <div className="p5-divider" />
              <div className="font-group">
                <div className="font-label">Box Style</div>
                <div className="choice-group">
                  {cfg.boxOptions.map(b => (
                    <div key={b.value} className={`choice-btn knife${boxType === b.value ? ' active' : ''}`} onClick={() => setBoxType(b.value)}>
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p5-divider" />
              <div className="font-group">
                <div className="font-label">Font Select</div>
                <div className="choice-group">
                  {cfg.fonts.map(f => (
                    <div key={f.value} className={`choice-btn ${f.cls} knife${font === f.value ? ' active' : ''}`} onClick={() => setFont(f.value)}>
                      {f.label}
                      {f.subtitle && <div className="choice-subtitle">{f.subtitle}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p5-divider" />
              <label id="upload" className="knife">
                Upload Portrait
                <input id="hiddenUpload" type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={customPortrait} />
                <div id="uploadSizeMessage">{cfg.uploadNote}</div>
              </label>
            </div>
          </aside>
          <main className={`p5-main${flashKey % 2 ? ' is-flashing' : ''}`}>
            <div className="p5-viewport">
              <ImageCanvas
                activeGame={activeGame}
                char={char} emote={emote} costume={costume}
                name={name} text={text} font={font}
                portrait={portrait} custom={custom}
                boxType={boxType} setCustom={setCustom}
                boxBack={boxBack} boxFront={boxFront}
              />
            </div>
            <div className="p5-actions">
              <button className="p5-btn p5-btn-download" onClick={downloadWithFlash}>Download Dialogue Image</button>
              <button className="p5-btn p5-btn-reset" onClick={resetCanvas}>Clear / Reset Canvas</button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Generator;
