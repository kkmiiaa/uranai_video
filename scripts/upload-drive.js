const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');

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

const loadServiceAccount = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_FILE) {
    const content = fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_FILE, 'utf8');
    return JSON.parse(content);
  }
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE is required');
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file;
  if (!filePath) {
    throw new Error('--file is required');
  }

  const outPath = args.out || path.join('out', 'drive.json');
  const fileName = args.name || path.basename(filePath);
  const folderId = args.folder || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const creds = loadServiceAccount();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({version: 'v3', auth});

  const createRes = await drive.files.create({
    requestBody: {
      name: fileName,
      ...(folderId ? {parents: [folderId]} : {}),
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(filePath),
    },
    fields: 'id',
  });

  const fileId = createRes.data.id;
  if (!fileId) {
    throw new Error('Failed to create Drive file');
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const info = await drive.files.get({
    fileId,
    fields: 'id, webViewLink, webContentLink',
  });

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const payload = {
    fileId,
    webViewLink: info.data.webViewLink,
    webContentLink: info.data.webContentLink,
    downloadUrl,
  };

  await fs.promises.mkdir(path.dirname(outPath), {recursive: true});
  await fs.promises.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  process.stdout.write(`Uploaded to Drive: ${fileId}\n`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
