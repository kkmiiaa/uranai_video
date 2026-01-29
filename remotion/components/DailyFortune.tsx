import React, {useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill,
  delayRender,
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

export const DailyFortune: React.FC<DailyFortuneProps> = ({date, items}) => {
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


  const titleSize = s(14);
  const dateSize = s(18);
  const titleMargin = s(12);
  const titleGap = s(16);
  const captionSize = s(11);
  const captionGap = s(8);
  const cardMarginX = s(24);
  const baseSafeY = (1920 - (1080 * 5) / 4) / 2
  const safeTop = baseSafeY + s(30);
  const safeBottom = baseSafeY - s(10);
  const cardTop = safeTop + titleSize + titleMargin + titleGap;
  const cardBottom = safeBottom + captionSize + captionGap;
  const cardPaddingX = s(24);
  const cardPaddingY = 0;
  const scrollSpacer = s(24);

  const cardHeight = 1920 - cardTop - cardBottom;
  const listHeight = cardHeight - cardPaddingY * 2;

  const itemHeight = s(120);
  const contentHeight = sortedItems.length * itemHeight + scrollSpacer * 2;
  const scrollDistance = Math.max(0, contentHeight - listHeight);
  const scrollY = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, -scrollDistance],
    {
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #2C2D58 0%, #4A4C8C 100%)',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      }}
    >
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

      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          top: safeTop + s(8),
          fontSize: titleSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s(10),
          color: '#DDDDDD',
        }}
      >
        <Img
          src={staticFile('assets/moon.png')}
          style={{
            width: s(20),
            height: s(20),
            transform: `translateY(${s(2)}px) scale(${moonPulse})`,
            filter: `drop-shadow(0 0 ${s(5)}px rgba(253, 230, 138, 0.6)) drop-shadow(0 0 ${s(9)}px rgba(253, 230, 138, 0.4))`,
          }}
        />
        {formattedDate}の12星座ランキング
      </div>

      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          top: safeTop - s(40),
          fontSize: s(20),
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '0.02em',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(255, 255, 255, 1)',
          textDecorationThickness: s(1.5),
          textUnderlineOffset: s(10),
        }}
      >
        今日いちばん運がいい星座は…？
      </div>

      <div
        style={{
          position: 'absolute',
          left: cardMarginX,
          right: cardMarginX,
          top: cardTop,
          bottom: cardBottom,
          borderRadius: s(20),
          background: 'rgba(0, 0, 0, 0.2)',
          border: `${s(1.5)}px solid rgba(255, 255, 255, 0.3)`,
          padding: `${cardPaddingY}px ${cardPaddingX}px`,
          boxSizing: 'border-box',
        }}
      >

        <div
          style={{
            position: 'relative',
            height: listHeight,
            overflow: 'hidden',
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black ${scrollSpacer}px, black calc(100% - ${scrollSpacer}px), transparent 100%)`,
            maskImage: `linear-gradient(to bottom, transparent 0, black ${scrollSpacer}px, black calc(100% - ${scrollSpacer}px), transparent 100%)`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        >
          <div style={{transform: `translateY(${scrollY}px)`}}>
            <div style={{height: s(30)}} />
            {sortedItems.map((item, index) => {
              const isLast = index === sortedItems.length - 1;
              return (
                <div
                  key={`${item.rank}-${item.kana}`}
                  style={{
                    display: 'flex',
                    gap: s(12),
                    padding: `${s(12)}px 0`,
                    borderBottom: isLast
                      ? 'none'
                      : `${s(1)}px solid rgba(255, 255, 255, 0.2)`,
                    minHeight: itemHeight - s(24),
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: s(24),
                      textAlign: 'center',
                      fontSize: s(16),
                      opacity: 0.9,
                      alignSelf: 'center',
                    }}
                  >
                    {item.rank}.
                  </div>

                  <div
                    style={{
                      width: s(40),
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: s(28),
                        height: s(28),
                        margin: `0 auto ${s(2)}px`,
                      }}
                    >
                      <Img
                        src={staticFile(item.icon)}
                        style={{
                          width: '100%',
                          height: '100%',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                    </div>
                    <div style={{fontSize: s(9), opacity: 0.8}}>{item.kana}</div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      fontSize: s(13),
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}
            <div style={{height: scrollSpacer}} />
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
