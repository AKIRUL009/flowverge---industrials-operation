import Database from 'better-sqlite3';
const db = new Database('flowverge.recovered.db');
const email = 'akirulislam787@gmail.com';
const user = db.prepare('SELECT u.id, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?').get(email);
console.log(user);
