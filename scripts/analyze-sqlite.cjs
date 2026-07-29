const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
console.log("TABLES:", tables);

const report = {};
for (const table of tables) {
  const rowCount = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  
  let pkInfo = 'No PK';
  const pkCol = columns.find(c => c.pk > 0);
  if (pkCol) {
    const minMax = db.prepare(`SELECT MIN(${pkCol.name}) as minPk, MAX(${pkCol.name}) as maxPk FROM ${table}`).get();
    pkInfo = `${pkCol.name} (Min: ${minMax.minPk}, Max: ${minMax.maxPk})`;
  }
  
  report[table] = {
    rowCount,
    pkInfo,
    columns: columns.map(c => c.name)
  };
}

console.log(JSON.stringify(report, null, 2));
