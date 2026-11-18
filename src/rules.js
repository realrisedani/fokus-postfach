// rules — feste Absender-Regeln (Stufe 1 des Filters).
// Ein Muster ist entweder eine ganze Adresse ('anna@firma.de') oder eine
// Domain ('@firma.de'). Eine Adress-Regel schlägt eine Domain-Regel; bei
// Gleichstand gewinnt „wichtig".

const store = require('./store');

const BUCKETS = ['wichtig', 'spaeter'];

function normalize(pattern) {
  let p = String(pattern || '').trim().toLowerCase();
  if (p && !p.includes('@')) p = '@' + p; // 'firma.de' → '@firma.de'
  return p;
}

// → { bucket, pattern } oder null
function match(address) {
  const a = String(address || '').toLowerCase();
  if (!a) return null;
  const rules = store.getRules();
  for (const bucket of BUCKETS) {
    if (rules[bucket].includes(a)) return { bucket, pattern: a };
  }
  const domain = a.slice(a.indexOf('@'));
  for (const bucket of BUCKETS) {
    if (rules[bucket].includes(domain)) return { bucket, pattern: domain };
  }
  return null;
}

function add(bucket, pattern) {
  const p = normalize(pattern);
  if (!BUCKETS.includes(bucket) || p.length < 3) return null;
  const rules = store.getRules();
  // Dasselbe Muster darf nur in einer Liste stehen.
  for (const b of BUCKETS) rules[b] = rules[b].filter((x) => x !== p);
  rules[bucket].push(p);
  store.persist();
  return p;
}

function remove(bucket, pattern) {
  const p = normalize(pattern);
  const rules = store.getRules();
  if (!BUCKETS.includes(bucket)) return;
  rules[bucket] = rules[bucket].filter((x) => x !== p);
  store.persist();
}

// Wendet die Regeln auf alle noch offenen Mails an (nach einer Regel-Änderung).
function reapply() {
  let moved = 0;
  for (const e of store.getAll()) {
    if (e.done) continue;
    const hit = match(e.from.email);
    if (hit && (e.bucket !== hit.bucket || e.source !== 'regel')) {
      if (e.bucket !== hit.bucket) moved++;
      e.bucket = hit.bucket;
      e.source = 'regel';
      e.reason = `${hit.pattern} steht auf deiner Liste für ${hit.bucket === 'wichtig' ? '„Jetzt"' : '„Abends"'}.`;
    }
  }
  store.persist();
  return moved;
}

module.exports = { match, add, remove, reapply, normalize, BUCKETS };
