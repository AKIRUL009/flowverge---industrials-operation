import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Filter, 
  Calendar,
  Loader2,
  FileText,
  Package,
  AlertCircle,
  Shield,
  Zap,
  Users,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { getAIInstance } from '../utils/ai';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function ReportsView() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sitesRaw, stockRaw, aiCasesRaw, safetyLogsRaw, vendorsRaw, warehouseEfficiencyRaw, aiWeeklyRaw] = await Promise.all([
        api.get('/api/sites', token!),
        api.get('/api/warehouse/stock', token!),
        api.get('/api/ai/cases', token!),
        api.get('/api/safety/logs', token!),
        api.get('/api/reports/vendors', token!),
        api.get('/api/reports/warehouse/efficiency', token!),
        api.get('/api/reports/ai-weekly', token!)
      ]);

      const sites = Array.isArray(sitesRaw) ? sitesRaw : [];
      const stock = Array.isArray(stockRaw) ? stockRaw : [];
      const aiCases = Array.isArray(aiCasesRaw) ? aiCasesRaw : [];
      const safetyLogs = Array.isArray(safetyLogsRaw) ? safetyLogsRaw : [];
      const vendors = Array.isArray(vendorsRaw) ? vendorsRaw : [];
      const warehouseEfficiency = Array.isArray(warehouseEfficiencyRaw) ? warehouseEfficiencyRaw : [];
      const aiWeekly = Array.isArray(aiWeeklyRaw) ? aiWeeklyRaw : [];

      // Aggregate site stages
      const stageCounts = sites.reduce((acc: any, site: any) => {
        acc[site.stage_name] = (acc[site.stage_name] || 0) + 1;
        return acc;
      }, {});

      const stageData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }));

      // Aggregate stock levels
      const stockData = stock.map((s: any) => ({
        name: s.name,
        stock: s.current_stock,
        min: s.min_stock
      }));

      // Aggregate AI categories
      const aiStats = aiCases.reduce((acc: any, c: any) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});

      // Calculate performance
      const onTimeSites = sites.filter((s: any) => s.status === 'On Time').length;
      const performance = sites.length > 0 ? Math.round((onTimeSites / sites.length) * 100) : 100;

      setData({ 
        stageData, 
        stockData, 
        aiStats, 
        performance, 
        totalSites: sites.length,
        safetyLogs,
        vendorPerformance: vendors,
        warehouseEfficiency,
        aiWeeklyReports: aiWeekly
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const generateAIWeeklySummary = async () => {
    try {
      setGeneratingAI(true);
      const { ai, model } = await getAIInstance(token!);
      
      const prompt = `
        As a Project Management AI for FlowVerge (Solar Infrastructure), generate a weekly summary report based on the following data:
        
        Today's date is ${new Date().toLocaleDateString('en-IN')}. The reporting period is the last 7 days.
        
        Sites: ${JSON.stringify(data.stageData)}
        AI Issues: ${JSON.stringify(data.aiStats)}
        Safety Logs: ${JSON.stringify(data.safetyLogs.slice(0, 5))}
        Performance: ${data.performance}%
        
        Provide a professional summary in Markdown format with:
        1. Executive Overview
        2. Critical Risks (Safety/AI)
        3. Resource Recommendations
        4. Next Week's Outlook
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      const summary = response.text;
      const weekStart = new Date().toISOString().split('T')[0];

      await api.post('/api/reports/ai-weekly', { summary, week_start: weekStart }, token!);
      await fetchReports();
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      if (err?.status === 429 || err?.message?.includes('429')) {
        alert('AI service is currently busy (rate limit reached). Please try again in a minute.');
      } else {
        alert('Failed to generate AI summary. Please try again later.');
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    // Export Site Stage Distribution
    const stageHeaders = ['Stage Name', 'Count'];
    const stageRows = data.stageData.map((s: any) => `${s.name},${s.value}`);
    const stageCSV = [stageHeaders.join(','), ...stageRows].join('\n');

    // Export Inventory
    const stockHeaders = ['Material', 'Current Stock', 'Min Required'];
    const stockRows = data.stockData.map((s: any) => `${s.name},${s.stock},${s.min}`);
    const stockCSV = [stockHeaders.join(','), ...stockRows].join('\n');

    const fullCSV = `SITE STAGE DISTRIBUTION\n${stageCSV}\n\nINVENTORY STATUS\n${stockCSV}`;
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `flowverge_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Generating Reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-rose-500 gap-3">
        <AlertCircle className="w-8 h-8" />
        <span className="text-sm font-bold">{error}</span>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-zinc-500 text-sm mt-1">Operational insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Site Progress Report */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Site Stage Distribution</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Active Projects</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {data.stageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data.stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.stageData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-400 text-xs font-medium italic">No active site data available</div>
            )}
          </div>
          {data.stageData.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {data.stageData.map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-zinc-600 font-medium">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Status Report */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Inventory Levels</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Current Stock vs Min Required</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {data.stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="stock" fill="#18181b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="min" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-400 text-xs font-medium italic">No inventory data available</div>
            )}
          </div>
        </div>

        {/* AI Problem Categories */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Issue Trends</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Reported problems by category</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Technical Issues</div>
              <div className="text-2xl font-bold text-zinc-900">{data.aiStats['Technical'] || 0}</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-1">Active AI detections</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Material Delays</div>
              <div className="text-2xl font-bold text-zinc-900">{data.aiStats['Material'] || 0}</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-1">Supply chain alerts</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">On-Time Performance</div>
              <div className="text-2xl font-bold text-zinc-900">{data.performance}%</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">Based on {data.totalSites} sites</div>
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Vendor Performance</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Site delays by vendor</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.vendorPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip />
                <Bar dataKey="total_sites" name="Total Sites" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed_sites" name="Delayed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Efficiency */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Warehouse Throughput</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Transaction volume by material</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.warehouseEfficiency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip />
                <Bar dataKey="total_in" name="In" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_out" name="Out" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safety Log Summary */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Safety Compliance</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Recent safety logs & incidents</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {data.safetyLogs.length > 0 ? (
              data.safetyLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      log.severity === 'Critical' ? 'bg-rose-500 animate-pulse' :
                      log.severity === 'High' ? 'bg-orange-500' :
                      log.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div>
                      <div className="text-xs font-bold text-zinc-900">{log.category} at {log.site_name}</div>
                      <div className="text-[10px] text-zinc-500">{log.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{log.severity}</div>
                    <div className="text-[10px] text-zinc-400">{new Date(log.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 text-xs italic">No safety logs reported</div>
            )}
          </div>
        </div>

        {/* AI Weekly Summary */}
        <div className="bg-zinc-900 p-8 rounded-[2rem] text-white lg:col-span-2 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">AI Weekly Summary</h3>
                  <p className="text-white/50 text-xs uppercase font-bold tracking-widest">Powered by Gemini 2.0</p>
                </div>
              </div>
              <button 
                onClick={generateAIWeeklySummary}
                disabled={generatingAI}
                className="px-6 py-2.5 bg-white text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                {generatingAI ? 'Analyzing...' : 'Generate New Summary'}
              </button>
            </div>

            {data.aiWeeklyReports.length > 0 ? (
              <div className="space-y-8">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{data.aiWeeklyReports[0].summary}</ReactMarkdown>
                </div>
                <div className="pt-8 border-t border-white/10">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Previous Reports</h4>
                  <div className="flex flex-wrap gap-4">
                    {data.aiWeeklyReports.slice(1).map((report: any) => (
                      <div key={report.id} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/70">
                        {new Date(report.week_start).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl">
                <p className="text-white/40 text-sm italic">No AI summaries generated yet. Click the button above to analyze this week's data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
