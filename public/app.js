// Fokus-Postfach — Dashboard-Logik. Kein Framework, kein Build-Schritt.
// Mail-Inhalte sind fremde Daten: alles läuft durch esc(), bevor es ins HTML geht.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = null; // Zustand vom Server
let view = 'jetzt'; // jetzt | abends | erledigt | regeln
let inboxFilter = 'alle';
const open = new Set(); // aufgeklappte Mails

const ACTION = { antworten: 'Antworten', zahlen: 'Zahlen', termin: 'Termin klären', erledigen: 'Erledigen' };
const SOURCE = { regel: 'Regel', ki: 'KI', heuristik: 'Automatik', manuell: 'Du' };
const GROUP_ORDER = ['CC/Info', 'Benachrichtigung', 'Newsletter', 'Werbung', 'Sonstiges'];

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.state) S = json.state;
  else if (method === 'GET') S = json;
  if (json.ok === false) toast(json.error || 'Das hat nicht geklappt.');
  return json;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 4200);
}

function when(iso) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  if (mins < 24 * 60) return `vor ${Math.round(mins / 60)} Std`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

const inbox = (id) => S.inboxes.find((i) => i.id === id) || { label: id, color: '#999' };
const visible = (e) => inboxFilter === 'alle' || e.inboxId === inboxFilter;
const openMails = (bucket) => S.emails.filter((e) => !e.done && e.bucket === bucket);

// ── Kopfbereich ──────────────────────────────────────────
function renderChrome() {
  const badge = $('modeBadge');
  badge.hidden = !S.demoMode;
  badge.textContent = 'Demo';
  $('resetBtn').hidden = !S.demoMode;
  $('lastSync').textContent = S.meta.lastSync
    ? `Zuletzt geprüft: ${new Date(S.meta.lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : 'Noch nicht geprüft';

  const errs = Object.entries(S.meta.errors || {});
  $('errors').innerHTML = errs
    .map(([id, msg]) => `<div class="banner"><strong>${esc(inbox(id).label)}</strong> konnte nicht gelesen werden: ${esc(msg)}</div>`)
    .join('');

  const counts = {
    jetzt: openMails('wichtig').length,
    abends: openMails('spaeter').length,
    erledigt: S.emails.filter((e) => e.done).length,
    regeln: S.rules.wichtig.length + S.rules.spaeter.length,
  };
  const labels = { jetzt: 'Jetzt', abends: 'Abends', erledigt: 'Erledigt', regeln: 'Regeln' };
  $('tabs').innerHTML = Object.keys(labels)
    .map((k) => `<button class="tab" role="tab" aria-selected="${view === k}" data-view="${k}">${labels[k]}<span class="n">${counts[k]}</span></button>`)
    .join('');

  $('chips').hidden = view === 'regeln';
  const pool = view === 'jetzt' ? openMails('wichtig') : view === 'abends' ? openMails('spaeter') : S.emails.filter((e) => e.done);
  const chip = (id, label, color) => {
    const n = id === 'alle' ? pool.length : pool.filter((e) => e.inboxId === id).length;
    return `<button class="chip" aria-pressed="${inboxFilter === id}" data-inbox="${esc(id)}">${color ? `<span class="dot" style="background:${esc(color)}"></span>` : ''}${esc(label)} · ${n}</button>`;
  };
  $('chips').innerHTML = chip('alle', 'Alle Postfächer') + S.inboxes.map((i) => chip(i.id, i.label, i.color)).join('');
}

// ── Bausteine ────────────────────────────────────────────
function detail(e) {
  if (!open.has(e.id)) return '';
  const mailto = `mailto:${encodeURIComponent(e.from.email)}?subject=${encodeURIComponent(/^re:/i.test(e.subject) ? e.subject : 'Re: ' + e.subject)}&body=${encodeURIComponent(e.draft || '')}`;
  const draft = e.draft != null
    ? `<div class="draft">
         <label for="d-${esc(e.id)}">Antwort-Entwurf (wird nicht gesendet — kopieren oder im Mail-Programm öffnen)</label>
         <textarea id="d-${esc(e.id)}">${esc(e.draft)}</textarea>
         <div class="actions">
           <button class="btn small" data-act="copy" data-id="${esc(e.id)}">Kopieren</button>
           <a class="btn small ghost" href="${esc(mailto)}" style="text-decoration:none">Im Mail-Programm öffnen</a>
         </div>
       </div>`
    : `<div class="actions"><button class="btn small ghost" data-act="draft" data-id="${esc(e.id)}">Antwort-Entwurf erstellen</button></div>`;
  return `<div class="body"><pre>${esc(e.text || '(kein Text)')}</pre>${draft}</div>`;
}

function card(e) {
  const box = inbox(e.inboxId);
  const todo = ACTION[e.action] ? `<span class="tag todo">${ACTION[e.action]}</span>` : '';
  const moveBtn = e.bucket === 'wichtig'
    ? `<button class="btn small ghost" data-act="move" data-to="spaeter" data-id="${esc(e.id)}">Kann warten</button>`
    : `<button class="btn small ghost" data-act="move" data-to="wichtig" data-id="${esc(e.id)}">Doch wichtig</button>`;
  return `<article class="mail ${e.done ? 'done' : ''}">
    <div class="mail-top">
      <span class="dot" style="background:${esc(box.color)}"></span><span class="box">${esc(box.label)}</span>
      <span>·</span><span class="who" title="${esc(e.from.email)}">${esc(e.from.name || e.from.email)}</span>
      <span class="when">${when(e.date)}</span>
    </div>
    <div class="subject">${esc(e.subject)}</div>
    <div class="summary">${esc(e.summary)}</div>
    <div class="tags">${todo}<span class="tag">${esc(e.category)}</span>
      <span class="why">${esc(SOURCE[e.source] || 'Automatik')}: ${esc(e.reason)}</span></div>
    <div class="actions">
      ${e.done
        ? `<button class="btn small ghost" data-act="done" data-done="0" data-id="${esc(e.id)}">Wieder öffnen</button>`
        : `<button class="btn small accent" data-act="done" data-done="1" data-id="${esc(e.id)}">Erledigt</button>${moveBtn}`}
      <button class="btn small ghost" data-act="toggle" data-id="${esc(e.id)}" aria-expanded="${open.has(e.id)}">${open.has(e.id) ? 'Mail schließen' : 'Mail anzeigen'}</button>
    </div>
    ${detail(e)}
  </article>`;
}

function row(e) {
  const box = inbox(e.inboxId);
  const isOpen = open.has(e.id);
  return `<div class="row">
    <button class="row-main" data-act="toggle" data-id="${esc(e.id)}" aria-expanded="${isOpen}">
      <span class="dot" style="background:${esc(box.color)}" title="${esc(box.label)}"></span>
      <span class="who">${esc(e.from.name || e.from.email)}</span>
      <span class="what">${esc(e.subject)} <span>— ${esc(e.summary)}</span></span>
      <span class="when">${when(e.date)}</span>
    </button>
    ${isOpen ? `<div class="actions">
        <button class="btn small accent" data-act="done" data-done="1" data-id="${esc(e.id)}">Gelesen</button>
        <button class="btn small ghost" data-act="move" data-to="wichtig" data-id="${esc(e.id)}">Doch wichtig</button>
      </div>${detail(e)}` : ''}
  </div>`;
}

const lead = (h, p) => `<div class="lead"><h1>${h}</h1><p>${p}</p></div>`;
const empty = (h, p) => `<div class="empty"><strong>${h}</strong>${p}</div>`;

// ── Ansichten ────────────────────────────────────────────
function viewJetzt() {
  const all = openMails('wichtig');
  const list = all.filter(visible);
  const later = openMails('spaeter').length;
  const head = lead(
    all.length ? `${all.length} ${all.length === 1 ? 'Mail braucht' : 'Mails brauchen'} dich jetzt` : 'Nichts Wichtiges offen',
    `${later} weitere ${later === 1 ? 'wartet' : 'warten'} gebündelt unter „Abends".`,
  );
  if (!list.length) return head + empty('Alles Wichtige ist erledigt.', 'Der Rest kann bis heute Abend warten.');
  return head + list.map(card).join('');
}

