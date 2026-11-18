// Einmalige Anmeldung eines Outlook-Postfachs:  npm run outlook-login <postfach-id>
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const config = require('../config/postfaecher');
const { deviceLogin } = require('../src/providers/outlookAuth');

const id = process.argv[2] || 'outlook';
const inbox = config.postfaecher.find((p) => p.id === id);

if (!inbox || !inbox.outlook) {
  console.error(`Kein Outlook-Postfach mit der id "${id}" in config/postfaecher.js gefunden.`);
  process.exit(1);
}

deviceLogin(inbox)
  .then(() => console.log(`  Angemeldet. Jetzt in config/postfaecher.js bei "${id}" provider: 'outlook' setzen und neu starten.\n`))
  .catch((e) => {
    console.error(`  Fehler: ${e.message}\n`);
    process.exit(1);
  });
