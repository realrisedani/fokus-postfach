// ─────────────────────────────────────────────────────────────────────────
//  DIE EINE STELLE ZUM EINRICHTEN.
//
//  1) profil            — wer du bist und was für dich wichtig ist (liest die KI)
//  2) wichtigeAbsender  — landen IMMER unter „Jetzt"
//  3) spaeterAbsender   — landen IMMER unter „Abends"
//  4) postfaecher       — deine Postfächer
//
//  Solange bei einem Postfach provider: 'mock' steht, kommen Beispieldaten.
//  Zum Live-Schalten provider auf 'imap' (Gmail) oder 'outlook' stellen und
//  die Zugangsdaten in die .env eintragen. Server neu starten — fertig.
//
//  Das Dashboard liest nur. Es wird nichts gelöscht, verschoben, als gelesen
//  markiert oder gesendet.
// ─────────────────────────────────────────────────────────────────────────

module.exports = {
  profil: `Ich bin selbstständiger Unternehmer.
Wichtig sind für mich: Mails von Kunden und Interessenten, Rechnungen und Fristen,
Terminanfragen, alles vom Steuerberater und von Behörden, persönliche Nachrichten
von echten Menschen, die eine Antwort von mir brauchen.
Nicht wichtig: Newsletter, Werbung, automatische Benachrichtigungen von Tools und
sozialen Netzwerken, Mails in denen ich nur in CC stehe.`,

  // Absender-Regeln: ganze Adresse ('anna@firma.de') oder Domain ('@firma.de').
  // Diese Listen sind nur die Startwerte. Was du im Dashboard per Klick
  // korrigierst oder im Reiter „Regeln" änderst, wird in data/ gespeichert.
  wichtigeAbsender: ['@bauer-partner.example', '@steuerberatung-lang.example'],
  spaeterAbsender: [],

  postfaecher: [
    {
      id: 'gmail-privat',
      label: 'Gmail privat',
      color: '#d97757',
      provider: 'mock', // → 'imap'
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        user: process.env.GMAIL_1_USER || '',
        pass: process.env.GMAIL_1_PASS || '', // App-Passwort, nicht das normale Passwort
      },
    },
    {
      id: 'gmail-firma',
      label: 'Gmail Firma',
      color: '#4f8ef7',
      provider: 'mock', // → 'imap'
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        user: process.env.GMAIL_2_USER || '',
        pass: process.env.GMAIL_2_PASS || '',
      },
    },
    {
      id: 'outlook',
      label: 'Outlook',
      color: '#1a8a4a',
      provider: 'mock', // → 'outlook' (vorher einmal: npm run outlook-login outlook)
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        tenant: process.env.OUTLOOK_TENANT || 'common',
      },
    },
  ],
};
