const fs = require('fs');
const path = require('path');
const {ZODIAC_BY_SIGN, ZODIAC_BY_EN} = require('./zodiac');
const {MBTI_BY_TYPE} = require('./mbti');
const {getCard, dateToCardIndices} = require('./tarot');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

const DEFAULT_PROMPT_PATH = path.join(
  process.cwd(),
  'prompts',
  'gemini_fortune.txt'
);

const buildPrompt = (date, promptPath = DEFAULT_PROMPT_PATH) => {
  const template = fs.readFileSync(promptPath, 'utf8');
  return template.replaceAll('{date}', date);
};

const ensureDirForFile = (filePath) => {
  if (!filePath) return;
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, {recursive: true});
};

const extractJson = (text, rawOutPath) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('--- Gemini raw output start ---');
      console.error(text);
      console.error('--- Gemini raw output end ---');
      if (rawOutPath) {
        ensureDirForFile(rawOutPath);
        require('fs').writeFileSync(rawOutPath, text, 'utf8');
      }
      throw new Error('Gemini response did not contain JSON');
    }
    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error('--- Gemini extracted JSON start ---');
      console.error(match[0]);
      console.error('--- Gemini extracted JSON end ---');
      if (rawOutPath) {
        ensureDirForFile(rawOutPath);
        require('fs').writeFileSync(rawOutPath, match[0], 'utf8');
      }
      throw err;
    }
  }
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || (items.length !== 12 && items.length !== 16)) {
    throw new Error('Expected 12 or 16 items from Gemini');
  }

  const usedRanks = new Set();
  return items.map((item) => {
    const sign = String(item.sign || '').trim();
    const rank = Number(item.rank);
    const text = String(item.text || '').trim();

    const meta =
      ZODIAC_BY_SIGN.get(sign) || ZODIAC_BY_EN.get(sign) || MBTI_BY_TYPE.get(sign);
    if (!meta) {
      throw new Error(`Unknown sign: ${sign}`);
    }
    const maxRank = items.length === 16 ? 16 : 12;
    if (!Number.isInteger(rank) || rank < 1 || rank > maxRank) {
      throw new Error(`Invalid rank: ${rank}`);
    }
    if (usedRanks.has(rank)) {
      throw new Error(`Duplicate rank: ${rank}`);
    }
    usedRanks.add(rank);

    return {
      rank,
      icon: meta.icon,
      kana: meta.kana || meta.label,
      text,
    };
  });
};

const generateFortuneJson = async ({
  date,
  apiKey,
  model = DEFAULT_MODEL,
  promptPath,
  rawOutputPath,
}) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const url = `${API_ROOT}/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{text: buildPrompt(date, promptPath)}],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const finishReason = data.candidates && data.candidates[0] ? data.candidates[0].finishReason : '';
  if (finishReason && finishReason !== 'STOP') {
    console.error(`--- Gemini finishReason: ${finishReason} ---`);
    if (rawOutputPath) {
      ensureDirForFile(rawOutputPath);
      fs.writeFileSync(rawOutputPath, JSON.stringify(data, null, 2), 'utf8');
    }
    throw new Error(`Gemini response incomplete: finishReason=${finishReason}`);
  }
  const text = (data.candidates || [])
    .flatMap((c) => (c.content && c.content.parts ? c.content.parts : []))
    .map((p) => p.text)
    .join('');

  if (!text || !text.trim()) {
    console.error('--- Gemini empty text response start ---');
    console.error(JSON.stringify(data, null, 2));
    console.error('--- Gemini empty text response end ---');
    if (rawOutputPath) {
      ensureDirForFile(rawOutputPath);
      fs.writeFileSync(rawOutputPath, JSON.stringify(data, null, 2), 'utf8');
    }
    throw new Error('Gemini response contained no text');
  }

  const json = extractJson(text, rawOutputPath);
  const items = normalizeItems(json.items);

  const mode = items.length === 16 ? 'mbti' : 'zodiac';
  return {
    date: json.date || date,
    mode,
    daily_number: json.daily_number,
    daily_number_meaning: json.daily_number_meaning,
    items,
  };
};

const POSITIONS = ['left', 'center', 'right'];

const buildTarotPrompt = (date, promptPath) => {
  const [li, ci, ri] = dateToCardIndices(date);
  const [lc, cc, rc] = [getCard(li), getCard(ci), getCard(ri)];
  const template = fs.readFileSync(promptPath, 'utf8');
  return template
    .replaceAll('{date}', date)
    .replaceAll('{left_index}', li).replaceAll('{left_roman}', lc.roman)
    .replaceAll('{left_name_ja}', lc.nameJa).replaceAll('{left_name_en}', lc.nameEn)
    .replaceAll('{center_index}', ci).replaceAll('{center_roman}', cc.roman)
    .replaceAll('{center_name_ja}', cc.nameJa).replaceAll('{center_name_en}', cc.nameEn)
    .replaceAll('{right_index}', ri).replaceAll('{right_roman}', rc.roman)
    .replaceAll('{right_name_ja}', rc.nameJa).replaceAll('{right_name_en}', rc.nameEn);
};

const normalizeTarotCard = (item, expectedIndex) => {
  const card = getCard(expectedIndex);
  if (!Array.isArray(item.keywords) || item.keywords.length < 1) {
    throw new Error(`keywords missing for card ${expectedIndex}`);
  }
  if (!item.message || !item.love || !item.work || !item.lucky) {
    throw new Error(`Missing fields for card ${expectedIndex}`);
  }
  return {
    card_index: card.index,
    card_name_ja: card.nameJa,
    card_name_en: card.nameEn,
    roman: card.roman,
    symbol: card.symbol,
    hue: card.hue,
    keywords: item.keywords.slice(0, 3),
    message: String(item.message).trim(),
    love: String(item.love).trim(),
    work: String(item.work).trim(),
    lucky: String(item.lucky).trim(),
  };
};

const normalizeTarotJson = (json, date) => {
  if (!Array.isArray(json.cards) || json.cards.length !== 3) {
    throw new Error('Expected cards array of length 3');
  }
  const indices = dateToCardIndices(date);
  const cards = POSITIONS.map((pos, i) => {
    const item = json.cards.find((c) => c.position === pos) || json.cards[i];
    return normalizeTarotCard(item, indices[i]);
  });
  return {date: json.date || date, cards};
};

const generateTarotJson = async ({
  date,
  apiKey,
  model = DEFAULT_MODEL,
  promptPath,
  rawOutputPath,
}) => {
  if (!apiKey) throw new Error('GEMINI_API_KEY is required');

  const url = `${API_ROOT}/models/${model}:generateContent`;
  const body = {
    contents: [{role: 'user', parts: [{text: buildTarotPrompt(date, promptPath)}]}],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`Gemini response incomplete: finishReason=${finishReason}`);
  }
  const text = (data.candidates || [])
    .flatMap((c) => (c.content?.parts || []))
    .map((p) => p.text)
    .join('');

  if (!text?.trim()) throw new Error('Gemini response contained no text');

  const json = extractJson(text, rawOutputPath);
  return normalizeTarotJson(json, date);
};

module.exports = {
  DEFAULT_MODEL,
  generateFortuneJson,
  generateTarotJson,
};
