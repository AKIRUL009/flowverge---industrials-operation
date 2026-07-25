import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  BrainCircuit, 
  Package,
  ArrowRight,
  TrendingUp,
  Settings,
  Sparkles,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { getAIInstance } from '../utils/ai';

const parseAISafe = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
};

export default function Home() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    delayed: 0,
    pending: 0,
    active: 0,
    aiIssues: 0,
    lowStock: 0,
    byStage: [] as { stage_name: string, count: number }[]
  });
  const [recentSites, setRecentSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [dismissedRisks, setDismissedRisks] = useState<Set<number>>(new Set());
  const [riskLoading, setRiskLoading] = useState(false);
  const riskCacheRef = useRef<{ data: any[]; time: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sitesRaw = await api.get('/api/sites', token!);
        const approvalsRaw = await api.get('/api/approvals', token!);
        const stockRaw = await api.get('/api/warehouse/stock', token!);
        const aiCasesRaw = await api.get('/api/ai/cases', token!);
        const stagesRaw = await api.get('/api/stages', token!);

        const sites = Array.isArray(sitesRaw) ? sitesRaw : [];
        const stages = Array.isArray(stagesRaw) ? stagesRaw : [];
        const stock = Array.isArray(stockRaw) ? stockRaw : [];
        const aiCases = Array.isArray(aiCasesRaw) ? aiCasesRaw : [];
        const approvals = Array.isArray(approvalsRaw) ? approvalsRaw : [];
        
        setRecentSites(sites.slice(0, 5));
        analyzeDelayRisks(sites);

        const stageCounts = stages.map((stage: any) => ({
          stage_name: stage.name,
          count: sites.filter((s: any) => s.current_stage_id === stage.id).length
        }));

        setStats({
          delayed: sites.filter((s: any) => s.is_delayed).length,
          pending: approvals.length,
          active: sites.filter((s: any) => s.status !== 'Completed').length,
          aiIssues: aiCases.filter((c: any) => c.status === 'Open').length,
          lowStock: stock.filter((s: any) => s.current_stock < s.min_stock).length,
          byStage: stageCounts
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const analyzeDelayRisks = async (sites: any[]) => {
    // 1. Try to load from localStorage first (cache for 1 hour)
    const cached = localStorage.getItem('ai_risk_cache');
    if (cached) {
      try {
        const { data, time } = JSON.parse(cached);
        if (Date.now() - time < 60 * 60 * 1000) {
          setRiskAlerts(data);
          return;
        }
      } catch (e) {
        console.error('Failed to parse risk cache:', e);
      }
    }

    const activeSites = sites.filter(s => !s.is_delayed && s.status !== 'Completed');
    if (activeSites.length === 0) return;

    // 2. Local fallback heuristic (in case AI fails or to use immediately)
    const localRisks = activeSites
      .map(s => {
        const days = Math.max(0, Math.floor((Date.now() - new Date(s.stage_started_at).getTime()) / 86400000));
        const max = s.max_allowed_days || 7;
        const ratio = days / max;
        if (ratio > 0.6) {
          return {
            site_id: s.id,
            site_name: s.name,
            risk_level: ratio > 0.75 ? 'high' : 'medium',
            reason: `${Math.round(ratio * 100)}% of allowed time used (${days}/${max} days)`,
            suggested_action: ratio > 0.75 ? 'Immediate follow-up required' : 'Monitor progress closely'
          };
        }
        return null;
      })
      .filter(Boolean);

    setRiskLoading(true);
    try {
      const { ai, model } = await getAIInstance(token!);

      const siteData = activeSites.map(s => ({
        id: s.id,
        name: s.name,
        stage: s.stage_name,
        days_in_stage: Math.max(0, Math.floor((Date.now() - new Date(s.stage_started_at).getTime()) / 86400000)),
        max_allowed_days: s.max_allowed_days || 7,
      }));

      const response = await ai.models.generateContent({
        model: model,
        contents: `You are a project risk analyst for solar installation projects.

Analyze these active sites and identify which ones are at risk of delay:
${JSON.stringify(siteData)}

For each site where days_in_stage > 60% of max_allowed_days, flag it as a risk.

Respond ONLY with a JSON array:
[
  {
    "site_id": 1,
    "site_name": "Ibrahimpura",
    "risk_level": "high",
    "reason": "78% of allowed time used",
    "suggested_action": "Follow up with supervisor today"
  }
]

Risk levels: "high" (>75% time used), "medium" (60-75%).
Return empty array [] if no risks.
Return ONLY the JSON array.`
      });

      const risks = parseAISafe(response.text || '[]', []);
      if (Array.isArray(risks)) {
        localStorage.setItem('ai_risk_cache', JSON.stringify({ data: risks, time: Date.now() }));
        setRiskAlerts(risks);
      }
    } catch (err: any) {
      console.error('Risk analysis error:', err);
      // 3. Graceful fallback on 429 or other AI errors
      if (err?.status === 429 || err?.message?.includes('429')) {
        console.warn('AI Rate limit hit, using local heuristic fallback');
        setRiskAlerts(localRisks);
      } else if (err?.status === 404 || err?.message?.includes('404')) {
        console.warn('AI Model not found, using local heuristic fallback');
        setRiskAlerts(localRisks);
      }
    } finally {
      setRiskLoading(false);
    }
  };

  const cards = [
    { name: 'Delayed Sites', value: stats.delayed, icon: Clock, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { name: 'Pending Approvals', value: stats.pending, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: 'Active Sites', value: stats.active, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { name: 'Open AI Issues', value: stats.aiIssues, icon: BrainCircuit, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Low Stock Alerts', value: stats.lowStock, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${card.bg} ${card.border} border p-6 rounded-2xl shadow-sm`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${card.bg} border ${card.border}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 mb-1">{card.value}</p>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.name}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Delay Risk Alerts */}
      {(riskAlerts.filter(r => !dismissedRisks.has(r.site_id)).length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-zinc-900">AI Delay Risk Alerts</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                {riskAlerts.filter(r => !dismissedRisks.has(r.site_id)).length} sites at risk
              </span>
            </div>
          </div>
          <div className="divide-y divide-zinc-50">
            {riskAlerts
              .filter(r => !dismissedRisks.has(r.site_id))
              .map(risk => (
                <div key={risk.site_id} className={`p-4 flex items-start gap-4 ${
                  risk.risk_level === 'high' ? 'bg-red-50/40' : 'bg-amber-50/40'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    risk.risk_level === 'high' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-zinc-900">{risk.site_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        risk.risk_level === 'high'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {risk.risk_level} risk
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-1">{risk.reason}</p>
                    <p className="text-xs font-medium text-zinc-700">→ {risk.suggested_action}</p>
                  </div>
                  <button
                    onClick={() => setDismissedRisks(prev => new Set([...prev, risk.site_id]))}
                    className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Site Progress Overview */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Site Progress Overview</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs font-bold text-zinc-600">{stats.delayed} Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-bold text-zinc-600">{stats.pending} Pending Approval</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {stats.byStage.map((stage, i) => {
                const percentage = stats.active > 0 ? (stage.count / stats.active) * 100 : 0;
                return (
                  <div key={stage.stage_name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-700">{stage.stage_name}</span>
                      <span className="text-sm font-bold text-zinc-900">{stage.count} sites</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-blue-500' :
                          i === 1 ? 'bg-indigo-500' :
                          i === 2 ? 'bg-violet-500' :
                          i === 3 ? 'bg-purple-500' :
                          i === 4 ? 'bg-fuchsia-500' :
                          'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900">Recent Sites</h3>
            <Link to="/sites" className="text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Site Name</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentSites.map(site => (
                  <tr key={site.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-900">{site.name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{site.client}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium">
                        {site.stage_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {site.is_delayed ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" /> Delayed
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-bold">On Time</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/sites/${site.id}`} className="p-2 hover:bg-zinc-100 rounded-lg inline-block">
                        <ArrowRight className="w-4 h-4 text-zinc-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Database Connection</p>
                <p className="text-xs text-emerald-600">Stable</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <BrainCircuit className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">AI Brain</p>
                <p className="text-xs text-blue-600">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100">
                <Settings className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">System Version</p>
                <p className="text-xs text-zinc-500">v4.1.0-industrial</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
