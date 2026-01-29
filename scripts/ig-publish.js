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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const videoUrl = args['video-url'];
  const caption = args.caption || '';
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const apiVersion = process.env.IG_API_VERSION || 'v20.0';

  if (!videoUrl) throw new Error('--video-url is required');
  if (!igUserId) throw new Error('IG_USER_ID is required');
  if (!accessToken) throw new Error('IG_ACCESS_TOKEN is required');

  const base = `https://graph.facebook.com/${apiVersion}`;

  const createRes = await fetch(`${base}/${igUserId}/media`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    }),
  });

  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.id) {
    throw new Error(`Create media failed: ${JSON.stringify(createJson)}`);
  }

  const creationId = createJson.id;

  for (let i = 0; i < 12; i += 1) {
    const statusRes = await fetch(
      `${base}/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const statusJson = await statusRes.json();
    const status = statusJson.status_code;
    if (status === 'FINISHED') break;
    if (status === 'ERROR') {
      throw new Error(`Media processing error: ${JSON.stringify(statusJson)}`);
    }
    await sleep(10000);
  }

  const publishRes = await fetch(`${base}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });

  const publishJson = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(`Publish failed: ${JSON.stringify(publishJson)}`);
  }

  process.stdout.write(`Published: ${JSON.stringify(publishJson)}\n`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
