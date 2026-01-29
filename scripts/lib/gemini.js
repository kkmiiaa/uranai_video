const {ZODIAC_BY_SIGN} = require('./zodiac');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

const buildPrompt = (date) => {
  return [
    'You are a fortune-telling generator for a Japanese zodiac ranking video.',
    'Return ONLY valid JSON. No markdown.',
    'Output format:',
    '{',
    '  "date": "YYYY-MM-DD",',
    '  "items": [',
    '    {"sign": "牡羊座", "rank": 1, "text": "..."},',
    '    ... 12 items total with ranks 1-12',
    '  ]',
    '}',
    'Rules:',
    '- Use exactly these 12 signs: 牡羊座, 牡牛座, 双子座, 蟹座, 獅子座, 乙女座, 天秤座, 蠍座, 射手座, 山羊座, 水瓶座, 魚座',
    '- Each text is 25-30 Japanese characters.',
    '- Keep tone gentle and positive for women-oriented astrology accounts.',
    `- date must be "${date}".`,
  ].join('\n');
};

const extractJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Gemini response did not contain JSON');
    }
    return JSON.parse(match[0]);
  }
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length !== 12) {
    throw new Error('Expected 12 items from Gemini');
  }

  const usedRanks = new Set();
  return items.map((item) => {
    const sign = item.sign;
    const rank = Number(item.rank);
    const text = String(item.text || '').trim();

    if (!ZODIAC_BY_SIGN.has(sign)) {
      throw new Error(`Unknown sign: ${sign}`);
    }
    if (!Number.isInteger(rank) || rank < 1 || rank > 12) {
      throw new Error(`Invalid rank: ${rank}`);
    }
    if (usedRanks.has(rank)) {
      throw new Error(`Duplicate rank: ${rank}`);
    }
    usedRanks.add(rank);

    const meta = ZODIAC_BY_SIGN.get(sign);
    return {
      rank,
      icon: meta.icon,
      kana: meta.kana,
      text,
    };
  });
};

const generateFortuneJson = async ({date, apiKey, model = DEFAULT_MODEL}) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const url = `${API_ROOT}/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{text: buildPrompt(date)}],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
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
  const text = (data.candidates || [])
    .flatMap((c) => (c.content && c.content.parts ? c.content.parts : []))
    .map((p) => p.text)
    .join('');

  const json = extractJson(text);
  const items = normalizeItems(json.items);

  return {
    date: json.date || date,
    items,
  };
};

module.exports = {
  DEFAULT_MODEL,
  generateFortuneJson,
};
