import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ImageCanvas from './ImageCanvas';
import portraitDataP5 from './P5/utils/emotionsData';
import portraitDataP4 from './P4/utils/emotionsData';

type Game = 'P5' | 'P4';

interface FontEntry {
  value: string; label: string; subtitle?: string;
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
      { value: 'KoreanKRSM', label: 'KoreanKRSM' },
      { value: 'Optima nova LT', label: 'Optima Nova' },
      { value: 'SlumpDB', label: 'Slump DB' },
      { value: 'aCinema', label: 'aCinema' },
      { value: 'DF Li Yuan', label: 'DF Li Yuan' },
      { value: 'a\uad7c\ub9bc\ud5e4\ub4dcB', label: '\uadfc\ub9bc\ud5e4\ub4dcB' },
      { value: 'DF Ping Ju', label: 'DF Ping Ju' },
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
      { value: 'SkipStd-B', label: 'Skip', subtitle: '(Latin Script/\u65e5\u672c\u8a9e)' },
      { value: 'KoreanHSE', label: 'a\ud55c\uae00\uc138\uc0c1M', subtitle: '(\ud55c\uad6d\uc5b4 - \ud398\ub974\uc18c\ub098 4 \uace8\ub4e0)' },
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
    const nf = document.getElementById('nameField') as HTMLTextAreaElement;
    if (nf) nf.value = g.defaultName;
    const tf = document.getElementById('textField') as HTMLTextAreaElement;
    if (tf) tf.value = '';
  };

  useEffect(() => {
    setPortrait(`${cfg.s3Base}/${char}/${emote}/${char}-${emote}-${costume}.png`);
  }, [char, emote, costume]);

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

  const download = () => {
    const canvas = document.getElementById('dialogueCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const trimmed = trimCanvas(canvas);
    const link = document.createElement('a');
    const nv = (document.getElementById('nameField') as HTMLTextAreaElement)?.value || name;
    const tv = (document.getElementById('textField') as HTMLTextAreaElement)?.value || text;
    link.download = `${nv}-${tv}.png`;
    link.href = trimmed.toDataURL('image/png');
    link.click();
  };

  const downloadWithFlash = () => {
    setFlashKey(k => k + 1);
    setTimeout(download, 180);
  };

  const resetCanvas = () => {
    const g = GAMES[activeGame];
    setChar(g.defaultChar); setEmote(g.defaultEmote); setCostume(g.defaultCostume);
    setName(g.defaultName); setText(''); setFont(g.defaultFont); setCustom('');
    setBoxType(g.defaultBox);
    setPortrait(`${g.s3Base}/${g.defaultChar}/${g.defaultEmote}/${g.defaultChar}-${g.defaultEmote}-${g.defaultCostume}.png`);
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
              <div className="menu-group">
                <div className="menu-label">Box Style</div>
                <select className="menuOptions knife" value={boxType} onChange={(e) => setBoxType(e.target.value)}>
                  {cfg.boxOptions.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="p5-divider" />
              <div className="menu-group">
                <div className="menu-label">Font Select</div>
                <select className="menuOptions knife" value={font} onChange={(e) => setFont(e.target.value)}>
                  {cfg.fonts.map(f => (
                    <option key={f.value} value={f.value}>{f.label}{f.subtitle ? ` (${f.subtitle})` : ''}</option>
                  ))}
                </select>
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
