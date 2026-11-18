// outlookAuth — Anmeldung bei Microsoft per Geräte-Code (OAuth 2.0).
// Microsoft erlaubt für Outlook kein IMAP mit Passwort mehr, deshalb läuft
// Outlook über Microsoft Graph. Angefragt wird nur Mail.Read (nur lesen).
// Das Token liegt lokal in data/outlook-<postfach-id>.json (nicht im Repo).

const fs = require('fs');
const path = require('path');

const SCOPE = 'offline_access Mail.Read';
const base = (tenant) => `https://login.microsoftonline.com/${tenant || 'common'}/oauth2/v2.0`;
const tokenFile = (id) => path.join(__dirname, '..', '..', 'data', `outlook-${id}.json`);

async function post(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  return { ok: res.ok, json: await res.json() };
}

function save(id, t) {
  fs.mkdirSync(path.dirname(tokenFile(id)), { recursive: true });
  fs.writeFileSync(
    tokenFile(id),
    JSON.stringify({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: Date.now() + (t.expires_in - 60) * 1000,
    }),
    { mode: 0o600 },
  );
}

// Einmalige Anmeldung (wird von scripts/outlook-login.js aufgerufen).
async function deviceLogin(inbox, log = console.log) {
  const { clientId, tenant } = inbox.outlook || {};
  if (!clientId) throw new Error('OUTLOOK_CLIENT_ID fehlt in der .env');

  const start = await post(`${base(tenant)}/devicecode`, { client_id: clientId, scope: SCOPE });
  if (!start.ok) throw new Error(start.json.error_description || 'Geräte-Code konnte nicht angefordert werden');
  log(`\n  1) Öffne  ${start.json.verification_uri}`);
  log(`  2) Gib den Code ein:  ${start.json.user_code}`);
  log('  3) Melde dich mit dem Outlook-Konto an und bestätige den Lesezugriff.\n');

  const deadline = Date.now() + start.json.expires_in * 1000;
  let wait = (start.json.interval || 5) * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, wait));
    const t = await post(`${base(tenant)}/token`, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: clientId,
      device_code: start.json.device_code,
    });
    if (t.ok) return save(inbox.id, t.json);
    if (t.json.error === 'slow_down') wait += 5000;
    else if (t.json.error !== 'authorization_pending') throw new Error(t.json.error_description || t.json.error);
  }
  throw new Error('Zeit abgelaufen — bitte erneut starten.');
}

// Gültiges Access-Token liefern, bei Bedarf per Refresh-Token erneuern.
async function accessToken(inbox) {
  let t;
  try {
    t = JSON.parse(fs.readFileSync(tokenFile(inbox.id), 'utf8'));
  } catch {
    throw new Error(`Noch nicht angemeldet — einmal ausführen: npm run outlook-login ${inbox.id}`);
  }
  if (t.expires_at > Date.now()) return t.access_token;

  const { clientId, tenant } = inbox.outlook || {};
  const r = await post(`${base(tenant)}/token`, {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: t.refresh_token,
    scope: SCOPE,
  });
  if (!r.ok) throw new Error(`Anmeldung abgelaufen — erneut ausführen: npm run outlook-login ${inbox.id}`);
  save(inbox.id, { refresh_token: t.refresh_token, ...r.json });
  return r.json.access_token;
}

module.exports = { deviceLogin, accessToken };
