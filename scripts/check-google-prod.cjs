const https = require('https');

const GOOGLE_ID = '940443885790-5tusmho5t1kupi2sctk5bdcj3l83hehn.apps.googleusercontent.com';
const BASE = 'https://tinhoc24h.giasutinhoc24h.com';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    }).on('error', reject);
  });
}

(async () => {
  const login = await get(`${BASE}/login`);
  const jsFiles = [...login.body.matchAll(/\/assets\/[^"']+\.js/g)].map((m) => m[0]);
  const unique = [...new Set(jsFiles)];

  console.log('Login status:', login.status);
  console.log('JS chunks on login page:', unique.length);

  let foundIn = [];
  for (const file of unique) {
    const { body } = await get(`${BASE}${file}`);
    if (body.includes(GOOGLE_ID) || body.includes('googleusercontent.com') || body.includes('GoogleLogin')) {
      foundIn.push(file);
    }
  }

  // lazy login chunk
  for (const file of unique) {
    const { body } = await get(`${BASE}${file}`);
    const lazy = [...body.matchAll(/\/assets\/Login-[^"']+\.js/g)].map((m) => m[0]);
    for (const lf of [...new Set(lazy)]) {
      const { body: lb } = await get(`${BASE}${lf}`);
      if (lb.includes(GOOGLE_ID) || lb.includes('googleusercontent')) foundIn.push(lf);
    }
  }

  console.log('Google Client ID in frontend build:', foundIn.length ? `YES (${foundIn.join(', ')})` : 'NO');

  const health = await get(`${BASE}/api/health`);
  console.log('API health:', health.body.slice(0, 120));
})();
