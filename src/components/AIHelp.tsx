import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  BrainCircuit, 
  Send, 
  Mic, 
  Plus,
  Volume2, 
  Copy, 
  Search,
  History,
  AlertCircle,
  Loader2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { getAIInstance } from '../utils/ai';

export default function AIHelp() {
  const { token, user } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [category, setCategory] = useState('Technical');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categories = ['Safety', 'Technical', 'Material', 'Vendor', 'Weather', 'Electrical', 'Structural'];

  useEffect(() => {
    api.get('/api/sites', token!).then(setSites);
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedSite) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const site = sites.find(s => s.id === parseInt(selectedSite));
      
      const { ai, model } = await getAIInstance(token!);
      const response = await ai.models.generateContent({
        model: model,
        contents: `
          Role: ${user?.role}
          Site: ${site?.name}
          Stage: ${site?.stage_name}
          Category: ${category}
          Problem: ${input}
          
          Provide a professional industrial solution for this solar site installation problem.
        `,
      });

      const aiContent = response.text || 'I am unable to provide a solution at this moment.';
      const aiMsg = { role: 'ai', content: aiContent, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);

      await api.post('/api/ai/log', {
        site_id: parseInt(selectedSite),
        stage_id: site?.current_stage_id,
        category,
        description: input
      }, token!);

    } catch (err: any) {
      console.error(err);
      let errMsg = 'Error connecting to AI Brain. Please try again.';
      if (err?.message?.includes('Missing Gemini API Key')) {
        errMsg = 'Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in your Netlify settings, or configure it in the app Admin Settings.';
      }
      setMessages(prev => [...prev, { role: 'ai', content: errMsg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSelectedSite('');
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden relative">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-zinc-100 bg-zinc-50/50 flex flex-col shrink-0 overflow-hidden"
          >
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Context Configuration</label>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-2xl border border-zinc-200">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Target Site</label>
                      <select 
                        value={selectedSite}
                        onChange={(e) => setSelectedSite(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-zinc-900 focus:outline-none"
                      >
                        <option value="">Select Site...</option>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-zinc-200">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Issue Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-zinc-900 focus:outline-none"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-3 h-3" /> Recent Knowledge
                  </h3>
                  <div className="space-y-3">
                    {similarCases.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic px-1">No recent cases available.</p>
                    ) : (
                      similarCases.map((c, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-zinc-100 hover:border-zinc-300 transition-all cursor-pointer group">
                          <p className="text-xs font-bold text-zinc-900 truncate">{c.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{c.solution}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100">
              <div className="bg-zinc-900 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Guidelines</span>
                </div>
                <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc pl-3">
                  <li>Be specific about site conditions</li>
                  <li>Mention installation stage</li>
                  <li>Solutions require PM approval</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header */}
        <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-zinc-900">AI Brain</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
              Gemini 3.6 Active
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0">
          <div className="max-w-3xl mx-auto py-8 space-y-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-100">
                  <BrainCircuit className="w-10 h-10 text-zinc-900" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">How can I help you today?</h1>
                <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
                  Select a site from the sidebar and describe any technical, safety, or material issues you're facing.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12 w-full max-w-xl">
                  {['Check safety protocols', 'Material shortage help', 'Technical installation guide', 'Weather impact analysis'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-left hover:bg-zinc-100 transition-all group"
                    >
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700">{suggestion}</p>
                      <p className="text-xs text-zinc-500 mt-1">Click to use this prompt</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-emerald-600' : 'bg-zinc-900'
                }`}>
                  {msg.role === 'user' ? (
                    <MessageSquare className="w-4 h-4 text-white" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-full p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-emerald-50 text-emerald-900' 
                      : 'bg-zinc-50 text-zinc-900'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3 justify-start text-zinc-400">
                    <span className="text-[10px] font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'ai' && (
                      <div className="flex gap-2">
                        <button className="hover:text-zinc-600"><Volume2 className="w-3 h-3" /></button>
                        <button className="hover:text-zinc-600"><Copy className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-50 p-4 rounded-2xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-500 font-medium tracking-tight">AI Brain is processing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {!selectedSite && messages.length === 0 && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center">
                <div className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Please select a site from the sidebar first
                </div>
              </div>
            )}
            
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedSite ? "Ask AI Brain anything..." : "Select a site to start chatting..."}
                disabled={!selectedSite && messages.length === 0}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-16 text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:bg-white focus:border-zinc-900 transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || !selectedSite || loading}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-20 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-zinc-900/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium">
              AI Brain can make mistakes. Verify important information with site supervisors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
