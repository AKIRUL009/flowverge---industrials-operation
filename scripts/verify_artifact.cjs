const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('pg_recovery_snapshot.json', 'utf8'));
  const tables = Object.keys(data);
  console.log("Tables in artifact:", tables.length);
  
  let allGood = true;
  if (data['logs'].length !== 3) {
    console.log("Logs count mismatch:", data['logs'].length);
    allGood = false;
  }
  
  const testUser = data['users'].find(u => u.email === 'akirulislam787@gmail.com');
  if (!testUser) {
    console.log("Test user missing");
    allGood = false;
  } else {
    console.log("Test user found:", testUser.email);
  }
  
  if (allGood) console.log("Artifact OK");
} catch(e) {
  console.log("Artifact error:", e);
}
