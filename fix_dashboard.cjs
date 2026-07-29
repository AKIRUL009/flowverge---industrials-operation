const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace("import { Image as ImageIcon, useAuth }", "import { useAuth }");
code = code.replace("import { Image as ImageIcon, api }", "import { api }");
code = code.replace("import { Image as ImageIcon, motion", "import { motion");
code = code.replace("import { Image as ImageIcon, Link", "import { Link");
// leave the one for lucide-react (the one with LayoutDashboard)

fs.writeFileSync('src/components/Dashboard.tsx', code);
