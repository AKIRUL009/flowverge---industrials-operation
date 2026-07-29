const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

// Add responsive hook
const resizeHook = `
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
`;

code = code.replace("  useEffect(() => {\n    api.get('/api/sites', token!).then(setSites);\n  }, [token]);", resizeHook + "\n  useEffect(() => {\n    api.get('/api/sites', token!).then(setSites);\n  }, [token]);");

// Add backdrop and responsive sidebar styling
const sidebarStart = `
      {/* Sidebar Backdrop (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -320 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -320 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="absolute md:relative z-50 h-full border-r border-zinc-100 bg-white md:bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none"
          >
`;

code = code.replace(`      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-zinc-100 bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden"
          >`, sidebarStart);

// Also need to make sure we don't have issues with the button that toggles the sidebar
// Wait, is there a button? Yes, in Main Chat Area header:
/*
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500"
            >
              <History className="w-5 h-5" />
            </button>
*/

fs.writeFileSync('src/components/AIHelp.tsx', code);
console.log('Patched AIHelp.tsx');
