const Database = require('better-sqlite3');
const snapshot = require('../pg_recovery_snapshot.json');

const sqlite = new Database('flowverge.recovered.db', { readonly: true });
const tables = Object.keys(snapshot);
console.log("TABLE | POSTGRES COUNT | RECOVERED SQLITE COUNT | MATCH");
for (const table of tables) {
  const pgCount = snapshot[table].length;
  const sqCount = sqlite.prepare(`SELECT count(*) as c FROM ${table}`).get().c;
  const match = pgCount === sqCount ? 'YES' : 'NO';
  console.log(`${table} | ${pgCount} | ${sqCount} | ${match}`);
}
