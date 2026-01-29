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

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file;
  if (!filePath) throw new Error('--file is required');

  const outPath = args.out || path.join('out', 'drive.json');
  const fileName = args.name || path.basename(filePath);
  const folderId = args.folder || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const clientId = process.env.DRIVE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DRIVE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('DRIVE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN are required');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({refresh_token: refreshToken});

  const drive = google.drive({version: 'v3', auth: oauth2Client});

  const createRes = await drive.files.create({
    requestBody: {
      name: fileName,
      ...(folderId ? {parents: [folderId]} : {}),
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, webViewLink, webContentLink',
  });

  const fileId = createRes.data.id;
  if (!fileId) {
    throw new Error('Failed to create Drive file');
  }

  const payload = {
    fileId,
    webViewLink: createRes.data.webViewLink,
    webContentLink: createRes.data.webContentLink,
  };

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Uploaded to Drive: ${fileId}`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