function viewAbends() {
  const all = openMails('spaeter');
  const list = all.filter(visible);
  const head = lead(
    all.length ? `${all.length} ${all.length === 1 ? 'Mail' : 'Mails'} für den Abend` : 'Der Abend ist frei',
    'Nach Art gebündelt. Überfliegen, bei Bedarf aufklappen, dann die ganze Gruppe abhaken.',
  );
  if (!list.length) return head + empty('Nichts mehr offen.', 'Alle Nice-to-have-Mails sind durchgesehen.');
  const cats = [...new Set(list.map((e) => e.category))].sort(
    (a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99),
  );
  return head + cats.map((cat) => {
    const mails = list.filter((e) => e.category === cat);
    const senders = [...new Set(mails.map((e) => e.from.name || e.from.email))];
    const from = senders.slice(0, 4).join(', ') + (senders.length > 4 ? ` und ${senders.length - 4} weitere` : '');
    return `<section class="group">
      <div class="group-head">
        <div class="grow"><h2>${esc(cat)}<span class="count">${mails.length}</span></h2><div class="from">${esc(from)}</div></div>
        <button class="btn small ghost" data-act="group" data-cat="${esc(cat)}">Alle gelesen</button>
      </div>
      ${mails.map(row).join('')}
    </section>`;
  }).join('');
}

function viewErledigt() {
  const list = S.emails.filter((e) => e.done && visible(e)).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  const head = lead('Erledigt', 'Abgehakte Mails. In deinen Postfächern selbst wurde nichts verändert.');
  return head + (list.length ? list.map(card).join('') : empty('Noch nichts abgehakt.', ''));
}

