const fs = require('fs');
const path = require('path');
const {ZODIAC_BY_SIGN, ZODIAC_BY_EN} = require('./zodiac');

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

const extractJson = (text, rawOutPath) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      if (rawOutPath) {
        require('fs').writeFileSync(rawOutPath, text, 'utf8');
      }
      throw new Error('Gemini response did not contain JSON');
    }
    try {
      return JSON.parse(match[0]);
    } catch (err) {
      if (rawOutPath) {
        require('fs').writeFileSync(rawOutPath, match[0], 'utf8');
      }
      throw err;
    }
  }
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length !== 12) {
    throw new Error('Expected 12 items from Gemini');
  }

  const usedRanks = new Set();
  return items.map((item) => {
    const sign = String(item.sign || '').trim();
    const rank = Number(item.rank);
    const text = String(item.text || '').trim();

    const meta = ZODIAC_BY_SIGN.get(sign) || ZODIAC_BY_EN.get(sign);
    if (!meta) {
      throw new Error(`Unknown sign: ${sign}`);
    }
    if (!Number.isInteger(rank) || rank < 1 || rank > 12) {
      throw new Error(`Invalid rank: ${rank}`);
    }
    if (usedRanks.has(rank)) {
      throw new Error(`Duplicate rank: ${rank}`);
    }
    usedRanks.add(rank);

    return {
      rank,
      icon: meta.icon,
      kana: meta.kana,
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

  const json = extractJson(text, rawOutputPath);
  const items = normalizeItems(json.items);

  return {
    date: json.date || date,
    daily_number: json.daily_number,
    daily_number_meaning: json.daily_number_meaning,
    items,
  };
};

module.exports = {
  DEFAULT_MODEL,
  generateFortuneJson,
};
