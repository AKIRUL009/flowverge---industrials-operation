const Database = require('better-sqlite3');
const db = new Database('test_concurrent.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');

const seed = db.transaction(() => {
  const count = db.prepare('SELECT count(*) as c FROM test').get().c;
  if (count === 0) {
    db.prepare('INSERT INTO test (name) VALUES (\'A\')').run();
    // sleep to widen race window
    const start = Date.now(); while(Date.now() - start < 1000);
  }
});
// execute exclusive
seed.exclusive();
console.log("done");
