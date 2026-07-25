import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  ListTodo, 
  Settings2, 
  Save, 
  X,
  ChevronRight,
  ArrowRight,
  Info,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorkflowManager() {
  const { token } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stages' | 'checklists'>('stages');
  const [loading, setLoading] = useState(true);

  // Stage Modal State
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [stageForm, setStageForm] = useState({
    name: '',
    sequence_order: 1,
    max_allowed_days: 7,
    working_principle: '',
    necessary_functions: ''
  });

  // Checklist Modal State
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    stage_id: '',
    name: '',
    is_active: 1
  });

  // Checklist Items State
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({
    question_text: '',
    answer_type: 'Yes/No',
    is_mandatory: true,
    requires_photo: false,
    order_no: 1
  });
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stagesData, templatesData] = await Promise.all([
        api.get('/api/stages', token!),
        api.get('/api/admin/checklists', token!)
      ]);
      setStages(stagesData);
      setTemplates(templatesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStage) {
        await api.put(`/api/admin/stages/${editingStage.id}`, stageForm, token!);
      } else {
        await api.post('/api/admin/stages', stageForm, token!);
      }
      setShowStageModal(false);
      setEditingStage(null);
      setStageForm({ name: '', sequence_order: 1, max_allowed_days: 7, working_principle: '', necessary_functions: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/api/admin/checklists/${editingTemplate.id}`, templateForm, token!);
      } else {
        await api.post('/api/admin/checklists', templateForm, token!);
      }
      setShowChecklistModal(false);
      setEditingTemplate(null);
      setTemplateForm({ stage_id: '', name: '', is_active: 1 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async (templateId: number) => {
    try {
      const data = await api.get(`/api/admin/checklists/${templateId}/items`, token!);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/admin/checklists/items/${editingItem.id}`, itemForm, token!);
      } else {
        await api.post(`/api/admin/checklists/${activeTemplate.id}/items`, itemForm, token!);
      }
      setEditingItem(null);
      setItemForm({ question_text: '', answer_type: 'Yes/No', is_mandatory: true, requires_photo: false, order_no: items.length + 1 });
      fetchItems(activeTemplate.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/api/admin/checklists/items/${id}`, token!);
      fetchItems(activeTemplate.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stage? This may affect existing sites.')) return;
    try {
      await api.delete(`/api/admin/stages/${id}`, token!);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Workflow Manager</h1>
          <p className="text-sm text-zinc-500">Configure project stages and checklist requirements</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stages' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Stages
          </button>
          <button
            onClick={() => setActiveTab('checklists')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'checklists' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Checklists
          </button>
        </div>
      </div>

      {activeTab === 'stages' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingStage(null);
                setStageForm({ name: '', sequence_order: stages.length + 1, max_allowed_days: 7, working_principle: '', necessary_functions: '' });
                setShowStageModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Stage
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stages.map((stage) => (
              <motion.div
                key={stage.id}
                layout
                className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-zinc-600 border border-zinc-200">
                      {stage.sequence_order}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{stage.name}</h3>
                      <p className="text-xs text-zinc-500">Max Allowed: {stage.max_allowed_days} days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingStage(stage);
                        setStageForm({
                          name: stage.name,
                          sequence_order: stage.sequence_order,
                          max_allowed_days: stage.max_allowed_days,
                          working_principle: stage.working_principle || '',
                          necessary_functions: stage.necessary_functions || ''
                        });
                        setShowStageModal(true);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {(stage.working_principle || stage.necessary_functions) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Working Principle</span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {stage.working_principle || 'No working principle defined.'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Necessary Functions</span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {stage.necessary_functions || 'No necessary functions defined.'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ stage_id: stages[0]?.id || '', name: '', is_active: 1 });
                setShowChecklistModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Checklist
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-zinc-900">Checklist Name</th>
                  <th className="px-6 py-4 font-bold text-zinc-900">Stage</th>
                  <th className="px-6 py-4 font-bold text-zinc-900">Status</th>
                  <th className="px-6 py-4 font-bold text-zinc-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-zinc-50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <ListTodo className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-zinc-900">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium">
                        {template.stage_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveTemplate(template);
                            fetchItems(template.id);
                            setShowItemsModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-all"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Manage Items
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm({
                              stage_id: template.stage_id,
                              name: template.name,
                              is_active: template.is_active
                            });
                            setShowChecklistModal(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage Modal */}
      <AnimatePresence>
        {showStageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-900">{editingStage ? 'Edit Stage' : 'Add New Stage'}</h3>
                  <button onClick={() => setShowStageModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleStageSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stage Name</label>
                      <input
                        required
                        type="text"
                        value={stageForm.name}
                        onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="e.g. Foundation"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Order</label>
                        <input
                          required
                          type="number"
                          value={stageForm.sequence_order}
                          onChange={(e) => setStageForm({ ...stageForm, sequence_order: parseInt(e.target.value) })}
                          className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Days</label>
                        <input
                          required
                          type="number"
                          value={stageForm.max_allowed_days}
                          onChange={(e) => setStageForm({ ...stageForm, max_allowed_days: parseInt(e.target.value) })}
                          className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Working Principle</label>
                    <textarea
                      value={stageForm.working_principle}
                      onChange={(e) => setStageForm({ ...stageForm, working_principle: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[100px]"
                      placeholder="Describe how this stage should be executed..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Necessary Functions</label>
                    <textarea
                      value={stageForm.necessary_functions}
                      onChange={(e) => setStageForm({ ...stageForm, necessary_functions: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[100px]"
                      placeholder="List key functions or tasks to perform..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowStageModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                      {editingStage ? 'Update Stage' : 'Create Stage'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checklist Template Modal */}
      <AnimatePresence>
        {showChecklistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-900">{editingTemplate ? 'Edit Checklist' : 'New Checklist'}</h3>
                  <button onClick={() => setShowChecklistModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleTemplateSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Checklist Name</label>
                    <input
                      required
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. Foundation Quality Check"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Associated Stage</label>
                    <select
                      required
                      value={templateForm.stage_id}
                      onChange={(e) => setTemplateForm({ ...templateForm, stage_id: e.target.value })}
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Select a stage</option>
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={templateForm.is_active === 1}
                      onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked ? 1 : 0 })}
                      className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-zinc-700">Active Template</label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowChecklistModal(false)}
                      className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                      {editingTemplate ? 'Update Checklist' : 'Create Checklist'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checklist Items Modal */}
      <AnimatePresence>
        {showItemsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Manage Checklist Items</h3>
                    <p className="text-sm text-zinc-500">{activeTemplate?.name}</p>
                  </div>
                  <button onClick={() => setShowItemsModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Item Form */}
                  <div className="lg:col-span-1">
                    <form onSubmit={handleItemSubmit} className="space-y-4 sticky top-0">
                      <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{editingItem ? 'Edit Item' : 'Add New Item'}</h4>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Question Text</label>
                          <textarea
                            required
                            value={itemForm.question_text}
                            onChange={(e) => setItemForm({ ...itemForm, question_text: e.target.value })}
                            className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="e.g. Is the site accessible?"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Answer Type</label>
                          <select
                            value={itemForm.answer_type}
                            onChange={(e) => setItemForm({ ...itemForm, answer_type: e.target.value })}
                            className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          >
                            <option>Yes/No</option>
                            <option>Text</option>
                            <option>Number</option>
                            <option>Photo</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="is_mandatory"
                              checked={itemForm.is_mandatory}
                              onChange={(e) => setItemForm({ ...itemForm, is_mandatory: e.target.checked })}
                              className="w-4 h-4 rounded border-zinc-300 text-emerald-600"
                            />
                            <label htmlFor="is_mandatory" className="text-xs font-bold text-zinc-600">Mandatory</label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="requires_photo"
                              checked={itemForm.requires_photo}
                              onChange={(e) => setItemForm({ ...itemForm, requires_photo: e.target.checked })}
                              className="w-4 h-4 rounded border-zinc-300 text-emerald-600"
                            />
                            <label htmlFor="requires_photo" className="text-xs font-bold text-zinc-600">Requires Photo Proof</label>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {editingItem && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(null);
                                setItemForm({ question_text: '', answer_type: 'Yes/No', is_mandatory: true, requires_photo: false, order_no: items.length + 1 });
                              }}
                              className="flex-1 py-2 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-zinc-800 transition-all"
                          >
                            {editingItem ? 'Update' : 'Add Item'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Items List */}
                  <div className="lg:col-span-2">
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl group hover:border-zinc-300 transition-all">
                          <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-900 truncate">{item.question_text}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.answer_type}</span>
                              {item.is_mandatory && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Mandatory</span>}
                              {item.requires_photo && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Photo Required</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  question_text: item.question_text,
                                  answer_type: item.answer_type,
                                  is_mandatory: item.is_mandatory === 1,
                                  requires_photo: item.requires_photo === 1,
                                  order_no: item.order_no
                                });
                              }}
                              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-3xl">
                          <p className="text-zinc-400 text-sm italic">No items added to this checklist yet.</p>
                        </div>
                      )}
                    </div>
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
