const ZODIAC_META = [
  {
    sign: '牡羊座',
    en: 'aries',
    kana: 'おひつじ座',
    icon: 'assets/zodiac/aries.png',
  },
  {
    sign: '牡牛座',
    en: 'taurus',
    kana: 'おうし座',
    icon: 'assets/zodiac/taurus.png',
  },
  {
    sign: '双子座',
    en: 'gemini',
    kana: 'ふたご座',
    icon: 'assets/zodiac/gemini.png',
  },
  {
    sign: '蟹座',
    en: 'cancer',
    kana: 'かに座',
    icon: 'assets/zodiac/cancer.png',
  },
  {
    sign: '獅子座',
    en: 'leo',
    kana: 'しし座',
    icon: 'assets/zodiac/leo.png',
  },
  {
    sign: '乙女座',
    en: 'virgo',
    kana: 'おとめ座',
    icon: 'assets/zodiac/virgo.png',
  },
  {
    sign: '天秤座',
    en: 'libra',
    kana: 'てんびん座',
    icon: 'assets/zodiac/libra.png',
  },
  {
    sign: '蠍座',
    en: 'scorpio',
    kana: 'さそり座',
    icon: 'assets/zodiac/scorpio.png',
  },
  {
    sign: '射手座',
    en: 'sagittarius',
    kana: 'いて座',
    icon: 'assets/zodiac/sagittarius.png',
  },
  {
    sign: '山羊座',
    en: 'capricorn',
    kana: 'やぎ座',
    icon: 'assets/zodiac/capricorn.png',
  },
  {
    sign: '水瓶座',
    en: 'aquarius',
    kana: 'みずがめ座',
    icon: 'assets/zodiac/aquarius.png',
  },
  {
    sign: '魚座',
    en: 'pisces',
    kana: 'うお座',
    icon: 'assets/zodiac/pisces.png',
  },
];

const ZODIAC_BY_SIGN = new Map(ZODIAC_META.map((z) => [z.sign, z]));
const ZODIAC_BY_EN = new Map(ZODIAC_META.map((z) => [z.en, z]));

module.exports = {
  ZODIAC_META,
  ZODIAC_BY_SIGN,
  ZODIAC_BY_EN,
};
