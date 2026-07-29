import { db, initializeDatabase } from './src/database.ts';
initializeDatabase();
console.log("Initial Users:", db.prepare('SELECT count(*) as c FROM users').get().c);
initializeDatabase();
console.log("Subsequent Users:", db.prepare('SELECT count(*) as c FROM users').get().c);
