import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  MapPin, 
  BrainCircuit, 
  LayoutDashboard, 
  LogOut, 
  User, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import SiteDetail from './SiteDetail';
import AIHelp from './AIHelp';
import ChecklistFill from './ChecklistFill';
import ProfileView from './ProfileView';

export default function VendorDashboard() {
  const { user, logout, token } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    api.get('/api/sites', token!).then(data => {
      setSites(data);
      setLoading(false);
    });
  }, [token]);

  const navItems = [
    { name: 'My Sites', icon: MapPin, path: '/' },
    { name: 'AI Help', icon: BrainCircuit, path: '/ai-help' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#1a1c1e]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Mobile Header */}
      <header className="bg-[#1a1c1e] text-white p-4 flex justify-between items-center lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight">FLOWVERGE</span>
        </div>
        <button onClick={logout} className="p-2 text-zinc-400 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#1a1c1e] text-white">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">FLOWVERGE</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vendor Portal</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${location.pathname === item.path 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-white/5">
            <div className="px-4 py-3 bg-white/5 rounded-xl mb-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vendor Access</p>
              <p className="text-sm font-bold mt-1 truncate">{user?.full_name}</p>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">My Assigned Sites</h1>
                  <p className="text-sm text-zinc-500">Manage your active solar installation projects</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sites.map((site, i) => (
                    <motion.div
                      key={site.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <MapPin className="w-6 h-6 text-emerald-600" />
                          </div>
                          {site.is_delayed && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Delayed
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1">{site.name}</h3>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">{site.client}</p>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Current Stage</span>
                            <span className="font-bold text-zinc-900">{site.stage_name}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(site.current_stage_id / 5) * 100}%` }}></div>
                          </div>
                        </div>

                        <Link 
                          to={`/sites/${site.id}`}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          Open Project <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {sites.length === 0 && (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                      <MapPin className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">No sites assigned</h3>
                    <p className="text-zinc-500 text-sm">You haven't been assigned to any sites yet.</p>
                  </div>
                )}
              </div>
            } />
            <Route path="/sites/:id" element={<SiteDetail />} />
            <Route path="/sites/:siteId/checklist/:stageId" element={<ChecklistFill />} />
            <Route path="/ai-help" element={<AIHelp />} />
            <Route path="/profile" element={<ProfileView />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="bg-white border-t border-zinc-200 p-2 flex justify-around lg:hidden sticky bottom-0 z-40">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-xl transition-all
              ${location.pathname === item.path ? 'text-emerald-600' : 'text-zinc-400'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
