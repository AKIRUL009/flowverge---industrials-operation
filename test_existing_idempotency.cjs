const { db, initializeDatabase } = require('./src/database.ts');
console.log("Before: ", db.prepare('SELECT count(*) as c FROM users').get().c);
initializeDatabase();
console.log("After: ", db.prepare('SELECT count(*) as c FROM users').get().c);
