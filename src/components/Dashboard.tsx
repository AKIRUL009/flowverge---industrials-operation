import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  LayoutDashboard, 
  MapPin, 
  CheckCircle2, 
  Warehouse, 
  BrainCircuit, 
  BarChart3, 
  Settings, 
  Users, 
  User,
  LogOut,
  Bell,
  Menu,
  X,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface DashboardProps {
  children: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const { user, logout, token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      api.get(`/api/notifications/${user.id}`, token!).then(setNotifications);
    }
  }, [user, token]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Admin', 'Project Manager', 'Supervisor', 'Warehouse', 'Technician'] },
    { name: 'Sites', icon: MapPin, path: '/sites', roles: ['Admin', 'Project Manager', 'Supervisor'] },
    { name: 'Approvals', icon: CheckCircle2, path: '/approvals', roles: ['Admin', 'Project Manager'] },
    { name: 'Warehouse', icon: Warehouse, path: '/warehouse', roles: ['Admin', 'Project Manager', 'Warehouse'] },
    { name: 'AI Brain', icon: BrainCircuit, path: '/ai-brain', roles: ['Admin', 'Project Manager', 'Supervisor'] },
    { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['Admin', 'Project Manager'] },
    { name: 'System Admin', icon: Settings, path: '/admin', roles: ['Admin'] },
    { name: 'Team', icon: Users, path: '/team', roles: ['Admin', 'Project Manager'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['Admin'] },
    { name: 'Profile', icon: User, path: '/profile', roles: ['Admin', 'Project Manager', 'Supervisor', 'Warehouse', 'Technician'] },
  ];

  const userRole = user?.role || (user as any)?.role_name || '';
  const filteredNav = navItems.filter(item => 
    item.roles.some(r => r.toLowerCase() === userRole.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1c1e] text-white transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FLOWVERGE</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${location.pathname === item.path 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex-1 px-4">
            <h2 className="text-lg font-semibold text-zinc-900 hidden lg:block">
              {filteredNav.find(n => n.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
                      <span className="font-bold">Notifications</span>
                      <button className="text-xs text-emerald-600 font-medium">Mark all read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                            <p className="text-sm text-zinc-900">{n.message}</p>
                            <span className="text-[10px] text-zinc-400 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900">{user?.full_name}</p>
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
