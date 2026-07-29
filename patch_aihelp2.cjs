const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

// Replace the History icon in the header with a Menu icon
code = code.replace(
  /<History className="w-5 h-5" \/>/,
  '<Menu className="w-5 h-5 md:hidden" /><History className="w-5 h-5 hidden md:block" />'
);

// We need to import Menu if not already
if (!code.includes("Menu,")) {
  code = code.replace("History,", "History, Menu,");
}

// Add a button in the empty state
const emptyStateButton = `
                <div className="md:hidden mt-6">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-zinc-900/20 flex items-center gap-2"
                  >
                    <Menu className="w-4 h-4" />
                    Open Context Menu
                  </button>
                </div>
`;

code = code.replace(
  /<p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">([\s\S]*?)<\/p>/,
  '<p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">$1</p>' + emptyStateButton
);

fs.writeFileSync('src/components/AIHelp.tsx', code);
