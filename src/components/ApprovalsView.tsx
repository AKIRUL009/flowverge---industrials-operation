import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  History,
  Activity,
  ArrowRight,
  UserCheck,
  UserX,
  Zap,
  ListTodo,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ApprovalsView() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'audit'>('pending');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [historyApprovals, setHistoryApprovals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const [pendingData, historyData, logsData] = await Promise.all([
        api.get('/api/approvals?status=Pending', token!),
        api.get('/api/approvals?status=all', token!),
        api.get('/api/logs', token!)
      ]);

      setApprovals(Array.isArray(pendingData) ? pendingData : []);
      
      const allHistory = Array.isArray(historyData) ? historyData.filter((a: any) => a.status !== 'Pending') : [];
      setHistoryApprovals(allHistory);

      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to load approvals and state transition logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [token]);

  const handleAction = async (id: number, status: 'Approved' | 'Rejected') => {
    setProcessing(id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.post(`/api/approvals/${id}`, { 
        status, 
        reason: `${status} by ${user?.full_name || user?.role || 'Authorized Approver'} via Approval Center` 
      }, token!);

      if (status === 'Approved') {
        setSuccessMessage(`Approval granted successfully! ${res.tasks_created ? `Triggered ${res.tasks_created} downstream tasks.` : ''}`);
      } else {
        setSuccessMessage('Approval request rejected.');
      }

      await fetchApprovals();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${status.toLowerCase()} request`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Approval & Workflow Center</h1>
          <p className="text-sm text-zinc-500">Authorize site requests, review approver decisions, and track state transitions</p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending
            {approvals.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                {approvals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-500" />
            Approval History ({historyApprovals.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            State Audit Logs
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-xs font-bold text-red-600 hover:text-red-800 underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {approvals.map((approval) => (
              <motion.div
                key={approval.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden hover:border-zinc-300 transition-all"
              >
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`
                        px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        ${approval.linked_type === 'Stage' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}
                      `}>
                        {approval.linked_type} Advancement Request
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" /> 
                        Submitted: {new Date(approval.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-zinc-900">{approval.site_name}</h3>
                        {approval.site_custom_id && (
                          <span className="text-xs text-zinc-400 font-mono">({approval.site_custom_id})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-700 font-semibold bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 inline-flex">
                        <span>{approval.from_stage_name}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-700 font-bold">{approval.to_stage_name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-600">
                        <User className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>Requested By: <strong className="text-zinc-900">{approval.requested_by_name}</strong> ({approval.requested_by_role})</span>
                      </div>

                      {/* Explicitly state WHO will approve */}
                      <div className="flex items-center gap-2 text-blue-700 bg-blue-50/60 px-2.5 py-1.5 rounded-lg border border-blue-100/80">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Authorized Approvers: <strong className="font-bold text-blue-900">Project Manager</strong> or <strong className="font-bold text-blue-900">Admin</strong></span>
                      </div>
                    </div>

                    {approval.reason && (
                      <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 text-xs text-amber-900">
                        <span className="font-bold uppercase text-[10px] text-amber-700 block mb-0.5">Request Justification:</span>
                        "{approval.reason}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 lg:pl-6 lg:border-l border-zinc-100 shrink-0">
                    <button 
                      onClick={() => handleAction(approval.id, 'Rejected')}
                      disabled={processing === approval.id}
                      className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(approval.id, 'Approved')}
                      disabled={processing === approval.id}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2"
                    >
                      {processing === approval.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve & Advance
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {approvals.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">All Approvals Completed</h3>
              <p className="text-zinc-500 text-sm mt-1">There are currently no pending approval requests.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPROVAL HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 mb-1">Approval Decision Log</h2>
            <p className="text-xs text-zinc-500 mb-4">Historical record of all approved and rejected requests, detailing who granted approval.</p>

            <div className="space-y-3">
              {historyApprovals.map((historyItem) => {
                const isApproved = historyItem.status === 'Approved';
                return (
                  <div 
                    key={historyItem.id} 
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {historyItem.status}
                        </span>

                        <span className="font-bold text-zinc-900 text-sm">{historyItem.site_name}</span>
                        <span className="text-xs text-zinc-400">· {new Date(historyItem.updated_at || historyItem.created_at).toLocaleString()}</span>
                      </div>

                      {/* Who Approved / Rejected details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Requested by: <strong className="text-zinc-800">{historyItem.requested_by_name}</strong> ({historyItem.requested_by_role})</span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                          isApproved 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                            : 'bg-red-50 text-red-900 border-red-200'
                        }`}>
                          {isApproved ? (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <UserX className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span>
                            {isApproved ? 'Approved By:' : 'Rejected By:'}{' '}
                            <strong className="font-bold">{historyItem.approved_by_name}</strong>{' '}
                            ({historyItem.approved_by_role || 'Project Manager'})
                          </span>
                        </div>
                      </div>

                      {historyItem.reason && (
                        <p className="text-xs text-zinc-500 italic bg-white p-2.5 rounded-lg border border-zinc-100">
                          Note: "{historyItem.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {historyApprovals.length === 0 && (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  No approval history recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATE TRANSITION AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">System State Transition Audit Trail</h2>
              <p className="text-xs text-zinc-500">Immutable log of stage advancements, approval decisions, and downstream task triggers</p>
            </div>
            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
              {auditLogs.length} Entries Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-bold text-[10px] border-y border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition-all">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.action.includes('Approved') ? 'bg-emerald-100 text-emerald-800' :
                        log.action.includes('Rejected') ? 'bg-red-100 text-red-800' :
                        log.action.includes('Request') ? 'bg-amber-100 text-amber-800' :
                        log.action.includes('Triggered') ? 'bg-blue-100 text-blue-800' :
                        'bg-zinc-100 text-zinc-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      {log.site_name || 'System General'}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                      <strong className="text-zinc-900">{log.user_name}</strong> ({log.user_role})
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {log.details}
                    </td>
                  </tr>
                ))}

                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-400">
                      No state transition logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
