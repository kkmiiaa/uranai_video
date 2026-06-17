import React, {useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  delayRender,
  Easing,
  Img,
  continueRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type RankingItem = {
  rank: number;
  icon: string;
  kana: string;
  text: string;
};

export type DailyFortuneProps = {
  date: string;
  titleSuffix?: string;
  backgroundGradient?: string;
  mode?: 'zodiac' | 'mbti';
  items: RankingItem[];
};

const FONT_FAMILY = '"Zen Maru Gothic", sans-serif';

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const BASE_WIDTH = 402;
const SCALE = 1080 / BASE_WIDTH;
const s = (value: number) => value * SCALE;

type ScrollBreakpoint = {frame: number; value: number};

const scrollYAtFrame = (frame: number, breakpoints: ScrollBreakpoint[]) => {
  for (let i = 0; i < breakpoints.length - 1; i += 1) {
    const a = breakpoints[i];
    const b = breakpoints[i + 1];
    if (frame <= b.frame) {
      if (a.value === b.value) return a.value;
      return interpolate(frame, [a.frame, b.frame], [a.value, b.value], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }
  return breakpoints[breakpoints.length - 1].value;
};

export const DailyFortune: React.FC<DailyFortuneProps> = ({
  date,
  items,
  titleSuffix: titleSuffixProp,
  backgroundGradient,
  mode,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const fontUrl = staticFile('fonts/ZenMaruGothic-japanese-400.woff2');
  const [fontHandle] = useState(() => delayRender('load-zen-maru-gothic'));
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.rank - a.rank),
    [items]
  );

  useEffect(() => {
    const font = new FontFace(
      'Zen Maru Gothic',
      `url(${fontUrl}) format('woff2')`,
      {weight: '400', style: 'normal'}
    );
    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        return document.fonts.ready;
      })
      .then(() => {
        continueRender(fontHandle);
      })
      .catch(() => {
        continueRender(fontHandle);
      });
  }, [fontHandle, fontUrl]);

  const formattedDate = date.replace(
    /^(\d{4})-(\d{2})-(\d{2})$/,
    '$1年$2月$3日'
  );
  const resolvedMode =
    mode ?? (items.length === 16 ? 'mbti' : 'zodiac');
  const titleSuffix =
    titleSuffixProp ??
    (resolvedMode === 'mbti' ? '16タイプランキング' : '12星座ランキング');
  const background =
    backgroundGradient ??
    (resolvedMode === 'mbti'
      ? 'linear-gradient(180deg, #A4A #D3CFE3 100%)'
      : 'linear-gradient(180deg, #2C2D58 0%, #4A4C8C 100%)');

  const stars = useMemo(() => {
    const rand = mulberry32(20260128);
    return new Array(20).fill(0).map((_, index) => {
      const size = 1 + Math.floor(rand() * 3);
      const x = rand() * 100;
      const y = rand() * 100;
      const delayMs = rand() * 6000;
      return {
        id: index,
        size,
        x,
        y,
        delayFrames: Math.round((delayMs / 1000) * fps),
      };
    });
  }, [fps]);

  const periodFrames = Math.round(10 * fps);
  const moonPulse = interpolate(
    frame % periodFrames,
    [0, periodFrames / 2, periodFrames],
    [0.92, 1, 0.92]
  );

  const captionSize = s(11);
  const cardMarginX = s(24);
  const baseSafeY = (1920 - (1080 * 5) / 4) / 2;
  const safeTop = baseSafeY + s(40);
  const safeBottom = baseSafeY - s(10);
  // header: date (large) + subtitle
  const headerHeight = s(80);
  const cardTop = safeTop + headerHeight + s(12);
  const cardBottom = safeBottom + captionSize + s(8);
  const cardPaddingX = s(20);

  const listHeight = 1920 - cardTop - cardBottom;
  const cardGap = s(12);
  const cardH = s(130);
  const itemCount = sortedItems.length;
  const scrollAtIndex = (index: number) => -index * (cardH + cardGap);

  const topThreeStartIndex = Math.max(0, itemCount - 3);

  // Fit all items in durationInFrames: compute dwell dynamically
  const transitionFrames = Math.round(0.45 * fps);
  const longDwellRatio = 2.2; // top3 gets 2.2× base dwell
  const {shortDwellFrames, longDwellFrames} = useMemo(() => {
    const topCount = itemCount - topThreeStartIndex;
    const shortCount = topThreeStartIndex;
    const transitions = itemCount - 1;
    // leave 1.5s for rank-1 to linger at end
    const available = durationInFrames - Math.round(1.5 * fps) - transitions * transitionFrames;
    const baseFrames = Math.floor(available / (shortCount + topCount * longDwellRatio));
    return {
      shortDwellFrames: Math.max(Math.round(0.9 * fps), baseFrames),
      longDwellFrames: Math.max(Math.round(1.8 * fps), Math.round(baseFrames * longDwellRatio)),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, topThreeStartIndex, transitionFrames, durationInFrames, fps]);

  const itemTimings = useMemo(() => {
    const timings: {arrive: number; leave: number}[] = [];
    let cursor = 0;
    for (let i = 0; i < itemCount; i += 1) {
      const dwell = i >= topThreeStartIndex ? longDwellFrames : shortDwellFrames;
      const arrive = cursor;
      const isLastItem = i === itemCount - 1;
      const leave = isLastItem ? durationInFrames - 1 : arrive + dwell;
      timings.push({arrive, leave});
      cursor = leave + transitionFrames;
    }
    return timings;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, shortDwellFrames, longDwellFrames, transitionFrames, topThreeStartIndex, durationInFrames]);

  const scrollBreakpoints = useMemo(() => {
    const points: ScrollBreakpoint[] = [{frame: 0, value: scrollAtIndex(0)}];
    itemTimings.forEach(({arrive, leave}, i) => {
      points.push({frame: arrive, value: scrollAtIndex(i)});
      points.push({frame: leave, value: scrollAtIndex(i)});
    });
    return points;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemTimings, listHeight, cardH, cardGap, itemCount]);

  const scrollY = scrollYAtFrame(frame, scrollBreakpoints);

  const topRankTiming = itemTimings[itemTimings.length - 1];
  const emphasisProgress = interpolate(
    frame,
    [topRankTiming.arrive, topRankTiming.arrive + Math.round(0.4 * fps)],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill
      style={{
        background,
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      }}
    >
      <Audio src={staticFile('bgm/fortune.mp3')} volume={0.25} />
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {stars.map((star) => {
          const t =
            ((frame - star.delayFrames) % periodFrames + periodFrames) %
            periodFrames;
          const progress = t / periodFrames;
          const fade = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
          const opacity = Math.max(0, fade);
          return (
            <div
              key={star.id}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: s(star.size),
                height: s(star.size),
                borderRadius: '50%',
                background: '#FDE68A',
                opacity,
                transform: `scale(${opacity})`,
                boxShadow: `0 0 ${s(3)}px rgba(253, 230, 138, 0.9)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* ヘッダー：日付（大きく）＋サブタイトル */}
      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          top: safeTop,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: s(6),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: s(10),
            fontSize: s(26),
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#FDE68A',
            textShadow: `0 0 ${s(12)}px rgba(253, 230, 138, 0.5)`,
          }}
        >
          <Img
            src={staticFile('assets/moon.png')}
            style={{
              width: s(24),
              height: s(24),
              transform: `scale(${moonPulse})`,
              filter: `drop-shadow(0 0 ${s(6)}px rgba(253, 230, 138, 0.8))`,
            }}
          />
          {formattedDate}
        </div>
        <div
          style={{
            fontSize: s(13),
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.06em',
          }}
        >
          {titleSuffix}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          top: cardTop,
          bottom: cardBottom,
        }}
      >

        <div style={{position: 'relative', height: listHeight}}>
          <div
            style={{
              transform: `translateY(${scrollY}px)`,
              display: 'flex',
              flexDirection: 'column',
              gap: cardGap,
              paddingTop: listHeight / 2 - cardH / 2,
              paddingBottom: listHeight / 2 - cardH / 2,
              paddingLeft: s(6),
              paddingRight: s(6),
            }}
          >
            {sortedItems.map((item, index) => {
              const isTopRank = item.rank === 1;
              const rowEmphasis = isTopRank ? emphasisProgress : 0;

              // distance from center (in pixels) for fade effect
              const cardCenterY =
                (listHeight / 2 - cardH / 2) +
                index * (cardH + cardGap) +
                scrollY +
                cardH / 2;
              const distFromCenter = Math.abs(cardCenterY - listHeight / 2);
              // 上下1枚まで表示、2枚目以降は完全透明
              const fadeRange = 1.4 * (cardH + cardGap);
              const rawFade = Math.max(0, Math.min(1, 1 - distFromCenter / fadeRange));
              const proximityFade = rawFade;
              // 中央カード（非1位）の白グロー強度：止まって中央に来たときだけ光る
              const centerGlow = isTopRank ? 0 : Math.pow(rawFade, 5) * (1 - emphasisProgress);
              // 1位が来たら他のカードを消す
              const endingFade = isTopRank ? 0 : emphasisProgress * 0.95;

              return (
                <div
                  key={`${item.rank}-${item.kana}`}
                  style={{
                    display: 'flex',
                    gap: s(14),
                    padding: `${s(14)}px ${cardPaddingX}px`,
                    height: cardH,
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    borderRadius: s(18),
                    flexShrink: 0,
                    background:
                      rowEmphasis > 0
                        ? `linear-gradient(135deg, rgba(253,230,138,${0.28 * rowEmphasis}) 0%, rgba(80,82,140,0.9) 100%)`
                        : 'rgba(55, 57, 105, 0.88)',
                    border: rowEmphasis > 0
                      ? `${s(1.5)}px solid rgba(253, 230, 138, ${0.7 * rowEmphasis})`
                      : `${s(1)}px solid rgba(255, 255, 255, 0.18)`,
                    boxShadow:
                      rowEmphasis > 0
                        ? `0 0 ${s(30 * rowEmphasis)}px rgba(253, 230, 138, ${0.55 * rowEmphasis}), 0 0 ${s(60 * rowEmphasis)}px rgba(253, 230, 138, ${0.2 * rowEmphasis}), 0 ${s(4)}px ${s(16)}px rgba(0,0,0,0.25)`
                        : centerGlow > 0
                        ? `0 0 ${s(20 * centerGlow)}px rgba(255, 255, 255, ${0.3 * centerGlow}), 0 ${s(2)}px ${s(10)}px rgba(0,0,0,0.2)`
                        : `0 ${s(2)}px ${s(10)}px rgba(0, 0, 0, 0.2)`,
                    opacity: proximityFade * (1 - endingFade),
                    transform: `scale(${0.88 + 0.12 * proximityFade + 0.04 * rowEmphasis})`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    style={{
                      width: s(30),
                      textAlign: 'center',
                      fontSize: s(18),
                      fontWeight: rowEmphasis > 0 ? 700 : 500,
                      opacity: 0.9,
                      alignSelf: 'center',
                      color: rowEmphasis > 0 ? '#FDE68A' : 'rgba(255,255,255,0.7)',
                      flexShrink: 0,
                    }}
                  >
                    {item.rank}
                  </div>

                  <div
                    style={{
                      width: s(52),
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: s(36),
                        height: s(36),
                        margin: `0 auto ${s(3)}px`,
                      }}
                    >
                      <Img
                        src={staticFile(item.icon)}
                        style={{
                          width: '100%',
                          height: '100%',
                          filter: 'brightness(0) invert(1)',
                          opacity: 0.95,
                        }}
                      />
                    </div>
                    <div style={{fontSize: s(10), opacity: 0.75, letterSpacing: '0.02em'}}>{item.kana}</div>
                  </div>

                  <div
                    style={{
                      width: s(1),
                      height: s(50),
                      background: 'rgba(255,255,255,0.18)',
                      flexShrink: 0,
                      borderRadius: s(1),
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      fontSize: s(13),
                      lineHeight: 1.7,
                      opacity: 0.92,
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          bottom: safeBottom - s(10),
          fontSize: captionSize,
          color: '#DDDDDD',
          textAlign: 'center',
          opacity: 0.85,
          letterSpacing: '0.02em',
        }}
      >
        占ai｜複数占術をAIでまとめて毎日お届け
      </div>
    </AbsoluteFill>
  );
};
