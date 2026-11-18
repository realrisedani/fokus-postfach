// pipeline — holt neue Mails aus allen Postfächern und stuft sie ein.
// Reihenfolge je Mail: 1) Absender-Regel  2) Claude bzw. Fallback.
// Stufe 3 (Korrektur per Klick) passiert im Dashboard und schreibt Regeln.

const config = require('../config/postfaecher');
const { providerFor } = require('./providers');
const { classify, heuristic } = require('./ai/classify');
const rules = require('./rules');
const store = require('./store');

const inboxes = config.postfaecher;

async function processMessage(inbox, raw) {
  const id = `${inbox.id}:${raw.uid}`;
  if (store.exists(id)) return false;

  const hit = rules.match(raw.from.email);
  let cls;
  if (hit) {
    // Regel entscheidet die Einstufung; Zusammenfassung/Aktion kommen
    // trotzdem von der KI (bei „Später"-Regeln sparen wir uns den Aufruf).
    const detail = hit.bucket === 'wichtig' ? await classify(raw, inbox) : heuristic(raw);
    cls = { ...detail, bucket: hit.bucket, source: 'regel', reason: `${hit.pattern} steht auf deiner Liste für ${hit.bucket === 'wichtig' ? '„Jetzt"' : '„Abends"'}.` };
  } else if (raw.unsub) {
    cls = heuristic(raw); // Newsletter brauchen keine KI
  } else {
    cls = await classify(raw, inbox);
  }

  store.insert({
    id,
    inboxId: inbox.id,
    from: raw.from,
    subject: raw.subject,
    text: (raw.text || '').slice(0, 20000),
    date: raw.date,
    cc: !!raw.cc,
    bucket: cls.bucket,
    category: cls.category,
    summary: cls.summary,
    action: cls.action,
    reason: cls.reason,
    source: cls.source,
    done: false,
    doneAt: null,
    draft: null,
  });
  return true;
}

async function processInbox(inbox) {
  const raws = await providerFor(inbox).fetchRecent(inbox, {
    sinceDays: Number(process.env.SINCE_DAYS || 7),
    limit: 100,
  });
  const fresh = raws.filter((r) => !store.exists(`${inbox.id}:${r.uid}`));
  let created = 0;
  // In kleinen Paketen parallel, damit ein voller Posteingang nicht ewig dauert.
  for (let i = 0; i < fresh.length; i += 5) {
    const done = await Promise.all(fresh.slice(i, i + 5).map((r) => processMessage(inbox, r)));
    created += done.filter(Boolean).length;
  }
  return created;
}

let running = null;

// Alle Postfächer einmal durchlaufen. Ein Fehler in einem Postfach stoppt die
// anderen nicht, sondern wird im Dashboard angezeigt.
function runOnce() {
  if (running) return running;
  running = (async () => {
    let created = 0;
    const errors = {};
    for (const inbox of inboxes) {
      try {
        created += await processInbox(inbox);
      } catch (e) {
        errors[inbox.id] = e.message;
      }
    }
    store.setSync(new Date().toISOString(), errors);
    return { created, errors };
  })().finally(() => {
    running = null;
  });
  return running;
}

module.exports = { runOnce, inboxes };
