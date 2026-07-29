const Database = require('better-sqlite3');
const db = new Database('test.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)');

const seed = db.transaction(() => {
  const count = db.prepare('SELECT count(*) as c FROM test').get().c;
  if (count === 0) {
    db.prepare('INSERT INTO test (id) VALUES (1)').run();
    // Simulate some work
    let x = 0; for(let i = 0; i < 1000000; i++) x += i;
  }
});
seed.exclusive();

console.log(db.prepare('SELECT count(*) as c FROM test').get().c);
