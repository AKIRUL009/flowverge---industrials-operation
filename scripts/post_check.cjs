const Database = require('better-sqlite3');
const sqlite = new Database('flowverge.db', { readonly: true });
console.log("Users:", sqlite.prepare('SELECT count(*) as c FROM users').get().c);
console.log("Logs:", sqlite.prepare('SELECT count(*) as c FROM logs').get().c);
console.log("Roles:", sqlite.prepare('SELECT count(*) as c FROM roles').get().c);
const testUser = sqlite.prepare("SELECT email FROM users WHERE email='akirulislam787@gmail.com'").get();
console.log("Test User present:", !!testUser);
