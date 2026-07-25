import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  Shield, 
  UserPlus, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  Loader2,
  Calendar,
  Activity,
  MessageCircle,
  MessageSquare,
  Globe,
  Save,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

type Tab = 'users' | 'logs' | 'settings';

export default function AdminPanel() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const data = await api.get('/api/admin/users', token!);
          setUsers(data);
        } else if (activeTab === 'logs') {
          const data = await api.get('/api/admin/logs', token!);
          setLogs(data);
        } else if (activeTab === 'settings') {
          const data = await api.get('/api/admin/integrations', token!);
          setIntegrations(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, token]);

  const handleUpdateIntegration = async (id: number, config: any, is_enabled: boolean) => {
    setSaving(id);
    try {
      await api.put(`/api/admin/integrations/${id}`, { config, is_enabled }, token!);
      // Refresh data
      const data = await api.get('/api/admin/integrations', token!);
      setIntegrations(data);
    } catch (err) {
      console.error(err);
      alert('Failed to update integration');
    } finally {
      setSaving(null);
    }
  };

  const getIntegrationIcon = (name: string) => {
    switch (name) {
      case 'WhatsApp': return <MessageCircle className="w-5 h-5 text-emerald-500" />;
      case 'Teams': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'Google Calendar': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'External Data': return <Globe className="w-5 h-5 text-amber-500" />;
      default: return <Zap className="w-5 h-5 text-zinc-500" />;
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Admin Control</h1>
          <p className="text-zinc-500 text-sm mt-1">System management and audit oversight</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'logs' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Audit Logs
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          {activeTab === 'users' && (
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all">
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading data...</span>
            </div>
          ) : activeTab === 'users' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900">{user.full_name}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">
                        <Shield className="w-3 h-3" />
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {user.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'logs' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-900">{log.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                      {log.site_name && (
                        <div className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider font-bold">
                          Site: {log.site_name}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">App Integrations</h2>
                  <p className="text-sm text-zinc-500">Manage external connections and third-party services</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
                          {getIntegrationIcon(integration.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900">{integration.name}</h3>
                          <p className="text-xs text-zinc-500">{integration.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdateIntegration(integration.id, integration.config, !integration.is_enabled)}
                        className={`p-1 rounded-full transition-all ${integration.is_enabled ? 'text-emerald-500' : 'text-zinc-300'}`}
                      >
                        {integration.is_enabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(integration.config).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <input 
                            type={key.includes('key') || key.includes('secret') ? 'password' : 'text'}
                            value={value}
                            onChange={(e) => {
                              const newConfig = { ...integration.config, [key]: e.target.value };
                              const newIntegrations = integrations.map(i => i.id === integration.id ? { ...i, config: newConfig } : i);
                              setIntegrations(newIntegrations);
                            }}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                            placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-zinc-200">
                      <div className="text-[10px] text-zinc-400 font-medium">
                        Last updated: {new Date(integration.updated_at).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => handleUpdateIntegration(integration.id, integration.config, integration.is_enabled)}
                        disabled={saving === integration.id}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                      >
                        {saving === integration.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saving === integration.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Custom API Integration</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Need to connect to a custom internal system? Use our "External Data" integration to sync site progress, 
                    material logs, or safety reports with your existing ERP or project management tools.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
