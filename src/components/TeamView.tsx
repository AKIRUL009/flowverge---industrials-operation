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
  X,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Activity,
  Building2,
  AlertTriangle,
  Key,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function TeamView() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action Menu Dropdown State
  const [activeMenuUserId, setActiveMenuUserId] = useState<number | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Selected User State for actions
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role_id: '',
    password: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Site State
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Success Notification
  const [successToast, setSuccessToast] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const fetchTeam = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get('/api/admin/users', token!),
        api.get('/api/admin/roles', token!)
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role_id: roles.length > 0 ? String(roles[0].id) : '',
      password: '',
      status: 'Active'
    });
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_id: String(user.role_id || ''),
      password: '',
      status: user.status || 'Active'
    });
    setFormError('');
    setShowEditModal(true);
    setActiveMenuUserId(null);
  };

  const handleOpenProfileModal = async (user: any) => {
    setSelectedUser(user);
    setShowProfileModal(true);
    setActiveMenuUserId(null);
    setLoadingProfile(true);
    try {
      const details = await api.get(`/api/admin/users/${user.id}/details`, token!);
      setProfileDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOpenDeleteModal = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setActiveMenuUserId(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.full_name || !formData.email || !formData.password || !formData.role_id) {
      setFormError('Please fill in all required fields (Name, Email, Password, Role).');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/admin/users', {
        ...formData,
        role_id: Number(formData.role_id)
      }, token!);
      setShowAddModal(false);
      triggerToast('New team member invited successfully!');
      fetchTeam();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError('');
    if (!formData.full_name || !formData.email || !formData.role_id) {
      setFormError('Full name, email, and role are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, {
        ...formData,
        role_id: Number(formData.role_id)
      }, token!);
      setShowEditModal(false);
      triggerToast('User profile updated successfully!');
      fetchTeam();
      if (showProfileModal && profileDetails) {
        handleOpenProfileModal(selectedUser);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/admin/users/${selectedUser.id}`, token!);
      setShowDeleteModal(false);
      if (showProfileModal) setShowProfileModal(false);
      triggerToast('Team member removed.');
      fetchTeam();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSite = async () => {
    if (!selectedSiteId || !selectedUser) return;
    setAssigning(true);
    try {
      await api.post('/api/admin/assign-site', { siteId: selectedSiteId, userId: selectedUser.id }, token!);
      setShowAssignModal(false);
      setSelectedSiteId('');
      triggerToast(`Site assigned to ${selectedUser.full_name}!`);
      fetchTeam();
      if (showProfileModal) {
        handleOpenProfileModal(selectedUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || String(u.role_id) === roleFilter || u.role_name === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-zinc-800" />
            Team Directory
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">Manage personnel, user permissions, and site assignments</p>
        </div>
        {['Admin', 'Project Manager'].includes(currentUser?.role || '') && (
          <button 
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search by name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading Team Members...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <Users className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-sm font-semibold text-zinc-700">No team members found</p>
            <p className="text-xs text-zinc-400">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-zinc-200 bg-white hover:shadow-md transition-all relative flex flex-col justify-between space-y-4"
              >
                {/* Actions Dropdown */}
                {['Admin', 'Project Manager'].includes(currentUser?.role || '') && (
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenuUserId === user.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 py-1 text-xs">
                        <button 
                          onClick={() => handleOpenProfileModal(user)}
                          className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          View Profile
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(user)}
                          className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium"
                        >
                          <Edit className="w-3.5 h-3.5 text-zinc-500" />
                          Edit Details
                        </button>
                        {['Supervisor', 'Vendor'].includes(user.role_name) && (
                          <button 
                            onClick={() => { setSelectedUser(user); setShowAssignModal(true); setActiveMenuUserId(null); }}
                            className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            Assign Site
                          </button>
                        )}
                        {currentUser?.id !== user.id && (
                          <button 
                            onClick={() => handleOpenDeleteModal(user)}
                            className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold border-t border-zinc-100 mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            Delete User
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="pr-6">
                      <h3 className="text-sm font-bold text-zinc-900 leading-tight">{user.full_name}</h3>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 mt-1">
                        <Shield className="w-3 h-3 text-zinc-500" />
                        {user.role_name}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 text-zinc-600">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-zinc-600">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      <span>{user.phone || 'No phone set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-xs font-semibold text-zinc-700">{user.status || 'Active'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">
                    Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <button 
                    onClick={() => handleOpenProfileModal(user)}
                    className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    View Profile &rarr;
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* --- ADD / INVITE USER MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-emerald-600" />
                      Add New Team Member
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Create a user account and set role access</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="+1 234 567 890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Role *</label>
                      <select 
                        required
                        value={formData.role_id}
                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                      >
                        <option value="">Select Role...</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Account Password *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {submitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT USER MODAL --- */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                      <Edit className="w-5 h-5 text-emerald-600" />
                      Edit User Details
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Update profile info for {selectedUser?.full_name}</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Role *</label>
                      <select 
                        required
                        value={formData.role_id}
                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">New Password (leave blank to keep current)</label>
                    <input 
                      type="password" 
                      placeholder="Enter new password if changing"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PROFILE MODAL --- */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-100 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-zinc-100 flex items-start justify-between bg-zinc-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-2xl font-bold">
                    {selectedUser?.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">{selectedUser?.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-800">
                        <Shield className="w-3 h-3" />
                        {selectedUser?.role_name}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedUser?.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {selectedUser?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-zinc-200 rounded-xl transition-all">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                {loadingProfile ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Loading profile history...</span>
                  </div>
                ) : (
                  <>
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Email Address</span>
                        <p className="font-semibold text-zinc-900 mt-0.5">{profileDetails?.user?.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Phone Number</span>
                        <p className="font-semibold text-zinc-900 mt-0.5">{profileDetails?.user?.phone || 'Not configured'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Joined Date</span>
                        <p className="font-semibold text-zinc-900 mt-0.5">
                          {profileDetails?.user?.created_at ? new Date(profileDetails.user.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Language Preference</span>
                        <p className="font-semibold text-zinc-900 mt-0.5">{profileDetails?.user?.language_preference || 'English'}</p>
                      </div>
                    </div>

                    {/* Assigned Sites */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        Assigned Installation Sites ({profileDetails?.assignedSites?.length || 0})
                      </h4>
                      {profileDetails?.assignedSites?.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                          No active sites assigned to this user.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {profileDetails?.assignedSites?.map((site: any) => (
                            <div key={site.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-zinc-900">{site.name}</span>
                                <span className="text-zinc-400 ml-2">({site.site_custom_id || site.id})</span>
                                <p className="text-zinc-500 text-[11px] mt-0.5">{site.location}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px] uppercase">
                                {site.status || 'In Progress'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activity Logs */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Recent Action History
                      </h4>
                      {profileDetails?.recentLogs?.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                          No recent actions logged for this user.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {profileDetails?.recentLogs?.map((log: any) => (
                            <div key={log.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs flex justify-between items-start gap-3">
                              <div>
                                <span className="font-bold text-zinc-900">{log.action}</span>
                                <p className="text-zinc-600 text-[11px] mt-0.5">{log.details}</p>
                              </div>
                              <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer Quick Actions */}
              {['Admin', 'Project Manager'].includes(currentUser?.role || '') && (
                <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-end gap-3 text-xs">
                  {['Supervisor', 'Vendor'].includes(selectedUser?.role_name) && (
                    <button 
                      onClick={() => { setShowAssignModal(true); }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Assign Site
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenEditModal(selectedUser)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  {currentUser?.id !== selectedUser?.id && (
                    <button 
                      onClick={() => handleOpenDeleteModal(selectedUser)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-100"
            >
              <div className="p-6 sm:p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Remove Team Member?</h3>
                  <p className="text-xs text-zinc-600 mt-1">
                    Are you sure you want to permanently delete <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email})? This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={submitting}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {submitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ASSIGN SITE MODAL --- */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-100"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Assign Installation Site</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Assign a site to {selectedUser?.full_name}</p>
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
                      className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                      onClick={handleAssignSite}
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
