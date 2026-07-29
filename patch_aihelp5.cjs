const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

// Also import X if missing
if (!code.includes("X,")) {
  code = code.replace("History, Menu,", "History, Menu, X,");
}

const oldSidebar = `      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ marginLeft: -320, opacity: 0 }}
            animate={{ marginLeft: 0, opacity: 1 }}
            exit={{ marginLeft: -320, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 md:relative z-50 h-full w-[280px] sm:w-[320px] border-r border-zinc-100 bg-white md:bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none"
          >
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">`;

const newSidebar = `      {/* Sidebar */}
      <div 
        className={\`
          absolute md:relative z-50 h-full bg-white md:bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none transition-all duration-300 ease-in-out border-r border-zinc-100
          \${isSidebarOpen ? 'translate-x-0 w-[280px] sm:w-[320px] opacity-100' : '-translate-x-full w-[280px] sm:w-[320px] md:w-0 md:translate-x-0 md:opacity-0 md:border-none'}
        \`}
      >
        <div className="p-6 space-y-6 flex-1 overflow-y-auto w-[280px] sm:w-[320px]">
          <div className="flex justify-between items-center md:hidden mb-2">
            <span className="font-bold text-zinc-900">Context Menu</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>`;

code = code.replace(oldSidebar, newSidebar);

// Find the end of the sidebar to remove the closing </motion.div> and </AnimatePresence>
code = code.replace(`            </div>
          </motion.div>
        )}
      </AnimatePresence>`, `            </div>
      </div>`);

fs.writeFileSync('src/components/AIHelp.tsx', code);
