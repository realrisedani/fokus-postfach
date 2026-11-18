// imapProvider — Gmail (und jedes andere Postfach mit IMAP + App-Passwort).
// Öffnet den Posteingang READ-ONLY: Es wird nichts als gelesen markiert,
// verschoben oder gelöscht.

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

function addr(a) {
  const v = a && a.value && a.value[0];
  return v ? { name: v.name || v.address || '', email: (v.address || '').toLowerCase() } : { name: '', email: '' };
}
const list = (a) => ((a && a.value) || []).map((v) => (v.address || '').toLowerCase());

async function fetchRecent(inbox, { sinceDays = 7, limit = 100 } = {}) {
  const c = inbox.imap || {};
  if (!c.user || !c.pass) throw new Error('Zugangsdaten fehlen (Benutzer / App-Passwort in der .env)');

  const client = new ImapFlow({
    host: c.host,
    port: c.port || 993,
    secure: true,
    auth: { user: c.user, pass: c.pass },
    logger: false,
  });

  const out = [];
  await client.connect();
  const lock = await client.getMailboxLock('INBOX', { readOnly: true });
  try {
    const since = new Date(Date.now() - sinceDays * 864e5);
    const uids = (await client.search({ since }, { uid: true })) || [];
    const take = uids.slice(-limit);
    if (take.length) {
      const me = c.user.toLowerCase();
      for await (const msg of client.fetch(take, { uid: true, source: true }, { uid: true })) {
        const p = await simpleParser(msg.source);
        const to = list(p.to);
        const cc = list(p.cc);
        out.push({
          uid: String(msg.uid),
          from: addr(p.from),
          subject: p.subject || '(kein Betreff)',
          text: (p.text || '').toString().trim(),
          date: (p.date || new Date()).toISOString(),
          unsub: p.headers.has('list-unsubscribe'),
          cc: cc.includes(me) && !to.includes(me),
        });
      }
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
  return out;
}

module.exports = { fetchRecent, isMock: false };
