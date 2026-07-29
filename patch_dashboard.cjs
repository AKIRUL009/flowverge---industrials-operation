const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (code.includes("{ name: 'Site Media'")) {
  console.log('Already in Dashboard.tsx');
} else {
  code = code.replace("import {\n  LayoutDashboard,", "import {\n  Image as ImageIcon,\n  LayoutDashboard,");
  
  const navItem = "    { name: 'Site Media', icon: ImageIcon, path: '/media', roles: ['Admin', 'Project Manager'] },\n    { name: 'Reports',";
  code = code.replace("    { name: 'Reports',", navItem);
  fs.writeFileSync('src/components/Dashboard.tsx', code);
  console.log('Patched Dashboard.tsx with Site Media nav item');
}
