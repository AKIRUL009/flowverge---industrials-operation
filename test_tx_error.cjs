const Database = require('better-sqlite3');
const db = new Database('test_tx_error.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.exec('CREATE TABLE test (id INTEGER)');

const init = db.transaction(() => {
  db.prepare('INSERT INTO test (id) VALUES (1)').run();
  try {
    db.exec('ALTER TABLE test ADD COLUMN id INTEGER');
  } catch(e) {
    console.log("caught error inside tx");
  }
  db.prepare('INSERT INTO test (id) VALUES (2)').run();
});
init.exclusive();

console.log(db.prepare('SELECT count(*) as c FROM test').get().c);
