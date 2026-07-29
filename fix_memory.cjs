const fs = require('fs');
let content = fs.readFileSync('Memory.md', 'utf8');

content = content.replace(
  /Concurrent SQLite Initialization Hazard:\nFIXED according to actual implementation/g,
  `SQLite Initialization Concurrency:\nHARDENED / TESTED\n\nSQLite WAL:\nENABLED\n\nSQLite Busy Timeout:\nENABLED\n\nCorruption Handling:\nFAIL CLOSED\n\nPostgreSQL Recovery Artifact:\nPRESERVED`
);

fs.writeFileSync('Memory.md', content);
