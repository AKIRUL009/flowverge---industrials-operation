import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  Package, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  AlertTriangle,
  History,
  Camera,
  Loader2,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GeotagCamera from './GeotagCamera';

export default function WarehouseView() {
  const { token, user } = useAuth();
  const [stock, setStock] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'IN' | 'OUT' | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: '',
    site_id: '',
    remarks: '',
    photo_proof: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockData, sitesData] = await Promise.all([
          api.get('/api/warehouse/stock', token!),
          api.get('/api/sites', token!)
        ]);
        setStock(stockData);
        setSites(sitesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handlePhotoCapture = (base64: string) => {
    setFormData(prev => ({ ...prev, photo_proof: base64 }));
    setShowCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photo_proof) {
      alert('Photo proof is required for warehouse transactions.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/warehouse/transaction', {
        ...formData,
        type: showModal,
        quantity: parseFloat(formData.quantity),
        material_id: parseInt(formData.material_id),
        site_id: formData.site_id ? parseInt(formData.site_id) : null
      }, token!);
      
      // Refresh stock
      const newStock = await api.get('/api/warehouse/stock', token!);
      setStock(newStock);
      setShowModal(null);
      setFormData({ material_id: '', quantity: '', site_id: '', remarks: '', photo_proof: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Warehouse & Inventory</h1>
          <p className="text-sm text-zinc-500">Manage materials and stock transactions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowModal('IN')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/10"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>Stock IN</span>
          </button>
          <button 
            onClick={() => setShowModal('OUT')}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-900/10"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Stock OUT</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900">Current Stock</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search materials..." 
                  className="bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Material Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stock.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{item.category}</td>
                      <td className="px-6 py-4 font-mono font-bold">{item.current_stock}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{item.unit}</td>
                      <td className="px-6 py-4">
                        {item.current_stock <= item.min_stock ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-bold">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Inventory Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-sm text-zinc-500">Total Items</span>
                <span className="text-xl font-bold text-zinc-900">{stock.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                <span className="text-sm text-red-600">Low Stock Items</span>
                <span className="text-xl font-bold text-red-600">
                  {stock.filter(s => s.current_stock <= s.min_stock).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Recent Activity</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">View full transaction history in the Reports section.</p>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
              View History
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className={`p-6 flex justify-between items-center text-white sticky top-0 z-10 ${showModal === 'IN' ? 'bg-emerald-600' : 'bg-zinc-900'}`}>
                <h3 className="text-xl font-bold">Stock {showModal} Transaction</h3>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Material</label>
                    <select 
                      required
                      value={formData.material_id}
                      onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Choose material...</option>
                      {stock.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Quantity</label>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="0.00"
                    />
                  </div>

                  {showModal === 'OUT' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Site</label>
                      <select 
                        required
                        value={formData.site_id}
                        onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">Select site...</option>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Photo Proof (Required)</label>
                    {formData.photo_proof ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-200">
                        <img src={formData.photo_proof} alt="Proof" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, photo_proof: '' })}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setShowCamera(true)}
                        className="w-full border-2 border-dashed border-zinc-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:bg-zinc-50 transition-all text-zinc-400"
                      >
                        <Camera className="w-8 h-8" />
                        <span className="text-xs font-bold uppercase tracking-wider">Capture Photo Proof</span>
                      </button>
                    )}
                  </div>

                  {showCamera && (
                    <GeotagCamera 
                      onCapture={handlePhotoCapture}
                      onClose={() => setShowCamera(false)}
                    />
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Remarks</label>
                    <textarea 
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      rows={3}
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="flex-1 px-6 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-6 py-3 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${showModal === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Confirm ${showModal}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
