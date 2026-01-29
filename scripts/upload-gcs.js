const path = require('path');
const fs = require('fs');
const {Storage} = require('@google-cloud/storage');

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
  const filePath = args.file;
  if (!filePath) throw new Error('--file is required');

  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) throw new Error('GCS_BUCKET is required');

  const key = args.key || path.basename(filePath);
  const outPath = args.out || path.join('out', 'gcs.json');

  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const storage = rawCreds
    ? new Storage({
        credentials: JSON.parse(rawCreds),
        projectId: JSON.parse(rawCreds).project_id,
      })
    : new Storage();
  const bucket = storage.bucket(bucketName);

  const uploadOptions = {
    destination: key,
    metadata: {
      contentType: 'video/mp4',
    },
  };

  await bucket.upload(filePath, uploadOptions);

  const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(key)}`;
  const payload = {bucket: bucketName, key, url};

  await fs.promises.mkdir(path.dirname(outPath), {recursive: true});
  await fs.promises.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  process.stdout.write(`Uploaded to GCS: ${url}\n`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
