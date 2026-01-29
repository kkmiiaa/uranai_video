const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const {google} = require('googleapis');

const TOKEN_PATH = path.join(process.cwd(), 'secrets', 'drive-token.json');
const CREDS_PATH = path.join(process.cwd(), 'secrets', 'drive-oauth.json');
const REDIRECT_URI = 'http://localhost:42813/oauth2callback';

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

const loadCredentials = () => {
  const raw = fs.readFileSync(CREDS_PATH, 'utf8');
  const json = JSON.parse(raw);
  return json.installed || json.web;
};

const ensureToken = async (oauth2Client) => {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
    return;
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  });

  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);

  await new Promise((resolve, reject) => {
    const server = http
      .createServer(async (req, res) => {
        if (!req.url) return;
        const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
        const code = qs.get('code');
        if (!code) return;

        res.end('Authorization successful! You can close this tab.');
        server.close();

        try {
          const {tokens} = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          fs.mkdirSync(path.dirname(TOKEN_PATH), {recursive: true});
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .listen(42813, () => {
        // Server ready
      });
  });
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file;
  if (!filePath) throw new Error('--file is required');

  const outPath = args.out || path.join('out', 'drive.json');
  const fileName = args.name || path.basename(filePath);
  const folderId = args.folder || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const {client_id, client_secret} = loadCredentials();
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  await ensureToken(oauth2Client);

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
