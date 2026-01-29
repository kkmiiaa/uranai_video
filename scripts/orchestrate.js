const fs = require('fs/promises');
const path = require('path');
const {spawn} = require('child_process');
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
  const promptPath = args.prompt;
  const uploadGcs = args['upload-gcs'] === 'true';
  const uploadDrive = args['upload-drive'] === 'true';
  const cleanup = args.cleanup === 'true';
  const uploadSuffix = args['upload-suffix'] || '';

  const run = (command, cmdArgs) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, cmdArgs, {stdio: 'inherit'});
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} exited with code ${code}`));
      });
    });

  await fs.mkdir(propsDir, {recursive: true});

  for (const date of dates) {
    process.stdout.write(`\n[${date}] generating JSON...\n`);
    let json;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const rawOutputPath = path.join(propsDir, `raw-${date}-attempt-${attempt}.txt`);
      try {
        json = await generateFortuneJson({
          date,
          apiKey,
          model,
          promptPath,
          rawOutputPath,
        });
        break;
      } catch (err) {
        if (attempt === 3) {
          throw err;
        }
        process.stdout.write(`[${date}] JSON parse failed, retrying (${attempt}/3)...\n`);
      }
    }
    const propsPath = path.join(propsDir, `fortune-${date}.json`);
    await fs.writeFile(propsPath, JSON.stringify(json, null, 2), 'utf8');

    const outPath = path.join(outDir, `fortune-${date}.mp4`);
    process.stdout.write(`[${date}] rendering video...\n`);
    await renderVideo({entry, composition, outPath, propsPath});

    if (uploadGcs) {
      const keySuffix = uploadSuffix ? `-${uploadSuffix}` : '';
      const key = `fortune-${date}${keySuffix}.mp4`;
      const gcsOut = path.join(outDir, `gcs-${date}.json`);
      process.stdout.write(`[${date}] uploading to GCS...\n`);
      await run('node', [
        'scripts/upload-gcs.js',
        '--file',
        outPath,
        '--key',
        key,
        '--out',
        gcsOut,
      ]);
    }

    if (uploadDrive) {
      const nameSuffix = uploadSuffix ? `-${uploadSuffix}` : '';
      const name = `fortune-${date}${nameSuffix}.mp4`;
      const driveOut = path.join(outDir, `drive-${date}.json`);
      process.stdout.write(`[${date}] uploading to Drive...\n`);
      await run('node', [
        'scripts/upload-drive-refresh.js',
        '--file',
        outPath,
        '--name',
        name,
        '--out',
        driveOut,
      ]);
    }

    if (!keepJson) {
      await fs.unlink(propsPath);
    }

    if (cleanup) {
      await fs.unlink(outPath);
    }
  }
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
