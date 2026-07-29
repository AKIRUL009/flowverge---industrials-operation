const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

console.log("TIMESTAMP CHECK:");

const tablesToDates = [
  { table: 'users', col: 'created_at' },
  { table: 'sites', col: 'stage_started_at' },
  { table: 'sites', col: 'created_at' }
];

for (const {table, col} of tablesToDates) {
  try {
    const dates = db.prepare(`SELECT ${col} as d FROM ${table} WHERE ${col} IS NOT NULL LIMIT 5`).all();
    console.log(`${table}.${col}:`, dates.map(d => d.d));
  } catch (e) {
    console.log(`${table}.${col}: error - ${e.message}`);
  }
}
