const ZODIAC_META = [
  {sign: '牡羊座', kana: 'おひつじ座', icon: 'assets/zodiac/aries.png'},
  {sign: '牡牛座', kana: 'おうし座', icon: 'assets/zodiac/taurus.png'},
  {sign: '双子座', kana: 'ふたご座', icon: 'assets/zodiac/gemini.png'},
  {sign: '蟹座', kana: 'かに座', icon: 'assets/zodiac/cancer.png'},
  {sign: '獅子座', kana: 'しし座', icon: 'assets/zodiac/leo.png'},
  {sign: '乙女座', kana: 'おとめ座', icon: 'assets/zodiac/virgo.png'},
  {sign: '天秤座', kana: 'てんびん座', icon: 'assets/zodiac/libra.png'},
  {sign: '蠍座', kana: 'さそり座', icon: 'assets/zodiac/scorpio.png'},
  {sign: '射手座', kana: 'いて座', icon: 'assets/zodiac/sagittarius.png'},
  {sign: '山羊座', kana: 'やぎ座', icon: 'assets/zodiac/capricorn.png'},
  {sign: '水瓶座', kana: 'みずがめ座', icon: 'assets/zodiac/aquarius.png'},
  {sign: '魚座', kana: 'うお座', icon: 'assets/zodiac/pisces.png'},
];

const ZODIAC_BY_SIGN = new Map(ZODIAC_META.map((z) => [z.sign, z]));

module.exports = {
  ZODIAC_META,
  ZODIAC_BY_SIGN,
};
