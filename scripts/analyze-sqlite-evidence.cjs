const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

console.log("EVIDENCE / BASE64 CHECK:");

function checkBase64(table, column) {
  try {
    const rows = db.prepare(`SELECT id, length(${column}) as len, substr(${column}, 1, 30) as snippet FROM ${table} WHERE ${column} IS NOT NULL`).all();
    console.log(`\nTable ${table}.${column}: ${rows.length} rows with data`);
    let base64Count = 0;
    let maxLen = 0;
    let totalLen = 0;
    for (const r of rows) {
      if (r.snippet && (r.snippet.startsWith('data:image') || r.snippet.length > 255)) {
        base64Count++;
      }
      if (r.len > maxLen) maxLen = r.len;
      totalLen += r.len;
    }
    console.log(`- Base64/Data URLs detected: ${base64Count}`);
    console.log(`- Max payload length: ${maxLen} bytes`);
    console.log(`- Total payload length: ${totalLen} bytes`);
  } catch(e) {
    console.log(`\nTable ${table}.${column}: Error reading - ${e.message}`);
  }
}

checkBase64('checklist_answers', 'photo_metadata');
checkBase64('photos', 'file_path');
checkBase64('warehouse_transactions', 'photo_proof');
checkBase64('safety_logs', 'photo_proof');

