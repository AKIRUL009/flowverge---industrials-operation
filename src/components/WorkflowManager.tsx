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
  Activity,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  UserCheck,
  Users,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  UserPlus
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
    necessary_functions: '',
    assigned_role: 'Site Supervisor',
    attendance_mode: 'Free for All Users',
    who_assigns_work: 'Project Manager',
    approver_role: 'Project Manager',
    required_checklist_id: ''
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

  // CSV Import State
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvTargetTemplate, setCsvTargetTemplate] = useState<any>(null); // null = create new template
  const [csvStageId, setCsvStageId] = useState<string>('');
  const [csvChecklistName, setCsvChecklistName] = useState<string>('');
  const [csvImportMode, setCsvImportMode] = useState<'append' | 'replace'>('append');
  const [csvParsedItems, setCsvParsedItems] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const downloadCSVTemplate = () => {
    const csvContent = `"Question Text","Answer Type","Mandatory","Requires Photo","Order"\n` +
      `"Is site perimeter secure with safety fencing?","Yes/No","Yes","Yes",1\n` +
      `"Soil compaction bearing test value (kPa)","Number","Yes","No",2\n` +
      `"General excavation safety observations and notes","Text","No","No",3\n` +
      `"Foundation rebar structure photo verification","Photo","Yes","Yes",4`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'checklist_items_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        cur += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (cur.trim()) lines.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    if (cur.trim()) lines.push(cur.trim());

    if (lines.length === 0) return [];

    const parseLine = (line: string) => {
      const cols: string[] = [];
      let col = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          q = !q;
        } else if (c === ',' && !q) {
          cols.push(col.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          col = '';
        } else {
          col += c;
        }
      }
      cols.push(col.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return cols;
    };

    const headerRow = parseLine(lines[0]).map(h => h.toLowerCase());
    
    let qIdx = headerRow.findIndex(h => h.includes('question') || h.includes('item') || h.includes('text'));
    if (qIdx === -1) qIdx = 0;

    let aIdx = headerRow.findIndex(h => h.includes('answer') || h.includes('type'));
    let mIdx = headerRow.findIndex(h => h.includes('mandatory') || h.includes('required'));
    let pIdx = headerRow.findIndex(h => h.includes('photo'));
    let oIdx = headerRow.findIndex(h => h.includes('order'));

    const parsedItems = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (!cols[qIdx] || !cols[qIdx].trim()) continue;

      const qText = cols[qIdx].trim();
      let aType = aIdx !== -1 && cols[aIdx] ? cols[aIdx] : 'Yes/No';
      const cleanType = String(aType).toLowerCase();
      if (cleanType.includes('photo')) aType = 'Photo';
      else if (cleanType.includes('num')) aType = 'Number';
      else if (cleanType.includes('text')) aType = 'Text';
      else aType = 'Yes/No';

      const mandatory = mIdx !== -1 && cols[mIdx] ? cols[mIdx] : 'Yes';
      const reqPhoto = pIdx !== -1 && cols[pIdx] ? cols[pIdx] : 'No';
      const orderNo = oIdx !== -1 && cols[oIdx] ? parseInt(cols[oIdx]) || i : i;

      parsedItems.push({
        question_text: qText,
        answer_type: aType,
        is_mandatory: mandatory,
        requires_photo: reqPhoto,
        order_no: orderNo
      });
    }

    return parsedItems;
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setCsvSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setCsvError('No valid checklist items detected in the CSV file. Please use the downloaded template.');
          setCsvParsedItems([]);
        } else {
          setCsvParsedItems(parsed);
        }
      } catch (err: any) {
        setCsvError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (csvParsedItems.length === 0) {
      setCsvError('Please upload a valid CSV file containing checklist questions.');
      return;
    }

    setCsvUploading(true);
    setCsvError(null);
    setCsvSuccess(null);

    try {
      if (csvTargetTemplate) {
        // Import items into existing template
        const res = await api.post(`/api/admin/checklists/${csvTargetTemplate.id}/items/bulk-csv`, {
          items: csvParsedItems,
          mode: csvImportMode
        }, token!);

        setCsvSuccess(`Successfully imported ${res.count} checklist items!`);
        fetchItems(csvTargetTemplate.id);
      } else {
        // Create new checklist template with CSV items
        if (!csvStageId || !csvChecklistName) {
          setCsvError('Please select a stage and enter a checklist name.');
          setCsvUploading(false);
          return;
        }

        const res = await api.post('/api/admin/checklists/import-csv', {
          stage_id: csvStageId,
          name: csvChecklistName,
          items: csvParsedItems
        }, token!);

        setCsvSuccess(`Created checklist '${csvChecklistName}' with ${res.count} items!`);
        fetchData();
      }

      setTimeout(() => {
        setShowCSVModal(false);
        setCsvParsedItems([]);
        setCsvFileName('');
        setCsvTargetTemplate(null);
        setCsvSuccess(null);
      }, 1200);

    } catch (err: any) {
      setCsvError(err.message || 'Failed to upload CSV items');
    } finally {
      setCsvUploading(false);
    }
  };

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
      setStageForm({ 
        name: '', 
        sequence_order: 1, 
        max_allowed_days: 7, 
        working_principle: '', 
        necessary_functions: '',
        assigned_role: 'Site Supervisor',
        attendance_mode: 'Free for All Users',
        who_assigns_work: 'Project Manager',
        approver_role: 'Project Manager',
        required_checklist_id: ''
      });
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
                setStageForm({ 
                  name: '', 
                  sequence_order: stages.length + 1, 
                  max_allowed_days: 7, 
                  working_principle: '', 
                  necessary_functions: '',
                  assigned_role: 'Site Supervisor',
                  attendance_mode: 'Free for All Users',
                  who_assigns_work: 'Project Manager',
                  approver_role: 'Project Manager',
                  required_checklist_id: ''
                });
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
                className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all space-y-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-base shadow-sm">
                      #{stage.sequence_order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-zinc-900">{stage.name}</h3>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-[11px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {stage.max_allowed_days} Days SLA
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Workflow Stage Execution Profile</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingStage(stage);
                        setStageForm({
                          name: stage.name || '',
                          sequence_order: stage.sequence_order || 1,
                          max_allowed_days: stage.max_allowed_days || 7,
                          working_principle: stage.working_principle || '',
                          necessary_functions: stage.necessary_functions || '',
                          assigned_role: stage.assigned_role || 'Site Supervisor',
                          attendance_mode: stage.attendance_mode || 'Free for All Users',
                          who_assigns_work: stage.who_assigns_work || 'Project Manager',
                          approver_role: stage.approver_role || 'Project Manager',
                          required_checklist_id: stage.required_checklist_id ? String(stage.required_checklist_id) : ''
                        });
                        setShowStageModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Configure Stage
                    </button>
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Workflow Requirement Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {/* 1. Required Checklist */}
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Required Checklist
                      </span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {stage.required_checklist_name || (templates.find(t => t.stage_id === stage.id)?.name) || 'None Assigned'}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {stage.checklist_item_count ? `${stage.checklist_item_count} questions configured` : 'Mandatory for stage completion'}
                    </p>
                  </div>

                  {/* 2. Assigned Person / Role */}
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        Assigned Person / Role
                      </span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {stage.assigned_role || 'Site Supervisor'}
                    </p>
                    <p className="text-[10px] text-zinc-500">Responsible execution personnel</p>
                  </div>

                  {/* 3. Attendance Access Mode */}
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        Attendance & Access
                      </span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {stage.attendance_mode || 'Free for All Users'}
                    </p>
                    <p className="text-[10px] text-zinc-500">Participation permission protocol</p>
                  </div>

                  {/* 4. Assignment Governance */}
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Work Assigner & Approver
                      </span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      Assigner: {stage.who_assigns_work || 'Project Manager'}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      Approver: {stage.approver_role || 'Project Manager'}
                    </p>
                  </div>
                </div>

                {(stage.working_principle || stage.necessary_functions) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Working Principle</span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {stage.working_principle || 'No working principle defined.'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Necessary Functions</span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCSVTemplate}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Download CSV Template
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCsvTargetTemplate(null);
                  setCsvStageId(stages[0]?.id ? String(stages[0].id) : '');
                  setCsvChecklistName('');
                  setCsvParsedItems([]);
                  setCsvFileName('');
                  setCsvError(null);
                  setCsvSuccess(null);
                  setShowCSVModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Import Checklist CSV
              </button>

              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ stage_id: stages[0]?.id || '', name: '', is_active: 1 });
                  setShowChecklistModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10"
              >
                <Plus className="w-3.5 h-3.5" />
                New Checklist
              </button>
            </div>
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
              <div className="p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">{editingStage ? 'Edit Stage Parameters' : 'Add New Workflow Stage'}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Configure checklists, roles, duration SLAs, and gatekeeping rules</p>
                  </div>
                  <button onClick={() => setShowStageModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleStageSubmit} className="space-y-6">
                  {/* Basic Stage Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-zinc-600" />
                      1. Basic Stage Identity & Timeframe
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stage Name</label>
                        <input
                          required
                          type="text"
                          value={stageForm.name}
                          onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          placeholder="e.g. Foundation"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sequence Order</label>
                        <input
                          required
                          type="number"
                          value={stageForm.sequence_order}
                          onChange={(e) => setStageForm({ ...stageForm, sequence_order: parseInt(e.target.value) || 1 })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Allowed Days (SLA)</label>
                        <input
                          required
                          type="number"
                          value={stageForm.max_allowed_days}
                          onChange={(e) => setStageForm({ ...stageForm, max_allowed_days: parseInt(e.target.value) || 1 })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist & Assignee Setup */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                      2. Required Checklist & Execution Responsibilities
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Required Checklist Template</label>
                        <select
                          value={stageForm.required_checklist_id}
                          onChange={(e) => setStageForm({ ...stageForm, required_checklist_id: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="">Auto / Optional Checklist</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.items_count || 0} questions)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Default Assigned Role / Person</label>
                        <select
                          value={stageForm.assigned_role}
                          onChange={(e) => setStageForm({ ...stageForm, assigned_role: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="Site Supervisor">Site Supervisor</option>
                          <option value="Vendor / Contractor">Vendor / Contractor</option>
                          <option value="Quality Inspector">Quality Inspector</option>
                          <option value="Lead Engineer">Lead Engineer</option>
                          <option value="Warehouse Executive">Warehouse Executive</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Open / Free for All Users">Open / Free for All Users</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Attendance & Participation Mode</label>
                        <select
                          value={stageForm.attendance_mode}
                          onChange={(e) => setStageForm({ ...stageForm, attendance_mode: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="Free for All Users">Free for All Users (Any site user can participate)</option>
                          <option value="Designated Role Only">Designated Role Only (Strict assignment lock)</option>
                          <option value="Dual Attendance Mandatory">Dual Attendance Mandatory (Supervisor & Vendor)</option>
                          <option value="Quality Inspector Sign-off">Quality Inspector Sign-off Required</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Who Assigns Work</label>
                        <select
                          value={stageForm.who_assigns_work}
                          onChange={(e) => setStageForm({ ...stageForm, who_assigns_work: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="Project Manager">Project Manager</option>
                          <option value="Site Supervisor">Site Supervisor</option>
                          <option value="Admin">Admin</option>
                          <option value="Auto-Assigned on Stage Advance">Auto-Assigned on Stage Advance</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stage Approval & Guidelines */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      3. Stage Gate Approval & Execution Notes
                    </h4>

                    <div className="space-y-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stage Gate Approver Role</label>
                        <select
                          value={stageForm.approver_role}
                          onChange={(e) => setStageForm({ ...stageForm, approver_role: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="Project Manager">Project Manager</option>
                          <option value="Admin">Admin</option>
                          <option value="Quality Assurance Lead">Quality Assurance Lead</option>
                          <option value="Auto-Approved on Checklist Completion">Auto-Approved on Checklist Completion</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Working Principle</label>
                          <textarea
                            value={stageForm.working_principle}
                            onChange={(e) => setStageForm({ ...stageForm, working_principle: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[80px]"
                            placeholder="Describe execution protocol..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Necessary Functions</label>
                          <textarea
                            value={stageForm.necessary_functions}
                            onChange={(e) => setStageForm({ ...stageForm, necessary_functions: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[80px]"
                            placeholder="List mandatory operational tasks..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-zinc-100">
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
                      {editingStage ? 'Save Stage Settings' : 'Create Workflow Stage'}
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
              <div className="p-6 sm:p-8 border-b border-zinc-100 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Manage Checklist Items</h3>
                    <p className="text-sm text-zinc-500">{activeTemplate?.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Template CSV
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCsvTargetTemplate(activeTemplate);
                        setCsvParsedItems([]);
                        setCsvFileName('');
                        setCsvError(null);
                        setCsvSuccess(null);
                        setShowCSVModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      Upload CSV Items
                    </button>

                    <button onClick={() => setShowItemsModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
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
      {/* CSV Import & Upload Modal */}
      <AnimatePresence>
        {showCSVModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-zinc-100 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    {csvTargetTemplate ? `Bulk Upload Items to '${csvTargetTemplate.name}'` : 'Import Checklist from CSV File'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {csvTargetTemplate 
                      ? 'Upload a CSV file to add or update items in this checklist template.' 
                      : 'Create a new checklist template and bulk import items directly from a CSV file.'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCSVModal(false)} 
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleCSVSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                {/* Template / Target Metadata */}
                {!csvTargetTemplate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Associated Stage</label>
                      <select
                        required
                        value={csvStageId}
                        onChange={(e) => setCsvStageId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      >
                        <option value="">Select Stage</option>
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New Checklist Name</label>
                      <input
                        required
                        type="text"
                        value={csvChecklistName}
                        onChange={(e) => setCsvChecklistName(e.target.value)}
                        placeholder="e.g. Concrete Quality Check"
                        className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {csvTargetTemplate && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Import Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCsvImportMode('append')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                          csvImportMode === 'append'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Append Items</span>
                          {csvImportMode === 'append' && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Add CSV items without deleting existing questions</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCsvImportMode('replace')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                          csvImportMode === 'replace'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Replace All Items</span>
                          {csvImportMode === 'replace' && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Overwrites existing questions with CSV content</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Zone */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select CSV File</label>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Standard CSV Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-zinc-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-zinc-50/50 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCSVFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileUp className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-zinc-700">
                      {csvFileName ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {csvFileName}
                        </span>
                      ) : (
                        'Click or drag & drop CSV file here'
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">Supports columns: Question Text, Answer Type, Mandatory, Requires Photo, Order</p>
                  </div>
                </div>

                {/* Messages */}
                {csvError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{csvError}</span>
                  </div>
                )}

                {csvSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{csvSuccess}</span>
                  </div>
                )}

                {/* Parsed Items Preview */}
                {csvParsedItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">
                        CSV Parsed Preview ({csvParsedItems.length} items found)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Ready to Import
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 bg-white">
                      {csvParsedItems.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 bg-zinc-100 text-zinc-500 rounded font-bold text-[10px] flex items-center justify-center shrink-0">
                              {item.order_no || idx + 1}
                            </span>
                            <span className="font-semibold text-zinc-800 truncate">{item.question_text}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[10px]">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded font-mono font-bold">{item.answer_type}</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              String(item.is_mandatory).toLowerCase() === 'yes' || item.is_mandatory === 1 ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-400'
                            }`}>
                              {String(item.is_mandatory).toLowerCase() === 'yes' || item.is_mandatory === 1 ? 'Mandatory' : 'Optional'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCSVModal(false)}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={csvUploading || csvParsedItems.length === 0}
                    className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {csvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {csvTargetTemplate ? 'Upload & Import Items' : 'Create Checklist & Import'}
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
