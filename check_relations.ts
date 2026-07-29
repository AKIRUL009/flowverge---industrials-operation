import { db } from './src/database.ts';
const check = (sql) => db.prepare(sql).all();
console.log("approvals:", check("SELECT * FROM approvals WHERE approved_by = 6"));
console.log("sites vendor:", check("SELECT * FROM sites WHERE vendor_id = 6"));
console.log("media:", check("SELECT * FROM media WHERE uploaded_by = 6"));
// add more if necessary
