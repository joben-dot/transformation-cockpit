import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const base = new URL(process.env.PAGE_URL);
const expected = process.env.EXPECTED_REVISION;
assert(expected, 'EXPECTED_REVISION is required');
const attempts = Number(process.env.VERIFY_ATTEMPTS || 12);
assert(Number.isInteger(attempts) && attempts > 0, 'Invalid attempt count');

async function get(path) {
  const url = new URL(path, base);
  assert.equal(url.origin, base.origin, 'Only same-origin deployment assets are checked');
  url.searchParams.set('verify', `${expected}-${Date.now()}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert(response.ok, `${url.pathname}: HTTP ${response.status}`);
  return response;
}

for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    const metadata = await (await get('deployment.json')).json();
    assert.equal(metadata.revision, expected, 'Published revision differs from this deployment');
    const html = await (await get('./')).text();
    assert.match(html, /id=["']root["']/, 'Application root is missing');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1]);
    const styles = [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css)["']/gi)].map(match => match[1]);
    assert(scripts.length > 0 && styles.length > 0, 'Application script or stylesheet is missing');
    for (const path of [...scripts, ...styles]) {
      const response = await get(path);
      const content = await response.text();
      assert(content.length > 0, `Empty asset: ${path}`);
      assert(!/text\/html/i.test(response.headers.get('content-type') || ''), `HTML returned for asset: ${path}`);
    }
    console.log(`Verified published revision ${expected} and ${scripts.length + styles.length} application assets.`);
    break;
  } catch (error) {
    if (attempt === attempts) throw error;
    console.log(`Publication check ${attempt}/${attempts}: ${error.message}. Waiting for Pages.`);
    await delay(5000);
  }
}
