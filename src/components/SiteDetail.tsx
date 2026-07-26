import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  History, 
  Package, 
  BrainCircuit, 
  FileText,
  AlertTriangle,
  ChevronRight,
  Camera,
  User,
  Check,
  X,
  Loader2,
  Shield,
  Plus,
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

export default function SiteDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [site, setSite] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [safetyLogs, setSafetyLogs] = useState<any[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [safetyForm, setSafetyForm] = useState({
    category: 'PPE',
    severity: 'Low',
    description: '',
    photo_proof: ''
  });

  const fetchData = async () => {
    try {
      const [siteData, historyData, materialsData, safetyData] = await Promise.all([
        api.get(`/api/sites/${id}`, token!),
        api.get(`/api/sites/${id}/history`, token!),
        api.get(`/api/warehouse/transactions?site_id=${id}`, token!),
        api.get('/api/safety/logs', token!)
      ]);
      setSite(siteData);
      setHistory(historyData);
      setMaterials(materialsData);
      setSafetyLogs(safetyData.filter((l: any) => l.site_id === Number(id)));
      
      // Fetch checklist for current stage
      const checklistData = await api.get(`/api/checklists/template/${siteData.current_stage_id}`, token!);
      if (checklistData) {
        const responseData = await api.get(`/api/checklists/response/${id}/${siteData.current_stage_id}`, token!);
        setChecklist({ ...checklistData, response: responseData });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/safety/log', { ...safetyForm, site_id: id }, token!);
      setShowSafetyModal(false);
      setSafetyForm({ category: 'PPE', severity: 'Low', description: '', photo_proof: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim()) return;
    
    setRequesting(true);
    try {
      await api.post(`/api/sites/${id}/request-stage-change`, { reason: requestReason }, token!);
      setShowRequestModal(false);
      setRequestReason('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  if (!site) return <div>Site not found</div>;

  const tabs = [
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'map', name: 'Map View', icon: MapPin },
    { id: 'checklist', name: 'Checklist', icon: CheckCircle2 },
    { id: 'history', name: 'Stage History', icon: History },
    { id: 'materials', name: 'Materials', icon: Package },
    { id: 'safety', name: 'Safety', icon: Shield },
    { id: 'ai', name: 'AI Issues', icon: BrainCircuit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/sites')}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-zinc-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{site.name}</h1>
            {site.pending_stage_approval && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                <Clock className="w-3 h-3" />
                Stage Approval Pending
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">{site.client} · {site.location}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Stage</p>
                      <p className="text-xl font-bold text-zinc-900">{site.stage_name}</p>
                      <div className="mt-4 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(site.current_stage_id / 5) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">Stage {site.current_stage_id} of 5</p>
                    </div>

                    <div className={`p-6 rounded-2xl border ${site.is_delayed ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        {site.is_delayed ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <p className="text-xl font-bold text-red-600">Delayed</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="text-xl font-bold text-emerald-600">On Time</p>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-4">
                        Started: {new Date(site.stage_started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Site Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project ID</p>
                          <p className="text-sm font-bold text-zinc-900">{site.project_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Site ID</p>
                          <p className="text-sm font-bold text-zinc-900">{site.site_custom_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">District</p>
                          <p className="text-sm font-bold text-zinc-900">{site.district || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Client Site ID</p>
                          <p className="text-sm font-bold text-zinc-900">{site.client_site_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Supervisor</p>
                          <p className="text-sm font-bold text-zinc-900">{site.supervisor_name || 'Unassigned'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vendor</p>
                          <p className="text-sm font-bold text-zinc-900">{site.vendor_name || 'Unassigned'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coordinates</p>
                          <p className="text-sm font-bold text-zinc-900">{site.latitude || '0.0'}, {site.longitude || '0.0'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Created At</p>
                          <p className="text-sm font-bold text-zinc-900">{new Date(site.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/20">
                    <h3 className="text-lg font-bold mb-2">Field Actions</h3>
                    <p className="text-emerald-100 text-sm mb-6">Complete the checklist to advance to the next stage.</p>
                    <button 
                      onClick={() => setActiveTab('checklist')}
                      className="w-full bg-white text-emerald-600 font-bold py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Open Checklist
                    </button>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Quick Links</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all text-sm font-medium text-zinc-600">
                        <div className="flex items-center gap-3">
                          <BrainCircuit className="w-4 h-4 text-blue-500" />
                          Ask AI Assistant
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all text-sm font-medium text-zinc-600">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-orange-500" />
                          Material Requests
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowRequestModal(true)}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all text-sm font-medium text-zinc-600"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-amber-500" />
                          Request Stage Change
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Site Map & Directions
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {site.location} {site.latitude && site.longitude ? `(${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)})` : ''}
                      </p>
                    </div>

                    {site.latitude && site.longitude && (
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Directions (Driving)
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}&travelmode=walking`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5 text-zinc-600" />
                          Walking
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                          Google Maps
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-200 relative">
                    {site.latitude && site.longitude ? (
                      <MapContainer center={[site.latitude, site.longitude]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[site.latitude, site.longitude]}>
                          <Popup className="custom-map-popup">
                            <div className="p-1 max-w-xs space-y-2">
                              <div className="font-bold text-sm text-zinc-900">{site.name}</div>
                              <div className="text-xs text-zinc-600">{site.location}</div>
                              <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                  <Navigation className="w-3 h-3" /> Get Directions
                                </a>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-zinc-50 text-zinc-500 space-y-2">
                        <MapPin className="w-8 h-8 text-zinc-300" />
                        <p className="text-sm font-medium">No coordinates available for this site.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'checklist' && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {checklist ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{checklist.name}</h3>
                        <p className="text-sm text-zinc-500">
                          Status: <span className={`font-bold ${
                            checklist.response?.status === 'Submitted' ? 'text-emerald-600' : 
                            checklist.response?.status === 'Draft' ? 'text-orange-500' : 'text-zinc-400'
                          }`}>{checklist.response?.status || 'Not Started'}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/sites/${id}/checklist/${site.current_stage_id}`)}
                        className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${
                          checklist.response?.status === 'Submitted'
                            ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200'
                        }`}
                        disabled={checklist.response?.status === 'Submitted'}
                      >
                        {checklist.response?.status === 'Submitted' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Completed
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            {checklist.response?.status === 'Draft' ? 'Continue Filling' : 'Start Filling'}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {checklist.items.map((item: any) => {
                        const resp = checklist.response?.answers?.find((r: any) => r.item_id === item.id);
                        return (
                          <div key={item.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <p className="font-bold text-zinc-900">{item.question_text}</p>
                              {item.is_mandatory && <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-2 py-1 rounded-lg border border-red-100">Mandatory</span>}
                            </div>
                            
                            {resp ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                                    resp.answer_value === 'Yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    resp.answer_value === 'No' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-zinc-50 text-zinc-600 border-zinc-100'
                                  }`}>
                                    {resp.answer_value}
                                  </span>
                                </div>
                                {resp.remarks && (
                                  <p className="text-sm text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100 italic">
                                    "{resp.remarks}"
                                  </p>
                                )}
                                {resp.photo_url && (
                                  <div className="w-32 aspect-square rounded-xl overflow-hidden border border-zinc-200">
                                    <img src={resp.photo_url} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-400 italic">No response yet.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-zinc-200 rounded-3xl">
                    <Loader2 className="w-8 h-8 text-zinc-300 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500">Loading checklist template...</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                  {history.map((h, i) => (
                    <div key={h.id} className="relative">
                      <div className={`absolute -left-8 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${i === 0 ? 'bg-emerald-500' : 'bg-zinc-300'}`}></div>
                      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-zinc-900">{h.from_stage_name} → {h.to_stage_name}</h4>
                          <span className="text-xs text-zinc-400">{new Date(h.change_date).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Requested: {h.changed_by_name}</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved: {h.approved_by_name || 'Pending'}</span>
                        </div>
                        {h.delay_reason && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                            <strong>Delay Reason:</strong> {h.delay_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">No stage history available.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'materials' && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-6 py-4 font-bold text-zinc-900">Material</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">Type</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">Quantity</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">User</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {materials.length > 0 ? materials.map((m: any) => (
                        <tr key={m.id} className="hover:bg-zinc-50 transition-all">
                          <td className="px-6 py-4 font-medium text-zinc-900">{m.material_name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-bold">{m.quantity}</td>
                          <td className="px-6 py-4 text-zinc-500">{m.user_name}</td>
                          <td className="px-6 py-4 text-zinc-400">{new Date(m.timestamp).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No material transactions recorded for this site.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'safety' && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                  <div className="flex gap-4">
                    <Shield className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">Safety Compliance</h4>
                      <p className="text-sm text-amber-700">Log all safety observations and incidents immediately.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSafetyModal(true)}
                    className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-amber-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Log Issue
                  </button>
                </div>

                <div className="space-y-4">
                  {safetyLogs.length > 0 ? safetyLogs.map((log: any) => (
                    <div key={log.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          log.severity === 'Critical' ? 'bg-rose-500 animate-pulse' :
                          log.severity === 'High' ? 'bg-orange-500' :
                          log.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{log.category}</span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-xs font-bold text-zinc-900">{log.reporter_name}</span>
                          </div>
                          <p className="text-sm text-zinc-600">{log.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border mb-2 inline-block ${
                          log.severity === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          log.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-zinc-50 text-zinc-600 border-zinc-100'
                        }`}>
                          {log.severity}
                        </div>
                        <div className="text-[10px] text-zinc-400">{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-zinc-400 italic">No safety logs recorded for this site.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                  <BrainCircuit className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">AI Site Analysis</h4>
                    <p className="text-sm text-blue-700">AI is monitoring site progress and quality based on checklist photos and data.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Detected Problems</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-900">Low Concrete Quality</p>
                          <p className="text-xs text-red-700">Detected from photo analysis in Stage 2.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Suggested Solutions</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Recalibrate Mixer</p>
                          <p className="text-xs text-emerald-700">Adjust water-to-cement ratio by 5%.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Safety Modal */}
      <AnimatePresence>
        {showSafetyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-900">Log Safety Issue</h3>
                  <button onClick={() => setShowSafetyModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleSafetySubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                      <select 
                        value={safetyForm.category}
                        onChange={(e) => setSafetyForm({ ...safetyForm, category: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option>PPE</option>
                        <option>Equipment</option>
                        <option>Hazard</option>
                        <option>Incident</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Severity</label>
                      <select 
                        value={safetyForm.severity}
                        onChange={(e) => setSafetyForm({ ...safetyForm, severity: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                    <textarea 
                      required
                      value={safetyForm.description}
                      onChange={(e) => setSafetyForm({ ...safetyForm, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                      placeholder="Describe the safety concern..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowSafetyModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                      Submit Log
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Stage Change Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-900">Request Stage Change</h3>
                  <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This will notify the Project Manager for manual review. Please provide a clear reason for the stage advancement.
                  </p>
                </div>

                <form onSubmit={handleRequestStageChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reason for Request</label>
                    <textarea 
                      required
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[120px]"
                      placeholder="e.g. All field work completed, waiting for final inspection..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={requesting || !requestReason.trim()}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
