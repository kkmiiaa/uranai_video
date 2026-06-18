import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const CARD_IMAGE: Record<string, string> = {
  'The Fool': 'fool', 'The Magician': 'magician', 'The High Priestess': 'high_priestess',
  'The Empress': 'empress', 'The Emperor': 'emperor', 'The Hierophant': 'hierophant',
  'The Lovers': 'lovers', 'The Chariot': 'chariot', 'Strength': 'strength',
  'The Hermit': 'hermit', 'Wheel of Fortune': 'wheel_of_fortune', 'Justice': 'justice',
  'The Hanged Man': 'hanged_man', 'Death': 'death', 'Temperance': 'temperance',
  'The Devil': 'devil', 'The Tower': 'tower', 'The Star': 'star',
  'The Moon': 'moon', 'The Sun': 'sun', 'Judgement': 'judgement', 'The World': 'world',
};

type CardData = {
  card_index: number;
  card_name_ja: string;
  card_name_en: string;
  roman: string;
  symbol: string;
  hue: number;
  keywords: string[];
  message: string;
  love: string;
  work: string;
  lucky: string;
};

export type DailyTarotProps = {
  date: string;
  cards: [CardData, CardData, CardData];
};

const FONT_FAMILY = '"Zen Maru Gothic", sans-serif';
const BASE_WIDTH = 402;
const SCALE = 1080 / BASE_WIDTH;
const s = (v: number) => v * SCALE;

