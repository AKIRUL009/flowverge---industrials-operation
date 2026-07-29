const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

// Replace the entire sidebar block correctly

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

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>`;

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
          </div>
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>`;

code = code.replace(oldSidebar, newSidebar);

// Make sure to remove the </motion.div> closing and </AnimatePresence> just before Main Chat Area
const oldEnd = `            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}`;

const newEnd = `            </div>
      </div>

      {/* Main Chat Area */}`;

code = code.replace(oldEnd, newEnd);

// Import X if needed
if (!code.includes("X,")) {
  code = code.replace("Menu,", "Menu, X,");
}

fs.writeFileSync('src/components/AIHelp.tsx', code);
