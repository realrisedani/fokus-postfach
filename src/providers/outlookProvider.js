// outlookProvider — Outlook.com / Microsoft 365 über Microsoft Graph.
// Nur Lesezugriff (Mail.Read). Anmeldung einmalig per `npm run outlook-login`.

const { accessToken } = require('./outlookAuth');

const one = (r) => {
  const e = (r && r.emailAddress) || {};
  return { name: e.name || e.address || '', email: (e.address || '').toLowerCase() };
};

async function fetchRecent(inbox, { sinceDays = 7, limit = 100 } = {}) {
  const token = await accessToken(inbox);
  const headers = { Authorization: `Bearer ${token}`, Prefer: 'outlook.body-content-type="text"' };

  const me = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', { headers })
    .then((r) => r.json())
    .catch(() => ({}));
  const myAddr = String(me.mail || me.userPrincipalName || '').toLowerCase();

  const since = new Date(Date.now() - sinceDays * 864e5).toISOString();
  const q = new URLSearchParams({
    $top: String(Math.min(limit, 100)),
    $orderby: 'receivedDateTime desc',
    $filter: `receivedDateTime ge ${since}`,
    $select: 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,body',
  });
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?${q}`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error((json.error && json.error.message) || `Graph-Fehler ${res.status}`);

  return (json.value || []).map((m) => {
    const from = one(m.from);
    const to = (m.toRecipients || []).map((r) => one(r).email);
    const cc = (m.ccRecipients || []).map((r) => one(r).email);
    const text = ((m.body && m.body.content) || '').trim();
    return {
      uid: m.id,
      from,
      subject: m.subject || '(kein Betreff)',
      text,
      date: m.receivedDateTime,
      // Graph liefert den List-Unsubscribe-Header in der Liste nicht mit —
      // als Näherung zählt ein Abmelde-Link im Text.
      unsub: /unsubscribe|abmelden|abbestellen/i.test(text),
      cc: !!myAddr && cc.includes(myAddr) && !to.includes(myAddr),
    };
  });
}

module.exports = { fetchRecent, isMock: false };
