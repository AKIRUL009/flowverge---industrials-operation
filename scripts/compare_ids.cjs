const Database = require('better-sqlite3');
const snapshot = require('../pg_recovery_snapshot.json');
const sqlite = new Database('flowverge.recovered.db', { readonly: true });
const tables = Object.keys(snapshot);
console.log("TABLE | PG MIN | SQ MIN | PG MAX | SQ MAX | MATCH");
for (const table of tables) {
  if (snapshot[table].length === 0 || !snapshot[table][0].id) continue;
  const ids = snapshot[table].map(r => r.id);
  const pgMin = Math.min(...ids);
  const pgMax = Math.max(...ids);
  
  const sqRes = sqlite.prepare(`SELECT min(id) as mn, max(id) as mx FROM ${table}`).get();
  const sqMin = sqRes.mn;
  const sqMax = sqRes.mx;
  
  const match = pgMin === sqMin && pgMax === sqMax ? 'YES' : 'NO';
  console.log(`${table} | ${pgMin} | ${sqMin} | ${pgMax} | ${sqMax} | ${match}`);
}
