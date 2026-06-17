import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DailyFortune, type DailyFortuneProps} from './components/DailyFortune';

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
    })
  );
};

registerRoot(RemotionRoot);
