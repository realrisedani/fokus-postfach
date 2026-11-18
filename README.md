# Fokus-Postfach

Alle Postfächer in einem Dashboard. Tagsüber siehst du nur die Mails, die dich
wirklich brauchen. Der Rest wartet gebündelt bis zum Abend.

- **Jetzt** — die wichtigen Mails aus allen Postfächern, mit Ein-Satz-Zusammenfassung
  und dem, was zu tun ist (antworten, zahlen, Termin klären).
- **Abends** — alles andere, nach Art gruppiert (Newsletter, Benachrichtigungen,
  CC, Werbung). Überfliegen, ganze Gruppe abhaken.
- **Regeln** — feste Absender, die immer unter „Jetzt" oder immer unter „Abends" landen.

Das Dashboard **liest nur**. In deinen Postfächern wird nichts gelöscht,
verschoben, als gelesen markiert oder gesendet.

## So wird gefiltert

1. **Absender-Regeln** — steht ein Absender auf einer deiner Listen, ist die Sache entschieden.
2. **Claude** — alle anderen Mails stuft die KI anhand deines Profils ein und begründet das in einem Satz.
   Newsletter (Mails mit Abmelde-Link) gehen ohne KI-Aufruf direkt nach „Abends".
3. **Deine Korrektur** — ein Klick auf „Kann warten" oder „Doch wichtig" verschiebt die Mail
   und legt für den Absender eine Regel an. So wird der Filter mit jedem Tag genauer.

## Schnellstart (Demo)

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.

```bash
npm install
npm start
```

Dann http://localhost:4330 öffnen. Die Demo läuft mit 30 erfundenen Mails und
braucht weder Zugangsdaten noch API-Key.

## Live schalten

### 1. Grundeinstellung

```bash
cp .env.example .env
```

In der `.env` den `ANTHROPIC_API_KEY` eintragen (Key erstellen unter
https://console.anthropic.com). Ohne Key läuft die Einstufung nur über einfache
Stichwort-Regeln und ist deutlich ungenauer.

In `config/postfaecher.js`:

- `profil` — in ein paar Sätzen beschreiben, wer du bist und was für dich wichtig ist.
  Das ist der größte Hebel für die Trefferquote.
- `wichtigeAbsender` — Kunden, Steuerberater, Familie (Adresse oder `@domain.de`).

### 2. Gmail

1. In deinem Google-Konto die 2-Faktor-Anmeldung aktivieren (falls noch nicht geschehen).
2. Unter https://myaccount.google.com/apppasswords ein App-Passwort erstellen.
3. In der `.env` `GMAIL_1_USER` (deine Adresse) und `GMAIL_1_PASS` (das App-Passwort) eintragen.
4. In `config/postfaecher.js` beim Gmail-Postfach `provider: 'imap'` setzen.

Ein zweites Gmail-Konto funktioniert genauso über `GMAIL_2_USER` / `GMAIL_2_PASS`.

### 3. Outlook / Microsoft 365

Microsoft erlaubt für Outlook keine Anmeldung per Passwort mehr. Deshalb braucht
es einmalig eine kostenlose App-Registrierung (ca. 5 Minuten):

1. https://entra.microsoft.com → **App-Registrierungen** → **Neue Registrierung**.
   Name beliebig, Kontotypen: „Konten in allen Organisationsverzeichnissen und
   persönliche Microsoft-Konten".
2. In der App unter **Authentifizierung** „Öffentliche Clientflows zulassen" auf **Ja** stellen.
3. Unter **API-Berechtigungen** → Microsoft Graph → Delegiert → `Mail.Read` hinzufügen.
4. Die **Anwendungs-ID (Client)** von der Übersichtsseite in die `.env` als `OUTLOOK_CLIENT_ID` eintragen.
5. Einmal anmelden:

   ```bash
   npm run outlook-login outlook
   ```

   Es erscheint ein Code, den du auf der angezeigten Microsoft-Seite eingibst.
6. In `config/postfaecher.js` beim Outlook-Postfach `provider: 'outlook'` setzen.

Bei einem Firmen-Konto (Microsoft 365) kann es sein, dass der Administrator die
App erst freigeben muss.

### 4. Starten

```bash
npm start
```

Die Postfächer werden alle 5 Minuten geprüft (einstellbar über `POLL_INTERVAL_MIN`).
Kann ein Postfach nicht gelesen werden, steht der Grund oben im Dashboard.

## Datenschutz

- Das Dashboard läuft auf deinem Rechner und ist nur dort erreichbar (`localhost`).
- Mails und Regeln liegen lokal in `data/` und werden nicht ins Repo eingecheckt.
- Zur Einstufung gehen Absender, Betreff und die ersten rund 2.500 Zeichen einer
  Mail an die Claude-API von Anthropic. Mails von Absendern auf der „Abends"-Liste
  und Newsletter werden nicht an die KI geschickt.
- Zugangsdaten gehören ausschließlich in die `.env` — nie ins Repo.

## Aufbau

```
config/postfaecher.js   Profil, Absender-Listen, Postfächer — die eine Stelle zum Einrichten
src/providers/          mock (Demo) · imap (Gmail) · outlook (Microsoft Graph)
src/rules.js            Stufe 1: Absender-Regeln
src/ai/classify.js      Stufe 2: Einstufung durch Claude (+ Fallback ohne Key)
src/ai/draft.js         Antwort-Entwurf auf Knopfdruck (wird nie gesendet)
src/pipeline.js         abrufen → einstufen → speichern
src/server.js           API + Dashboard
public/                 Dashboard (HTML/CSS/JS, kein Build-Schritt)
```

## Stand

Prototyp. Im Demo-Modus vollständig durchgetestet. Die Anbindung echter Gmail-
und Outlook-Konten sowie die Einstufung über die Claude-API sind gebaut, aber
noch nicht gegen echte Konten getestet — beim ersten Live-Schalten bitte mit
einem Postfach anfangen.

Enthaltene Beispieldaten sind frei erfunden.
