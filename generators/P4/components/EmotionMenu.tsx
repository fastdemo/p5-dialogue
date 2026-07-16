import { useEffect, SyntheticEvent } from 'react';
import portraitData from '../utils/emotionsData';

const EmotionMenu = ({ char, emote, setEmote, setCostume, costume, emoteMenus, setCostumeMenus }) => {
let charEmotes: string[] = [];

  // Check to see if the emotion menus have been generated from the fetch request
  // before attempting to map over them
if (emoteMenus.length) {
  charEmotes = emoteMenus.map(emotion => {
    return (
      <option key={`${char}: ${emotion}`} value={emotion}>
        {emotion}
      </option>
    );
  });
};

  useEffect(() => {
    const costumes = portraitData[char]?.[emote] || [];
    setCostumeMenus(costumes);
    if (!costumes.includes(costume)) {
      setCostume(costumes[0]);
    }
  }, [char, emote]);


  const switchEmote = (e: SyntheticEvent<HTMLSelectElement>) => {
    return setEmote((e.target as HTMLSelectElement).value);
  }

  return (
    <div className='menuDivs'>
      <div className='menuLabels'>Emotion</div>
      <select id='emoteMenu' className='menuOptions cursor' value={emote} name='emotions' onChange={switchEmote}>
        {charEmotes}
      </select>
    </div>
  );
};

export default EmotionMenu;