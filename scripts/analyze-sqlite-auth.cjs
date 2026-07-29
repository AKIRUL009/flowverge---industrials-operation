const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

console.log("AUTH DATA CHECK:");
const rows = db.prepare(`SELECT id, email, length(password_hash) as hash_len, password_hash FROM users`).all();
console.log(`Total users: ${rows.length}`);
let legacyHashCount = 0;
for (const r of rows) {
  const hash = r.password_hash;
  if (hash && (hash.startsWith('$2') || hash.length > 50)) {
    legacyHashCount++;
  }
}
console.log(`Users with apparent legacy bcrypt hashes: ${legacyHashCount}`);

const fbUser = db.prepare(`SELECT * FROM users WHERE email = 'akirulislam787@gmail.com'`).get();
if (fbUser) {
  console.log(`Firebase controlled test user found (id: ${fbUser.id}, email: ${fbUser.email})`);
} else {
  console.log(`Firebase controlled test user NOT found`);
}

