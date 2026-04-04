import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Clock, 
  Shield, 
  Bell, 
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function SettingsView() {
  const { token } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [aiSettings, setAiSettings] = useState({
    apiKey: '',
    model: 'gemini-2.0-flash',
    provider: 'google'
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [sitesData, settingsData] = await Promise.all([
          api.get('/api/sites', token!),
          api.get('/api/admin/settings', token!)
        ]);

        const stagesData = [
          { id: 1, name: 'Survey', max_allowed_days: 3 },
          { id: 2, name: 'Foundation', max_allowed_days: 7 },
          { id: 3, name: 'Installation', max_allowed_days: 10 },
          { id: 4, name: 'Inspection', max_allowed_days: 3 },
          { id: 5, name: 'Billing', max_allowed_days: 2 },
        ];
        setStages(stagesData);

        const aiKey = settingsData.find((s: any) => s.key === 'AI_API_KEY')?.value || '';
        const aiModel = settingsData.find((s: any) => s.key === 'AI_MODEL')?.value || 'gemini-2.0-flash';
        const aiProvider = settingsData.find((s: any) => s.key === 'AI_PROVIDER')?.value || 'google';
        
        setAiSettings({ apiKey: aiKey, model: aiModel, provider: aiProvider });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'AI_API_KEY', value: aiSettings.apiKey, description: 'API Key for AI Engine', type: 'string' },
        { key: 'AI_MODEL', value: aiSettings.model, description: 'Model for AI Engine', type: 'string' },
        { key: 'AI_PROVIDER', value: aiSettings.provider, description: 'Provider for AI Engine', type: 'string' }
      ];

      await api.post('/api/admin/settings', { settings: settingsToSave }, token!);
      setMessage({ type: 'success', text: 'System settings updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">System Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure global parameters and business logic</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Stage Configuration */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Stage SLA Configuration</h2>
          </div>
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stage Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Max Allowed Days</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stages.map((stage) => (
                  <tr key={stage.id}>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-900">{stage.name}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        defaultValue={stage.max_allowed_days}
                        className="w-20 px-3 py-1.5 bg-zinc-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-zinc-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select className="bg-zinc-50 border-none rounded-lg text-xs font-bold uppercase tracking-wider px-3 py-1.5 focus:ring-2 focus:ring-zinc-900">
                        <option>Normal</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security Settings */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Security & Access</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Two-Factor Authentication</h3>
                <p className="text-xs text-zinc-500">Require 2FA for all administrative accounts</p>
              </div>
              <div className="w-12 h-6 bg-zinc-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Session Timeout</h3>
                <p className="text-xs text-zinc-500">Automatically log out inactive users after 30 minutes</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Global Notifications</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Delay Escalations</h3>
                <p className="text-xs text-zinc-500">Notify PMs automatically when a site is delayed by 2+ days</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* AI Engine Configuration */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">AI Engine Configuration</h2>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">AI Provider</label>
                <select 
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
                >
                  <option value="google">Google Gemini</option>
                  <option value="openai">OpenAI (Coming Soon)</option>
                  <option value="anthropic">Anthropic (Coming Soon)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Model ID</label>
                <input 
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
                  placeholder="e.ai. gemini-2.0-flash"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom API Key</label>
              <div className="relative">
                <input 
                  type={showApiKey ? "text" : "password"}
                  value={aiSettings.apiKey}
                  onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  className="w-full p-3 pr-12 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
                  placeholder="Enter your custom API key to avoid rate limits"
                />
                <button 
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 italic">
                * If left empty, the system will use the default shared engine.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Important:</strong> Using a custom API key allows for higher quotas and collaboration with advanced models. Ensure your key has the necessary permissions for the selected model.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
