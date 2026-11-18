// Provider-Factory — wählt anhand von postfach.provider den richtigen Adapter.
// Jeder Adapter liefert fetchRecent(postfach, { sinceDays, limit }) →
// [{ uid, from:{name,email}, subject, text, date, unsub, cc }]
// und liest ausschließlich.

const REGISTRY = {
  mock: () => require('./mockProvider'),
  imap: () => require('./imapProvider'),
  outlook: () => require('./outlookProvider'),
};

function providerFor(inbox) {
  const load = REGISTRY[inbox.provider];
  if (!load) throw new Error(`Unbekannter provider "${inbox.provider}" (Postfach ${inbox.id})`);
  return load();
}

module.exports = { providerFor };
