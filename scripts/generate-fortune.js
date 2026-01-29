const fs = require('fs/promises');
const path = require('path');
const {DEFAULT_MODEL, generateFortuneJson} = require('./lib/gemini');

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

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const date = ensureDate(args.date);
  const outPath = args.out || path.join('tmp', `fortune-${date}.json`);
  const model = args.model || DEFAULT_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;

  const json = await generateFortuneJson({date, apiKey, model});
  await fs.mkdir(path.dirname(outPath), {recursive: true});
  await fs.writeFile(outPath, JSON.stringify(json, null, 2), 'utf8');
  process.stdout.write(`Wrote ${outPath}\n`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
