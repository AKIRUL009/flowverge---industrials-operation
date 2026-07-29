const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStatement = "import SiteMediaGallery from './components/SiteMediaGallery';";
const routeStatement = "<Route path=\"/media\" element={<SiteMediaGallery />} />";

if (code.includes(importStatement)) {
  console.log('App.tsx already has SiteMediaGallery imported');
} else {
  code = code.replace("import Dashboard from './components/Dashboard';", "import Dashboard from './components/Dashboard';\n" + importStatement);
  code = code.replace("<Route path=\"*\" element={<Navigate to=\"/\" />} />", routeStatement + "\n        <Route path=\"*\" element={<Navigate to=\"/\" />} />");
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx with /media route');
}
