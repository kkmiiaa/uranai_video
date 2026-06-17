const MAJOR_ARCANA = [
  {index: 0,  roman: '0',      nameJa: '愚者',       nameEn: 'The Fool',          symbol: '☽', hue: 220},
  {index: 1,  roman: 'I',      nameJa: '魔術師',     nameEn: 'The Magician',      symbol: '∞', hue: 270},
  {index: 2,  roman: 'II',     nameJa: '女教皇',     nameEn: 'The High Priestess',symbol: '☾', hue: 240},
  {index: 3,  roman: 'III',    nameJa: '女帝',       nameEn: 'The Empress',       symbol: '♀', hue: 140},
  {index: 4,  roman: 'IV',     nameJa: '皇帝',       nameEn: 'The Emperor',       symbol: '♦', hue: 0},
  {index: 5,  roman: 'V',      nameJa: '法王',       nameEn: 'The Hierophant',    symbol: '✦', hue: 45},
  {index: 6,  roman: 'VI',     nameJa: '恋人',       nameEn: 'The Lovers',        symbol: '♡', hue: 350},
  {index: 7,  roman: 'VII',    nameJa: '戦車',       nameEn: 'The Chariot',       symbol: '⚔', hue: 210},
  {index: 8,  roman: 'VIII',   nameJa: '力',         nameEn: 'Strength',          symbol: '◎', hue: 38},
  {index: 9,  roman: 'IX',     nameJa: '隠者',       nameEn: 'The Hermit',        symbol: '✦', hue: 190},
  {index: 10, roman: 'X',      nameJa: '運命の輪',   nameEn: 'Wheel of Fortune',  symbol: '☸', hue: 280},
  {index: 11, roman: 'XI',     nameJa: '正義',       nameEn: 'Justice',           symbol: '⚖', hue: 160},
  {index: 12, roman: 'XII',    nameJa: '吊られた男', nameEn: 'The Hanged Man',    symbol: '◇', hue: 175},
  {index: 13, roman: 'XIII',   nameJa: '死神',       nameEn: 'Death',             symbol: '☽', hue: 220},
  {index: 14, roman: 'XIV',    nameJa: '節制',       nameEn: 'Temperance',        symbol: '◈', hue: 200},
  {index: 15, roman: 'XV',     nameJa: '悪魔',       nameEn: 'The Devil',         symbol: '⛧', hue: 5},
  {index: 16, roman: 'XVI',    nameJa: '塔',         nameEn: 'The Tower',         symbol: '⚡', hue: 28},
  {index: 17, roman: 'XVII',   nameJa: '星',         nameEn: 'The Star',          symbol: '★', hue: 200},
  {index: 18, roman: 'XVIII',  nameJa: '月',         nameEn: 'The Moon',          symbol: '☾', hue: 230},
  {index: 19, roman: 'XIX',    nameJa: '太陽',       nameEn: 'The Sun',           symbol: '☀', hue: 45},
  {index: 20, roman: 'XX',     nameJa: '審判',       nameEn: 'Judgement',         symbol: '◎', hue: 15},
  {index: 21, roman: 'XXI',    nameJa: '世界',       nameEn: 'The World',         symbol: '◉', hue: 130},
];

// 日付から3枚のカードインデックスを決定的に算出
const dateToCardIndices = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  const seed = year * 10000 + month * 100 + day;
  const order = [...Array(22).keys()];
  let s = seed;
  for (let i = 21; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return [order[0], order[1], order[2]];
};

const getCard = (index) => MAJOR_ARCANA[index];

module.exports = {MAJOR_ARCANA, dateToCardIndices, getCard};
