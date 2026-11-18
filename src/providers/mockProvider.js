// mockProvider — frei erfundene Beispieldaten für den Demo-Modus.
// 30 Mails über drei Postfächer, davon rund ein Fünftel wirklich wichtig.

const m = (from, email, subject, text, flags = {}) => ({ from: { name: from, email }, subject, text, ...flags });
const NL = { unsub: true };
const CC = { cc: true };

const SAMPLE = {
  'gmail-firma': [
    m('Martina Bauer', 'm.bauer@bauer-partner.example', 'Angebot Website-Relaunch — Rückfrage vor Freitag',
      'Hallo,\n\nwir haben Ihr Angebot im Team besprochen und würden gern starten. Eine Frage noch: Ist die Schulung für unsere zwei Mitarbeiterinnen im Preis enthalten? Wenn ja, unterschreibe ich bis Freitag.\n\nViele Grüße\nMartina Bauer'),
    m('Kanzlei Lang', 'kanzlei@steuerberatung-lang.example', 'Fehlende Belege für die Umsatzsteuer-Voranmeldung',
      'Guten Tag,\n\nfür die Voranmeldung fehlen uns noch drei Belege aus dem letzten Monat (Liste im Anhang). Bitte reichen Sie diese bis zum 8. nach, damit wir die Frist am 10. halten.\n\nMit freundlichen Grüßen\nKanzlei Lang'),
    m('Sabine Kurz', 'sabine.kurz@kurz-praxis.example', 'Anfrage: Online-Terminbuchung für unsere Praxis',
      'Guten Tag,\n\nSie wurden mir von einer Kollegin empfohlen. Wir suchen jemanden, der uns eine Online-Terminbuchung einrichtet. Könnten Sie uns dazu ein Angebot machen? Wann hätten Sie Zeit für ein kurzes Telefonat?\n\nFreundliche Grüße\nSabine Kurz'),
    m('Toolhouse News', 'news@toolhouse.example', '20 % auf alle Jahrespläne — nur diese Woche',
      'Sichere dir jetzt 20 % Rabatt auf alle Jahrespläne. Das Angebot endet am Sonntag um Mitternacht.', NL),
    m('Marketing Weekly', 'redaktion@marketing-weekly.example', 'Die 7 Trends, über die diese Woche alle reden',
      'In dieser Ausgabe: Was der neue Algorithmus für kleine Unternehmen bedeutet, drei Kampagnen zum Abschauen und ein Interview.', NL),
    m('Planboard', 'noreply@planboard.example', 'Tim hat einen Kommentar zu „Landingpage v2" hinterlassen',
      'Tim Engel: „Sieht gut aus, von mir aus kann das so live gehen." — Zum Kommentar im Board.'),
    m('Meetly', 'no-reply@meetly.example', 'Deine Aufzeichnung ist verfügbar',
      'Die Aufzeichnung deines Meetings vom Dienstag steht jetzt 30 Tage lang zum Abruf bereit.'),
    m('Tim Engel', 'tim@engel-design.example', 'Re: Farbvarianten Logo — Abstimmung mit Druckerei',
      'Hallo Herr Maier,\n\ndanke, dann drucken wir Variante B wie besprochen. Ich melde mich, wenn der Andruck da ist.\n\nGruß Tim', CC),
    m('Carla Roth', 'carla@roth-events.example', 'Re: Re: Ablaufplan Sommerfest (Version 4)',
      'Hi zusammen,\n\nim Anhang die aktualisierte Version des Ablaufplans, zur Info an alle. Änderungen sind gelb markiert.\n\nCarla', CC),
    m('Dennis Wolf', 'dennis.wolf@rank-boost.example', 'Ihre Website verschenkt 73 % Potenzial',
      'Hallo,\n\nich habe mir Ihre Website angesehen und einige Schwächen gefunden. Wir bieten eine kostenlose SEO-Analyse an, völlig unverbindlich. Darf ich Ihnen 15 Minuten zeigen, wie Sie auf Seite 1 kommen?\n\nDennis Wolf'),
    m('Petra Sommer', 'petra.sommer@sommer-coaching.example', 'Danke für das Gespräch gestern',
      'Hallo,\n\nnur kurz: vielen Dank für das nette Gespräch gestern, das hat mir wirklich weitergeholfen. Ich melde mich im neuen Jahr wieder.\n\nHerzliche Grüße\nPetra'),
  ],

  'outlook': [
    m('Jonas Reuter', 'j.reuter@reuter-logistik.example', 'Terminvorschlag: Donnerstag 10 Uhr?',
      'Hallo,\n\npasst Ihnen Donnerstag um 10 Uhr für den Abstimmungs-Call zum neuen Projekt? Alternativ ginge Freitag ab 14 Uhr. Bitte kurz bestätigen.\n\nBeste Grüße\nJonas Reuter'),
    m('Webhost Nord', 'noreply@webhost-nord.example', 'Zahlung fehlgeschlagen — Ihr Hosting wird in 3 Tagen pausiert',
      'Die Abbuchung für Ihr Hosting-Paket konnte nicht durchgeführt werden. Bitte aktualisieren Sie Ihre Zahlungsdaten innerhalb von 3 Tagen, sonst wird Ihre Website vorübergehend offline genommen.'),
    m('Netzwerk Pro', 'updates@netzwerk-pro.example', '5 neue Kontaktanfragen und 12 Profilbesuche',
      'Deine Woche im Überblick: 5 Personen möchten sich mit dir vernetzen, 12 haben dein Profil angesehen.', NL),
    m('Briefkasten Digital', 'post@briefkasten-digital.example', 'Der Montags-Brief: Warum weniger Tools mehr sind',
      'Guten Morgen! Heute geht es darum, warum die meisten Selbstständigen zu viele Tools nutzen und wie man aufräumt.', NL),
    m('Kalenderly', 'notifications@kalenderly.example', 'Erinnerung: Wochenplanung morgen um 9:00',
      'Dein Termin „Wochenplanung" beginnt morgen um 9:00 Uhr.'),
    m('Paketdienst', 'noreply@paketdienst.example', 'Ihre Sendung wurde zugestellt',
      'Ihre Sendung wurde heute um 11:42 Uhr zugestellt. Empfänger: Nachbar (Müller).'),
    m('Software-Updates', 'no-reply@buchhaltungs-app.example', 'Version 8.2 ist da: Das ist neu',
      'Mit dem neuen Update bekommst du eine überarbeitete Belegerfassung und schnellere Auswertungen.'),
    m('Holger Brandt', 'h.brandt@reuter-logistik.example', 'WG: Protokoll Lenkungskreis KW 46',
      'Hallo zusammen,\n\nanbei das Protokoll der letzten Sitzung zur Kenntnisnahme.\n\nGruß Holger', CC),
    m('Nina Vogt', 'nina.vogt@leadflut.example', 'Kurze Frage zu Ihrer Neukundengewinnung',
      'Hallo,\n\nwir helfen Dienstleistern, planbar 10 bis 20 qualifizierte Anfragen pro Monat zu bekommen. Unverbindlich: Hätten Sie nächste Woche 10 Minuten für ein Kennenlernen?\n\nNina Vogt'),
  ],

  'gmail-privat': [
    m('Herbert Albrecht', 'h.albrecht@hausverwaltung-albrecht.example', 'Nebenkostenabrechnung — Nachzahlung bis zum 30.',
      'Sehr geehrter Herr Maier,\n\nanbei die Nebenkostenabrechnung für das vergangene Jahr. Es ergibt sich eine Nachzahlung von 214,60 Euro. Bitte überweisen Sie den Betrag bis zum 30. des Monats.\n\nMit freundlichen Grüßen\nH. Albrecht'),
    m('Lukas Maier', 'lukas.maier@privat.example', 'Samstag Umzug — kannst du helfen?',
      'Hey,\n\nwir ziehen am Samstag um und mir ist ein Helfer abgesprungen. Hättest du ab 9 Uhr Zeit? Wäre mega. Sag bitte bis morgen Bescheid, dann plane ich den Transporter.\n\nLukas'),
    m('Stilhaus', 'angebote@stilhaus.example', 'Nur heute: bis zu 50 % auf Wintermäntel',
      'Der große Winter-Sale ist da. Entdecke jetzt reduzierte Mäntel, Stiefel und Accessoires.', NL),
    m('Stilhaus', 'angebote@stilhaus.example', 'Dein Warenkorb wartet noch auf dich',
      'Du hast noch 2 Artikel im Warenkorb. Jetzt bestellen und kostenlosen Versand sichern.', NL),
    m('FitWerk Studio', 'newsletter@fitwerk.example', 'Neue Kurse im Dezember',
      'Ab Dezember neu im Kursplan: Mobility am Morgen und Kraftzirkel am Abend. Jetzt in der App anmelden.', NL),
    m('Reisefuchs', 'deals@reisefuchs.example', 'Frühbucher: Sommer am Meer ab 399 Euro',
      'Jetzt schon an den Sommer denken: Frühbucher-Angebote für Griechenland, Spanien und Portugal.', NL),
    m('Hausbank', 'noreply@hausbank.example', 'Neuer Kontoauszug im Postfach',
      'In Ihrem Online-Banking-Postfach liegt ein neuer Kontoauszug für Sie bereit.'),
    m('Konto-Service', 'no-reply@konto-service.example', 'Neue Anmeldung auf einem Mac',
      'Wir haben eine neue Anmeldung in deinem Konto auf einem Mac festgestellt. Wenn du das warst, musst du nichts weiter tun.'),
    m('Streamflix', 'info@streamflix.example', 'Neu für dich: 3 Serien, die dir gefallen könnten',
      'Basierend auf deinen letzten Abenden haben wir drei neue Serien für dich herausgesucht.', NL),
    m('Turnverein 1908', 'vorstand@tv1908.example', 'Rundschreiben: Jahresrückblick und Termine',
      'Liebe Mitglieder,\n\nim Anhang findet ihr den Jahresrückblick sowie die Termine für das kommende Jahr.\n\nEuer Vorstand'),
  ],
};

async function fetchRecent(inbox) {
  const rows = SAMPLE[inbox.id] || [];
  const offset = { 'gmail-firma': 9, outlook: 31, 'gmail-privat': 53 }[inbox.id] || 0;
  return rows.map((r, i) => ({
    uid: String(i + 1),
    from: r.from,
    subject: r.subject,
    text: r.text,
    date: new Date(Date.now() - (offset + i * 97) * 60 * 1000).toISOString(),
    unsub: !!r.unsub,
    cc: !!r.cc,
  }));
}

module.exports = { fetchRecent, isMock: true };
