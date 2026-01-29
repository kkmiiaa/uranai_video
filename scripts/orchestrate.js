const fs = require('fs/promises');
const path = require('path');
const {DEFAULT_MODEL, generateFortuneJson} = require('./lib/gemini');
const {renderVideo} = require('./lib/render');

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1];
    args[name] = value;
    i += 1;
  }
  return args;
};

const ensureDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    throw new Error('date must be YYYY-MM-DD');
  }
  return value;
};

const addDays = (dateStr, days) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildDates = (args) => {
  if (args.date) {
    return [ensureDate(args.date)];
  }
  const start = ensureDate(args.start);
  const days = Number(args.days || 1);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('--days must be a positive integer');
  }
  return Array.from({length: days}, (_, i) => addDays(start, i));
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const dates = buildDates(args);
  const outDir = args['out-dir'] || 'out';
  const propsDir = path.join(outDir, 'props');
  const model = args.model || DEFAULT_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;
  const entry = args.entry || 'remotion/index.ts';
  const composition = args.composition || 'DailyFortune';
  const keepJson = args['keep-json'] !== 'false';

  await fs.mkdir(propsDir, {recursive: true});

  for (const date of dates) {
    process.stdout.write(`\n[${date}] generating JSON...\n`);
    const json = await generateFortuneJson({date, apiKey, model});
    const propsPath = path.join(propsDir, `fortune-${date}.json`);
    await fs.writeFile(propsPath, JSON.stringify(json, null, 2), 'utf8');

    const outPath = path.join(outDir, `fortune-${date}.mp4`);
    process.stdout.write(`[${date}] rendering video...\n`);
    await renderVideo({entry, composition, outPath, propsPath});

    if (!keepJson) {
      await fs.unlink(propsPath);
    }
  }
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
