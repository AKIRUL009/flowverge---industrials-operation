import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ApprovalsView() {
  const { token } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/approvals', token!).then(data => {
      setApprovals(data);
      setLoading(false);
    });
  }, [token]);

  const handleAction = async (id: number, status: 'Approved' | 'Rejected') => {
    setProcessing(id);
    try {
      await api.post(`/api/approvals/${id}`, { status, reason: 'Approved via dashboard' }, token!);
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Approval Center</h1>
        <p className="text-sm text-zinc-500">Review and authorize pending site requests</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {approvals.map((approval) => (
            <motion.div
              key={approval.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`
                      px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                      ${approval.linked_type === 'Stage' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}
                    `}>
                      {approval.linked_type} Request
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(approval.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {approval.linked_type === 'Stage' ? 'Stage Advancement' : 'Checklist Reopen'}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium">{approval.site_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span>Requested by: <span className="font-bold">{approval.requested_by_name}</span></span>
                      </div>
                    </div>
                  </div>

                  {approval.reason && (
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-sm text-zinc-600 italic">
                      "{approval.reason}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 lg:pl-6 lg:border-l border-zinc-100">
                  <button 
                    onClick={() => handleAction(approval.id, 'Rejected')}
                    disabled={processing === approval.id}
                    className="flex-1 lg:flex-none px-6 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(approval.id, 'Approved')}
                    disabled={processing === approval.id}
                    className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"
                  >
                    {processing === approval.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {approvals.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">All caught up!</h3>
            <p className="text-zinc-500 text-sm">No pending approvals at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
