import { SyntheticEvent } from 'react';
import Menus from './Menus';

const TextAndTools = ({ char, setChar, emote, setEmote, costume, setCostume, setPortrait, setCustom, text, setText,
  name, setName, font, setFont, box, setBox, boxSize, setBoxSize, boxType, setBoxType }) => {

  const toolProps: any = {
    char,
    setChar,
    emote,
    setEmote,
    costume,
    setCostume,
    setPortrait,
    box,
    setBox,
    boxSize,
    setBoxSize,
    boxType,
    setBoxType,
    font,
    name,
    setName,
  }

  const customPortrait = (e: SyntheticEvent<HTMLInputElement>): void => {
    if((e.target as HTMLInputElement).files[0]) {
      setCustom(URL.createObjectURL((e.target as HTMLInputElement).files[0]));
    }
    return;
  }

  const changeName = (e: SyntheticEvent<HTMLTextAreaElement>): void => {
    let currName = (e.target as HTMLTextAreaElement).value;
    let newName = '';
    for (let i = 0; i < currName.length; i++) {
      if (currName[i] === ' ' && currName[i + 1] === ' ') continue;
      newName += currName[i];
    }
    (e.target as HTMLTextAreaElement).value = newName;
    setName(newName);
  }

  const fontTags: [string, string, string][] = [
    ['KoreanKRSM', 'KoreanKRSM', 'KRSMDivs'],
    ['Optima nova LT', 'Optima Nova', 'optimaDivs'],
    ['SlumpDB', 'Slump DB', 'slumpDivs'],
    ['aCinema', 'aCinema', 'cinemaDivs'],
    ['DF Li Yuan', 'DF Li Yuan', 'liDivs'],
    ['a굴림헤드B', '굴림헤드B', 'koreanStrikersDivs'],
    ['DF Ping Ju', 'DF Ping Ju', 'pingDivs'],
  ];

  return (
    <div id='textAndTools'>
      <div className='p5-sidebar-content'>
        <Menus {...toolProps} />

        <div className='p5-divider' />

        <div id='enterName'>
          <div id='nameHeader'>Name</div>
          <textarea
            id='nameField'
            rows={1}
            cols={45}
            defaultValue={name}
            onChange={(e) => changeName(e)}
          />
          <div id='nameNote'>Character auto-fills; edit freely</div>
        </div>

        <div id='enterDialogue'>
          <div id='dialogueHeader'>Dialogue</div>
          <textarea
            id='textField'
            placeholder='Hey, Inmate! Character portraits contain spoilers!'
            rows={3}
            cols={45}
            defaultValue={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className='p5-divider' />

        <div id='fontDiv'>
          <div id='fontHeader'>Font Select</div>
          <div id='fontChoices'>
            {fontTags.map(([value, label, cls]) => (
              <div
                key={value}
                className={`fonts ${cls} knife${font === value ? ' active-font' : ''}`}
                onClick={() => setFont(value)}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className='p5-divider' />

        <label id='upload' className='knife'>
          Upload Portrait
          <input
            id='hiddenUpload'
            type='file' accept='image/*'
            onClick={(e) => (e.target as HTMLInputElement).value = null}
            onChange={(e) => customPortrait(e)}
          />
          <div id='uploadSizeMessage'>500px x 500px recommended</div>
        </label>
      </div>
    </div>
  )
};

export default TextAndTools;
