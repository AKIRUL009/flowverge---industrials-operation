import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  BrainCircuit, 
  Send, 
  Mic, 
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
      
      // Initialize Gemini
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

      // Log problem to DB
      await api.post('/api/ai/log', {
        site_id: parseInt(selectedSite),
        stage_id: site?.current_stage_id,
        category,
        description: input
      }, token!);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Error connecting to AI Brain. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-1">Select Site</label>
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Choose site...</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                <BrainCircuit className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">AI Brain Assistant</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Select a site and describe your problem. Our AI will provide industrial-grade solutions based on site context.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] p-4 rounded-2xl shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-tl-none'}
              `}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`mt-2 flex items-center gap-3 ${msg.role === 'user' ? 'text-emerald-100' : 'text-zinc-400'}`}>
                  <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
            <div className="flex justify-start">
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-zinc-500">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
          <div className="relative flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-all">
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe the issue..."
              className="flex-1 bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || !selectedSite || loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-lg shadow-emerald-900/10"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" /> Similar Past Cases
          </h3>
          <div className="space-y-4">
            {similarCases.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No similar cases found in knowledge base.</p>
            ) : (
              similarCases.map((c, i) => (
                <div key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:bg-zinc-100 transition-all cursor-pointer group">
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{c.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{c.solution}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-200" />
            </div>
            <h3 className="text-lg font-bold">AI Guidelines</h3>
          </div>
          <ul className="text-xs text-blue-100 space-y-2 list-disc pl-4">
            <li>Be specific about the site conditions</li>
            <li>Mention the current stage of installation</li>
            <li>AI solutions must be approved by PM</li>
            <li>Check knowledge base before reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