function viewRegeln() {
  const box = (bucket, title, text) => {
    const items = S.rules[bucket];
    return `<div class="rulebox">
      <h2>${title}</h2><p>${text}</p>
      ${items.length
        ? `<ul>${items.map((p) => `<li><span>${esc(p)}</span><button data-act="rule-del" data-bucket="${bucket}" data-pattern="${esc(p)}" aria-label="Regel ${esc(p)} entfernen">Entfernen</button></li>`).join('')}</ul>`
        : '<div class="none">Noch keine Regel.</div>'}
      <form data-bucket="${bucket}">
        <input name="pattern" placeholder="name@firma.de oder @firma.de" aria-label="Adresse oder Domain" autocomplete="off">
        <button class="btn small" type="submit">Hinzufügen</button>
      </form>
    </div>`;
  };
  return lead('Regeln', 'Feste Absender gehen vor der KI-Einstufung. Jede Korrektur per „Kann warten" oder „Doch wichtig" legt hier automatisch eine Regel an.')
    + `<div class="rules">${box('wichtig', 'Immer unter „Jetzt"', 'Kunden, Steuerberater, Familie.')}${box('spaeter', 'Immer unter „Abends"', 'Absender, die nie eilig sind.')}</div>`;
}

function render() {
  if (!S) return;
  renderChrome();
  $('view').innerHTML = { jetzt: viewJetzt, abends: viewAbends, erledigt: viewErledigt, regeln: viewRegeln }[view]();
}

// ── Ereignisse ───────────────────────────────────────────
$('tabs').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-view]');
  if (!b) return;
  view = b.dataset.view;
  render();
});

$('chips').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-inbox]');
  if (!b) return;
  inboxFilter = b.dataset.inbox;
  render();
});

$('view').addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const { act, id } = b.dataset;
  const enc = encodeURIComponent(id || '');

  if (act === 'toggle') {
    open.has(id) ? open.delete(id) : open.add(id);
  } else if (act === 'done') {
    await api('POST', `/api/emails/${enc}/done`, { done: b.dataset.done === '1' });
    open.delete(id);
  } else if (act === 'move') {
    const r = await api('POST', `/api/emails/${enc}/move`, { bucket: b.dataset.to });
    if (r.ok) {
      const ziel = b.dataset.to === 'wichtig' ? '„Jetzt"' : '„Abends"';
      toast(`Gemerkt: ${r.pattern} landet künftig unter ${ziel}.${r.others ? ` ${r.others} weitere verschoben.` : ''}`);
    }
    open.delete(id);
  } else if (act === 'group') {
    const r = await api('POST', '/api/group-done', { category: b.dataset.cat, inboxId: inboxFilter === 'alle' ? null : inboxFilter });
    if (r.ok) toast(`${r.count} ${r.count === 1 ? 'Mail' : 'Mails'} abgehakt.`);
  } else if (act === 'draft') {
    b.disabled = true;
    b.textContent = 'Entwurf wird erstellt …';
    await api('POST', `/api/emails/${enc}/draft`);
  } else if (act === 'copy') {
    const ta = document.getElementById(`d-${id}`);
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('Entwurf kopiert.');
    } catch {
      ta.select();
      toast('Bitte mit Cmd+C kopieren.');
    }
    return;
  } else if (act === 'rule-del') {
    await api('DELETE', '/api/rules', { bucket: b.dataset.bucket, pattern: b.dataset.pattern });
  }
  render();
});

$('view').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target;
  const pattern = f.pattern.value.trim();
  if (!pattern) return;
  const r = await api('POST', '/api/rules', { bucket: f.dataset.bucket, pattern });
  if (r.ok) toast(`Regel gespeichert: ${r.pattern}`);
  render();
});

async function busy(btn, label, fn) {
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = label;
  try {
    await fn();
  } catch {
    toast('Server nicht erreichbar.');
  }
  btn.disabled = false;
  btn.textContent = old;
  render();
}

$('syncBtn').addEventListener('click', (ev) =>
  busy(ev.currentTarget, 'Prüfe …', async () => {
    const r = await api('POST', '/api/sync');
    toast(r.created ? `${r.created} neue ${r.created === 1 ? 'Mail' : 'Mails'} einsortiert.` : 'Keine neuen Mails.');
  }));

$('resetBtn').addEventListener('click', (ev) => busy(ev.currentTarget, 'Setze zurück …', () => api('POST', '/api/demo-reset')));

// Start + regelmäßig nachladen (nur wenn gerade nichts aufgeklappt ist).
async function load() {
  try {
    await api('GET', '/api/state');
    render();
  } catch {
    $('view').innerHTML = empty('Server nicht erreichbar.', 'Läuft „npm start" noch?');
  }
}
load();
setInterval(() => { if (!open.size && view !== 'regeln') load(); }, 60000);
