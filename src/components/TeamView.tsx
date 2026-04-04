import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Shield, 
  MapPin, 
  MoreVertical, 
  Search, 
  Filter,
  Loader2,
  UserPlus,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function TeamView() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await api.get('/api/admin/users', token!);
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [token]);

  useEffect(() => {
    if (showAssignModal) {
      const fetchSites = async () => {
        try {
          const data = await api.get('/api/sites', token!);
          setSites(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchSites();
    }
  }, [showAssignModal, token]);

  const handleAssign = async () => {
    if (!selectedSiteId || !selectedUser) return;
    setAssigning(true);
    try {
      await api.post('/api/admin/assign-site', { siteId: selectedSiteId, userId: selectedUser.id }, token!);
      setShowAssignModal(false);
      setSelectedSiteId('');
      const data = await api.get('/api/admin/users', token!);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Team Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage personnel and site assignments</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading Team...</span>
            </div>
          ) : filteredUsers.map((user) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all group relative"
            >
              <button className="absolute top-4 right-4 p-1.5 text-zinc-300 hover:text-zinc-900 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 text-xl font-bold">
                  {user.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{user.full_name}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 mt-1">
                    <Shield className="w-3 h-3" />
                    {user.role_name}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-xs">{user.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-xs font-medium text-zinc-600">{user.status}</span>
                </div>
                
                {['Admin', 'Project Manager'].includes(currentUser?.role || '') && ['Supervisor', 'Vendor'].includes(user.role_name) && (
                  <div className="pt-2">
                    <button 
                      onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Assign Site
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-zinc-50 flex items-center justify-between">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <button className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider hover:underline">
                  View Profile
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Assign Site</h3>
                    <p className="text-xs text-zinc-500 mt-1">Assign a site to {selectedUser?.full_name}</p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Site</label>
                    <select 
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a site...</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({site.site_custom_id || site.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAssign}
                      disabled={!selectedSiteId || assigning}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {assigning ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
