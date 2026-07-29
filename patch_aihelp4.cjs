const fs = require('fs');
let code = fs.readFileSync('src/components/AIHelp.tsx', 'utf8');

const newMotion = `            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 md:relative z-50 h-full w-[280px] sm:w-[320px] border-r border-zinc-100 bg-white md:bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none"`;

const bestMotion = `            initial={{ marginLeft: -320, opacity: 0 }}
            animate={{ marginLeft: 0, opacity: 1 }}
            exit={{ marginLeft: -320, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 md:relative z-50 h-full w-[280px] sm:w-[320px] border-r border-zinc-100 bg-white md:bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden shadow-2xl md:shadow-none"`;

code = code.replace(newMotion, bestMotion);

fs.writeFileSync('src/components/AIHelp.tsx', code);
