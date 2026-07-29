const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

code = code.replace(
  "onChange={(e) => setSelectedSite(e.target.value)}",
  "onChange={(e) => { setSelectedSite(e.target.value); if (window.innerWidth < 768) setIsSidebarOpen(false); }}"
);

fs.writeFileSync('src/components/AIHelp.tsx', code);
