// server — Express-API + liefert das Dashboard (public/) aus.
// Lauscht nur auf localhost: Das Dashboard ist für den eigenen Rechner gedacht.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');

const store = require('./store');
const rules = require('./rules');
const pipeline = require('./pipeline');
const { hasAI } = require('./ai/classify');
const { draft } = require('./ai/draft');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const demoMode = pipeline.inboxes.every((i) => i.provider === 'mock');

function state() {
  return {
    demoMode,
    ai: hasAI(),
    inboxes: pipeline.inboxes.map((i) => ({ id: i.id, label: i.label, color: i.color, provider: i.provider })),
    rules: store.getRules(),
    meta: store.getMeta(),
    emails: [...store.getAll()].sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
}
const ok = (res, extra = {}) => res.json({ ok: true, ...extra, state: state() });
const notFound = (res) => res.status(404).json({ ok: false, error: 'Mail nicht gefunden' });

app.get('/api/state', (req, res) => res.json(state()));

// Postfächer jetzt prüfen.
app.post('/api/sync', async (req, res) => {
  const r = await pipeline.runOnce();
  ok(res, r);
});

// Erledigt / wieder öffnen.
app.post('/api/emails/:id/done', (req, res) => {
  const done = req.body.done !== false;
  const rec = store.update(req.params.id, { done, doneAt: done ? new Date().toISOString() : null });
  return rec ? ok(res) : notFound(res);
});

// Korrektur: Mail in den anderen Bereich schieben. Merkt sich den Absender
// als Regel und zieht alle offenen Mails desselben Absenders mit.
app.post('/api/emails/:id/move', (req, res) => {
  const rec = store.getById(req.params.id);
  if (!rec) return notFound(res);
  const bucket = req.body.bucket;
  if (!rules.BUCKETS.includes(bucket)) return res.status(400).json({ ok: false, error: 'Unbekannter Bereich' });
  const pattern = rules.add(bucket, rec.from.email);
  const others = rules.reapply();
  store.update(rec.id, { bucket, source: 'manuell', reason: 'Von dir so eingestuft.' });
  ok(res, { pattern, others: Math.max(0, others - 1) });
});

// Eine ganze Abend-Gruppe als gelesen markieren.
app.post('/api/group-done', (req, res) => {
  const now = new Date().toISOString();
  let n = 0;
  for (const e of store.getAll()) {
    if (!e.done && e.bucket === 'spaeter' && e.category === req.body.category && (!req.body.inboxId || e.inboxId === req.body.inboxId)) {
      e.done = true;
      e.doneAt = now;
      n++;
    }
  }
  store.persist();
  ok(res, { count: n });
});

// Regeln von Hand pflegen.
app.post('/api/rules', (req, res) => {
  const p = rules.add(req.body.bucket, req.body.pattern);
  if (!p) return res.status(400).json({ ok: false, error: 'Bitte Adresse oder Domain angeben' });
  rules.reapply();
  ok(res, { pattern: p });
});
app.delete('/api/rules', (req, res) => {
  rules.remove(req.body.bucket, req.body.pattern);
  ok(res);
});

// Antwort-Entwurf auf Knopfdruck (wird nur angezeigt, nie gesendet).
app.post('/api/emails/:id/draft', async (req, res) => {
  const rec = store.getById(req.params.id);
  if (!rec) return notFound(res);
  const text = await draft(rec);
  store.update(rec.id, { draft: text });
  ok(res);
});

// Nur im Demo-Modus: Beispieldaten zurücksetzen.
app.post('/api/demo-reset', async (req, res) => {
  if (!demoMode) return res.status(400).json({ ok: false, error: 'Nur im Demo-Modus' });
  store.reset();
  await pipeline.runOnce();
  ok(res);
});

const PORT = Number(process.env.PORT || 4330);
const MIN = Math.max(1, Number(process.env.POLL_INTERVAL_MIN || 5));

app.listen(PORT, '127.0.0.1', () => {
  pipeline.runOnce();
  setInterval(() => pipeline.runOnce(), MIN * 60 * 1000);
  console.log('\n  Fokus-Postfach');
  console.log(`  → Dashboard:   http://localhost:${PORT}`);
  console.log(`  → Modus:       ${demoMode ? 'DEMO (Beispieldaten)' : 'LIVE'}`);
  console.log(`  → Einstufung:  ${hasAI() ? 'Claude (API-Key gefunden)' : 'regelbasiert (kein API-Key)'}`);
  console.log(`  → Abruf alle ${MIN} Min, nur lesend\n`);
});
