// store — einfacher JSON-Datei-Store (data/state.json).
// Hält Mails, Absender-Regeln und Sync-Status. Für ein paar hundert Mails pro
// Woche völlig ausreichend.

const fs = require('fs');
const path = require('path');
const config = require('../config/postfaecher');

const FILE = path.join(__dirname, '..', 'data', 'state.json');

function fresh() {
  return {
    emails: [],
    rules: {
      wichtig: (config.wichtigeAbsender || []).map((p) => p.toLowerCase()),
      spaeter: (config.spaeterAbsender || []).map((p) => p.toLowerCase()),
    },
    meta: { lastSync: null, errors: {} },
  };
}

let state = load();

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return fresh();
  }
}

function persist() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function reset() {
  state = fresh();
  persist();
}

const getAll = () => state.emails;
const getById = (id) => state.emails.find((e) => e.id === id);
const exists = (id) => state.emails.some((e) => e.id === id);

function insert(email) {
  state.emails.push(email);
  persist();
  return email;
}

function update(id, patch) {
  const e = getById(id);
  if (!e) return null;
  Object.assign(e, patch);
  persist();
  return e;
}

const getRules = () => state.rules;
const getMeta = () => state.meta;

function setSync(ts, errors) {
  state.meta.lastSync = ts;
  state.meta.errors = errors;
  persist();
}

module.exports = { getAll, getById, exists, insert, update, getRules, getMeta, setSync, persist, reset };
