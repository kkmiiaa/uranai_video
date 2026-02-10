const MBTI_TYPES = [
  {type: 'INTJ', label: 'INTJ'},
  {type: 'INTP', label: 'INTP'},
  {type: 'ENTJ', label: 'ENTJ'},
  {type: 'ENTP', label: 'ENTP'},
  {type: 'INFJ', label: 'INFJ'},
  {type: 'INFP', label: 'INFP'},
  {type: 'ENFJ', label: 'ENFJ'},
  {type: 'ENFP', label: 'ENFP'},
  {type: 'ISTJ', label: 'ISTJ'},
  {type: 'ISFJ', label: 'ISFJ'},
  {type: 'ESTJ', label: 'ESTJ'},
  {type: 'ESFJ', label: 'ESFJ'},
  {type: 'ISTP', label: 'ISTP'},
  {type: 'ISFP', label: 'ISFP'},
  {type: 'ESTP', label: 'ESTP'},
  {type: 'ESFP', label: 'ESFP'},
];

const PLACEHOLDER_ICONS = [
  'assets/zodiac/aries.png',
  'assets/zodiac/taurus.png',
  'assets/zodiac/gemini.png',
  'assets/zodiac/cancer.png',
  'assets/zodiac/leo.png',
  'assets/zodiac/virgo.png',
  'assets/zodiac/libra.png',
  'assets/zodiac/scorpio.png',
  'assets/zodiac/sagittarius.png',
  'assets/zodiac/capricorn.png',
  'assets/zodiac/aquarius.png',
  'assets/zodiac/pisces.png',
];

const MBTI_META = MBTI_TYPES.map((item, index) => ({
  type: item.type,
  label: item.label,
  icon: PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length],
}));

const MBTI_BY_TYPE = new Map(MBTI_META.map((m) => [m.type, m]));

module.exports = {
  MBTI_META,
  MBTI_BY_TYPE,
};
