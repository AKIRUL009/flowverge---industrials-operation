const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

console.log("NULLABILITY CHECK:");
const nullEmails = db.prepare("SELECT count(*) as c FROM users WHERE email IS NULL").get().c;
console.log(`users.email IS NULL count: ${nullEmails}`);

console.log("UNIQUE CONSTRAINT CHECK:");
const duplicateEmails = db.prepare("SELECT email, count(*) as c FROM users GROUP BY email HAVING c > 1").all();
console.log(`users.email duplicates:`, duplicateEmails);

// Any other unique constraints?
// integrations.name
const nullIntegrations = db.prepare("SELECT count(*) as c FROM integrations WHERE name IS NULL").get().c;
console.log(`integrations.name IS NULL count: ${nullIntegrations}`);

const duplicateIntegrations = db.prepare("SELECT name, count(*) as c FROM integrations GROUP BY name HAVING c > 1").all();
console.log(`integrations.name duplicates:`, duplicateIntegrations);
