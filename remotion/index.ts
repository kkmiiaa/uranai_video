import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DailyFortune, type DailyFortuneProps} from './components/DailyFortune';
import {DailyTarot, type DailyTarotProps} from './components/DailyTarot';

const defaultProps: DailyFortuneProps = {
  date: '2026-01-27',
  items: [
    {
      rank: 1,
      icon: 'assets/zodiac/aries.png',
      kana: 'おひつじ座',
      text: '今日はあなたの情熱が最高潮！新しいことに挑戦する絶好のチャンスです。',
    },
    {
      rank: 2,
      icon: 'assets/zodiac/leo.png',
      kana: 'しし座',
      text: 'リーダーシップを発揮する日。周りを巻き込み、大きな成果を上げられるでしょう。',
    },
    {
      rank: 3,
      icon: 'assets/zodiac/sagittarius.png',
      kana: 'いて座',
      text: '冒険心が刺激される日。未知の体験があなたを待っています。',
    },
    {
      rank: 4,
      icon: 'assets/zodiac/gemini.png',
      kana: 'ふたご座',
      text: 'コミュニケーションが活発になる日。新しい出会いや情報が舞い込みそうです。',
    },
    {
      rank: 5,
      icon: 'assets/zodiac/libra.png',
      kana: 'てんびん座',
      text: 'バランス感覚が冴える日。人間関係もスムーズに進むでしょう。',
    },
    {
      rank: 6,
      icon: 'assets/zodiac/aquarius.png',
      kana: 'みずがめ座',
      text: '独創的なアイデアがひらめく日。周りを驚かせる発想が生まれるかも。',
    },
    {
      rank: 7,
      icon: 'assets/zodiac/cancer.png',
      kana: 'かに座',
      text: '家族や親しい人との絆が深まる日。穏やかな時間を過ごしましょう。',
    },
    {
      rank: 8,
      icon: 'assets/zodiac/pisces.png',
      kana: 'うお座',
      text: '感受性が豊かになる日。芸術やスピリチュアルなことに触れると良いでしょう。',
    },
    {
      rank: 9,
      icon: 'assets/zodiac/scorpio.png',
      kana: 'さそり座',
      text: '集中力が高まる日。一つのことに深く取り組むと良い結果が出そうです。',
    },
    {
      rank: 10,
      icon: 'assets/zodiac/virgo.png',
      kana: 'おとめ座',
      text: '細部に目が向く日。計画を立てて着実に物事を進めましょう。',
    },
    {
      rank: 11,
      icon: 'assets/zodiac/capricorn.png',
      kana: 'やぎ座',
      text: '努力が報われる日。これまでの頑張りが認められるでしょう。',
    },
    {
      rank: 12,
      icon: 'assets/zodiac/taurus.png',
      kana: 'おうし座',
      text: '今日は少し休息が必要な日。無理せず、自分のペースで過ごしましょう。',
    },
  ],
};

const defaultTarotProps: DailyTarotProps = {
  date: '2026-01-27',
  cards: [
    {
      card_index: 3, card_name_ja: '女帝', card_name_en: 'The Empress',
      roman: 'III', symbol: '♀', hue: 140,
      keywords: ['豊かさ', '創造', '愛情'],
      message: '今日はあなたの持つ豊かさと創造力が輝く一日です。自分を大切にしながら周りにも愛情を。',
      love: '温かい気持ちが伝わりやすい日です。',
      work: '創造的なアイデアが浮かびやすい日です。',
      lucky: '花を飾る',
    },
    {
      card_index: 10, card_name_ja: '運命の輪', card_name_en: 'Wheel of Fortune',
      roman: 'X', symbol: '☸', hue: 280,
      keywords: ['転換', '流れ', 'チャンス'],
      message: '今日は大きな流れに乗るチャンスです。変化を恐れずに一歩踏み出してみましょう。',
      love: '新しい出会いの予感があります。',
      work: '転機となる出来事が訪れそうです。',
      lucky: '新しいルートを歩く',
    },
    {
      card_index: 17, card_name_ja: '星', card_name_en: 'The Star',
      roman: 'XVII', symbol: '★', hue: 200,
      keywords: ['希望', '癒し', '直感'],
      message: '今日は希望の光があなたを照らしています。自分を信じて、純粋な気持ちで進んでみて。',
      love: '素直な気持ちが良い縁を引き寄せます。',
      work: '直感を信じると道が開けます。',
      lucky: '夜空を眺める',
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: 'DailyFortune',
      component: DailyFortune,
      durationInFrames: 900,
      fps: 30,
      width: 1080,
      height: 1920,
      defaultProps,
    }),
    React.createElement(Composition, {
      id: 'DailyTarot',
      component: DailyTarot,
      durationInFrames: 1260,
      fps: 30,
      width: 1080,
      height: 1920,
      defaultProps: defaultTarotProps,
    })
  );
};

registerRoot(RemotionRoot);