const ei = (frame: number, s1: number, e1: number, from: number, to: number) =>
  interpolate(frame, [s1, e1], [from, to], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// フレーム定数
const INTRO_F  = 150; // イントロ長さ（5s）
const TRANS_F  = 30;  // カード移動トランジション（1s）
const SEC_F    = 390; // 各セクション（13s）
// 合計: 75 + 30 + 390×3 = 1275f = 42.5s

const RESULTS_START = INTRO_F + TRANS_F; // 105

export const DailyTarot: React.FC<DailyTarotProps> = ({date, cards}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fontUrl = staticFile('fonts/ZenMaruGothic-japanese-400.woff2');
  const [fontHandle] = useState(() => delayRender('load-zen-maru-gothic'));

  useEffect(() => {
    const font = new FontFace('Zen Maru Gothic', `url(${fontUrl}) format('woff2')`, {
      weight: '400', style: 'normal',
    });
    font.load()
      .then((f) => { document.fonts.add(f); return document.fonts.ready; })
      .then(() => continueRender(fontHandle))
      .catch(() => continueRender(fontHandle));
  }, [fontHandle, fontUrl]);

  const f = (sec: number) => Math.round(sec * fps);
  const formattedDate = date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日');

  const baseSafeY = (1920 - (1080 * 5) / 4) / 2; // ≈285
  const marginX = s(24);

  // ─── カードレイアウト（イントロ ↔ 結果）───
  const cardW = s(104);
  const cardGap = s(16);
  const totalCardW = cardW * 3 + cardGap * 2;
  const cardsX = (1080 - totalCardW) / 2;

  const cardH = s(155); // 大きさはイントロ・結果で変わらない

  const introCardsTop  = (1920 - cardH) / 2 - s(20); // イントロ時：画面中央より少し上
  const resultCardsTop = s(100);                      // 結果時：上部（アカウント名UIを避ける）

  // トランジション進行度（0=イントロ, 1=結果）
  const transProgress = ei(frame, INTRO_F, INTRO_F + TRANS_F, 0, 1);

  const cardsTop = introCardsTop + (resultCardsTop - introCardsTop) * transProgress;

  // ─── イントロアニメーション ───
  const headerOpacity  = ei(frame, 0,      f(1.0), 0, 1) * ei(frame, INTRO_F, INTRO_F + TRANS_F, 1, 0);
  const cardsOpacity   = ei(frame, f(0.8), f(2.0), 0, 1);
  const cardsSlideY    = ei(frame, f(0.8), f(2.0), s(150), 0);
  const chooseTextOp   = ei(frame, f(1.6), f(2.5), 0, 1) * ei(frame, INTRO_F, INTRO_F + f(0.5), 1, 0);

  // ─── セクション ───
  const sectionStart = (pos: number) => RESULTS_START + pos * SEC_F;
  const secLocal     = (pos: number) => frame - sectionStart(pos);
  const isActive     = (pos: number) =>
    frame >= sectionStart(pos) && frame < sectionStart(pos) + SEC_F;
  const isRevealed   = (pos: number) => frame >= sectionStart(pos) + f(1.5);

  // ─── CardFace / CardBack ───
  const CardFace = ({card}: {card: CardData}) => {
    const file = CARD_IMAGE[card.card_name_en];
    return (
      <div style={{position: 'absolute', inset: 0}}>
        {file ? (
          <Img
            src={staticFile(`assets/tarot/${file}.png`)}
            style={{width: '108%', height: '108%', objectFit: 'cover', marginLeft: '-4%', marginTop: '-4%'}}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(145deg, hsl(${card.hue},48%,26%) 0%, hsl(${card.hue},32%,16%) 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{fontSize: s(38), color: `hsl(${card.hue},72%,70%)`}}>{card.symbol}</div>
          </div>
        )}
      </div>
    );
  };

  const CardBack = ({pos}: {pos: number}) => (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(145deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{position: 'absolute', inset: s(6), border: `${s(1)}px solid rgba(255,255,255,0.3)`, borderRadius: s(8)}} />
      <div style={{fontSize: s(36), fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: FONT_FAMILY, letterSpacing: '0.05em'}}>
        {['A', 'B', 'C'][pos]}
      </div>
    </div>
  );

  // ─── セクションコンテンツ（結果エリア）───
  // カード直下〜画面下端まで flex space-between で均等配置
  const contentAreaTop = resultCardsTop + cardH + s(14);
  const contentAreaHeight = 1920 - s(80) - contentAreaTop; // 下部もUI安全圏を確保

  const SectionContent = ({pos, card}: {pos: number; card: CardData}) => {
    const afterStart = frame >= sectionStart(pos) + f(1.5);
    const beforeEnd  = pos === 2 ? true : frame < sectionStart(pos + 1);
    if (!afterStart || !beforeEnd) return null;

    const local = secLocal(pos);
    const labelOp  = ei(local, f(1.5), f(2.3), 0, 1);
    const nameOp   = ei(local, f(2.3), f(3.2), 0, 1);
    const kwOp     = ei(local, f(3.2), f(4.2), 0, 1);
    const msgOp    = ei(local, f(4.2), f(5.8), 0, 1);
    const detailOp = ei(local, f(6.2), f(7.8), 0, 1);
    const luckyOp  = ei(local, f(8.2), f(9.2), 0, 1);

    const LABELS = ['Aを選んだあなたへ', 'Bを選んだあなたへ', 'Cを選んだあなたへ'];
    const accent = 'rgba(255, 230, 245, 0.9)';

    return (
      <div style={{
        position: 'absolute',
        top: contentAreaTop, left: marginX, right: marginX,
        height: contentAreaHeight,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: s(4), paddingBottom: s(4),
      }}>
        {/* セクションラベル */}
        <div style={{
          opacity: labelOp, textAlign: 'center',
          fontSize: s(9), color: 'rgba(255,210,230,0.75)', letterSpacing: '0.08em',
        }}>
          {LABELS[pos]}
        </div>

        {/* カード名 */}
        <div style={{
          opacity: nameOp, display: 'flex', alignItems: 'baseline',
          justifyContent: 'center', gap: s(10),
        }}>
          <span style={{fontSize: s(22), fontWeight: 700, color: '#fff', letterSpacing: '0.04em'}}>
            {card.card_name_ja}
          </span>
          <span style={{fontSize: s(12), color: accent}}>{card.roman}</span>
        </div>

        {/* キーワード */}
        <div style={{
          opacity: kwOp, display: 'flex', justifyContent: 'center', gap: s(8),
        }}>
          {card.keywords.map((kw, i) => (
            <div key={i} style={{
              fontSize: s(10), color: accent,
              background: 'rgba(255,255,255,0.12)',
              border: `${s(1)}px solid rgba(255,230,245,0.35)`,
              borderRadius: s(20), padding: `${s(4)}px ${s(11)}px`,
              letterSpacing: '0.05em',
            }}>
              {kw}
            </div>
          ))}
        </div>

        {/* メッセージ */}
        <div style={{opacity: msgOp}}>
          <div style={{
            fontSize: s(14), lineHeight: 1.75, color: 'rgba(255,240,248,0.92)', textAlign: 'center',
          }}>
            {card.message}
          </div>
        </div>

        {/* 恋愛・日常 */}
        <div style={{
          opacity: detailOp, display: 'flex', flexDirection: 'column', gap: s(7),
        }}>
          {([
            {
              icon: (
                <svg width={s(9)} height={s(9)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              ),
              label: '恋愛', text: card.love,
            },
            {
              icon: (
                <svg width={s(9)} height={s(9)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ),
              label: '日常', text: card.work,
            },
          ] as const).map(({icon, label, text}) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.06)',
              border: `${s(1)}px solid rgba(255,180,210,0.25)`,
              borderRadius: s(12), padding: `${s(6)}px ${s(8)}px`,
            }}>
              <div style={{
                fontSize: s(9), color: accent, marginBottom: s(3), letterSpacing: '0.07em',
                display: 'flex', alignItems: 'center', gap: s(4),
              }}>
                <span style={{color: accent, display: 'flex', alignItems: 'center'}}>{icon}</span>
                {label}
              </div>
              <div style={{fontSize: s(10.5), lineHeight: 1.5, color: 'rgba(255,235,245,0.88)'}}>
                {text}
              </div>
            </div>
          ))}
        </div>

        {/* ラッキー */}
        <div style={{opacity: luckyOp, display: 'flex', justifyContent: 'center'}}>
          <div style={{
            fontSize: s(11), color: '#fff',
            background: 'rgba(180,80,120,0.55)',
            border: `${s(1)}px solid rgba(255,180,210,0.6)`,
            borderRadius: s(22), padding: `${s(6)}px ${s(18)}px`,
            letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width={s(10)} height={s(10)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: s(5)}}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            ラッキー：{card.lucky}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(180deg, #2C2D58 0%, #4A3575 40%, #A06090 75%, #E8A0B0 100%)',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
    }}>
      <Audio src={staticFile('bgm/fortune.mp3')} volume={0.2} />

      {/* 星 */}
      {[...Array(18)].map((_, i) => {
        const x = ((i * 61 + 17) % 100);
        const y = ((i * 47 + 11) % 100);
        const sz = 1 + (i % 3);
        const period = 150 + (i % 6) * 50;
        const t = ((frame + i * 41) % period) / period;
        const op = Math.max(0, Math.sin(t * Math.PI) * 0.6);
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            width: s(sz), height: s(sz), borderRadius: '50%',
            background: '#E8A0B0', opacity: op * 0.6,
          }} />
        );
      })}

      {/* ヘッダー（イントロのみ表示、トランジションでフェードアウト） */}
      <div style={{
        position: 'absolute', top: baseSafeY + s(28), left: marginX, right: marginX,
        opacity: headerOpacity, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: s(5), pointerEvents: 'none',
      }}>
        <div style={{fontSize: s(11), color: 'rgba(255,220,240,0.8)', letterSpacing: '0.13em'}}>
          ✦ 今日のタロット ✦
        </div>
        <div style={{
          fontSize: s(26), fontWeight: 700, color: '#FFE4F0', letterSpacing: '0.04em',
          textShadow: `0 0 ${s(14)}px rgba(232,160,176,0.5)`,
        }}>
          {formattedDate}
        </div>
      </div>

      {/* 「カードを選んでください」テキスト（イントロのみ） */}
      <div style={{
        position: 'absolute',
        top: introCardsTop + cardH + s(24),
        left: marginX, right: marginX,
        opacity: chooseTextOp, textAlign: 'center',
        fontSize: s(14), color: 'rgba(255,220,235,0.75)', letterSpacing: '0.06em',
      }}>
        直感でカードを選んでください
      </div>

      {/* 3枚のカード（イントロ→結果でY・H をアニメーション） */}
      {cards.map((card, pos) => {
        const x = cardsX + pos * (cardW + cardGap);
        const local = secLocal(pos);
        const revealed = isRevealed(pos);

        // フリップ scaleX
        const flipScaleX = (() => {
          if (!revealed) return 1;
          const h1 = ei(local, f(0.5), f(1.0), 1, 0);
          const h2 = ei(local, f(1.0), f(1.5), 0, 1);
          return local < f(1.0) ? h1 : h2;
        })();
        const showFront = revealed && local >= f(1.0);

        // アクティブセクション中は選ばれたカードが少し浮く
        const liftY = isActive(pos) ? ei(local, 0, f(0.5), 0, -s(12)) : 0;

        // 他セクションがアクティブ中は暗く
        const otherActive = [0, 1, 2].some((p) => p !== pos && isActive(p));
        const dimOpacity = otherActive ? 0.45 : 1;

        const glowP = revealed ? ei(local, f(1.5), f(2.5), 0, 1) : 0;
        const accent = `hsl(${card.hue}, 70%, 65%)`;

        return (
          <div key={pos} style={{
            position: 'absolute',
            left: x,
            top: cardsTop,
            width: cardW,
            height: cardH,
            transform: `translateY(${cardsSlideY + liftY}px) scaleX(${flipScaleX})`,
            opacity: cardsOpacity * dimOpacity,
            borderRadius: s(12),
            overflow: 'hidden',
            boxShadow: glowP > 0
              ? `0 0 ${s(28 * glowP)}px hsla(${card.hue},65%,60%,${glowP * 0.6}), 0 ${s(4)}px ${s(18)}px rgba(0,0,0,0.45)`
              : `0 ${s(4)}px ${s(16)}px rgba(0,0,0,0.4)`,
          }}>
            {showFront ? <CardFace card={card} /> : <CardBack pos={pos} />}
          </div>
        );
      })}

      {/* セクションコンテンツ */}
      {cards.map((card, pos) => (
        <SectionContent key={pos} pos={pos} card={card} />
      ))}

      {/* フッター（イントロのみ表示） */}
      {frame < RESULTS_START && (
        <div style={{
          position: 'absolute', bottom: baseSafeY - s(10),
          left: marginX, right: marginX,
          fontSize: s(10), color: 'rgba(255,255,255,0.4)',
          textAlign: 'center', letterSpacing: '0.02em',
          opacity: ei(frame, INTRO_F, RESULTS_START, 1, 0),
        }}>
          占ai｜複数占術をAIでまとめて毎日お届け
        </div>
      )}
    </AbsoluteFill>
  );
};
