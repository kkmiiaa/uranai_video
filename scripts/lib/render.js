const {spawn} = require('child_process');

const run = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit', ...options});
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
};

const renderVideo = async ({
  entry = 'remotion/index.ts',
  composition = 'DailyFortune',
  outPath,
  propsPath,
}) => {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    'remotion',
    'render',
    entry,
    composition,
    outPath,
    `--props=${propsPath}`,
  ];
  await run(npx, args);
};

module.exports = {
  renderVideo,
};
