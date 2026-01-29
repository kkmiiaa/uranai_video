const path = require('path');
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

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const propsPath = args.props || path.join('tmp', 'fortune.json');
  const outPath = args.out || 'out.mp4';
  const entry = args.entry || 'remotion/index.ts';
  const composition = args.composition || 'DailyFortune';

  await renderVideo({entry, composition, outPath, propsPath});
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
