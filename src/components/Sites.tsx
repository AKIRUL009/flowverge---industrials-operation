import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  MapPin, 
  User, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  Upload,
  Download,
  FileSpreadsheet,
  List,
  Map as MapIcon
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function Sites() {
  const { token, user } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [uploading, setUploading] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    site_custom_id: '',
    name: '',
    district: '',
    client: '',
    client_site_id: '',
    location: '',
    latitude: '',
    longitude: '',
    supervisor_id: '',
    vendor_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, usersData] = await Promise.all([
          api.get('/api/sites', token!),
          api.get('/api/admin/users', token!)
        ]);
        
        const sitesList = Array.isArray(sitesData) ? sitesData : [];
        const usersList = Array.isArray(usersData) ? usersData : [];

        setSites(sitesList);
        setSupervisors(usersList.filter((u: any) => u.role === 'Supervisor'));
        setVendors(usersList.filter((u: any) => u.role === 'Vendor'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Site data:', formData);
    try {
      await api.post('/api/sites', {
        ...formData,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        current_stage_id: 1 // Default to Survey stage
      }, token!);
      setShowNewModal(false);
      setFormData({ 
        project_id: '',
        site_custom_id: '',
        name: '',
        district: '',
        client: '',
        client_site_id: '',
        location: '',
        latitude: '',
        longitude: '',
        supervisor_id: '',
        vendor_id: ''
      });
      const data = await api.get('/api/sites', token!);
      setSites(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['project_id', 'Site_Id', 'Site_Name', 'District', 'Latitude', 'Longitude', 'Client Name', 'Client_site_Id', 'Location'];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sites_bulk_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const mappedData = results.data.map((row: any) => ({
            project_id: row.project_id,
            site_custom_id: row.Site_Id,
            name: row.Site_Name,
            district: row.District,
            latitude: row.Latitude ? Number(row.Latitude) : null,
            longitude: row.Longitude ? Number(row.Longitude) : null,
            client: row['Client Name'],
            client_site_id: row.Client_site_Id,
            location: row.Location || ''
          }));

          await api.post('/api/sites/bulk', mappedData, token!);
          const data = await api.get('/api/sites', token!);
          setSites(Array.isArray(data) ? data : []);
          setShowBulkModal(false);
          alert(`Successfully uploaded ${mappedData.length} sites`);
        } catch (err) {
          console.error(err);
          alert('Failed to upload sites. Please check the file format.');
        } finally {
          setUploading(false);
        }
      }
    });
  };

  const filteredSites = sites.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.client.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sites Management</h1>
          <p className="text-sm text-zinc-500">Overview of all active solar installations</p>
        </div>
        {['Admin', 'Project Manager'].includes(user?.role || '') && (
          <div className="flex gap-2">
            <Link 
              to="/sheets"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets</span>
            </Link>
            <button 
              id="bulk-upload-btn"
              onClick={() => setShowBulkModal(true)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload</span>
            </button>
            <button 
              id="new-site-btn"
              onClick={() => setShowNewModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/10"
            >
              <Plus className="w-5 h-5" />
              <span>New Site</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-xl font-bold text-zinc-900">Bulk Upload Sites</h3>
              <p className="text-sm text-zinc-500">Upload multiple sites using a CSV file</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Download Template</p>
                  <p className="text-xs text-emerald-700 mb-3">Use our CSV format to ensure data is imported correctly.</p>
                  <button 
                    id="download-template-btn"
                    onClick={handleDownloadTemplate}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV Template
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Upload File</label>
                <div className="relative group">
                  <input
                    id="bulk-upload-input"
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  <div className={`
                    border-2 border-dashed rounded-2xl p-8 text-center transition-all
                    ${uploading ? 'bg-zinc-50 border-zinc-200' : 'border-zinc-200 group-hover:border-emerald-500 group-hover:bg-emerald-50/30'}
                  `}>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${uploading ? 'text-zinc-300 animate-bounce' : 'text-zinc-400 group-hover:text-emerald-500'}`} />
                    <p className="text-sm font-bold text-zinc-900">
                      {uploading ? 'Uploading...' : 'Click or drag to upload CSV'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Only .csv files are supported</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBulkModal(false)}
                className="w-full py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Site Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-xl font-bold text-zinc-900">Create New Site</h3>
              <p className="text-sm text-zinc-500">Initialize a new solar installation project</p>
            </div>
            <form onSubmit={handleCreateSite} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Project ID</label>
                  <input
                    required
                    type="text"
                    value={formData.project_id}
                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="PRJ-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Site ID</label>
                  <input
                    required
                    type="text"
                    value={formData.site_custom_id}
                    onChange={e => setFormData({ ...formData, site_custom_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="SITE-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Site Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="e.g. Green Valley Solar Farm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">District</label>
                  <input
                    required
                    type="text"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="District Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Client Site ID</label>
                  <input
                    type="text"
                    value={formData.client_site_id}
                    onChange={e => setFormData({ ...formData, client_site_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="C-SITE-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="23.1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="72.5678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Client Name</label>
                <input
                  required
                  type="text"
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="e.g. EcoPower Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Location/Address</label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="Full Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Supervisor</label>
                  <select
                    required
                    value={formData.supervisor_id}
                    onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="">Select...</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Vendor</label>
                  <select
                    required
                    value={formData.vendor_id}
                    onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="">Select...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/10"
                >
                  Create Site
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search sites, clients, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <div className="bg-zinc-100 p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
          <button className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 flex items-center gap-2 hover:bg-zinc-50 transition-all">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSites.map((site, i) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{site.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{site.client}</p>
                        {site.site_custom_id && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{site.site_custom_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {site.is_delayed && (
                      <div className="bg-red-50 p-1.5 rounded-lg border border-red-100">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <span>{site.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>{site.supervisor_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span>Started: {new Date(site.stage_started_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current Stage</span>
                      <span className="text-sm font-bold text-zinc-900">{site.stage_name}</span>
                    </div>
                    <Link 
                      to={`/sites/${site.id}`}
                      className="bg-zinc-100 hover:bg-emerald-500 hover:text-white p-2 rounded-xl transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm h-[600px] relative z-0"
          >
            <MapContainer 
              center={filteredSites.find(s => s.latitude && s.longitude) ? [filteredSites.find(s => s.latitude && s.longitude).latitude, filteredSites.find(s => s.latitude && s.longitude).longitude] : [22.0, 78.0]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredSites.filter(s => s.latitude && s.longitude).map(site => (
                <Marker key={site.id} position={[site.latitude, site.longitude]}>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-zinc-900 mb-1">{site.name}</h3>
                      <p className="text-xs text-zinc-500 mb-2">{site.client}</p>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <MapPin className="w-3 h-3" />
                          <span>{site.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <User className="w-3 h-3" />
                          <span>{site.supervisor_name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/sites/${site.id}`}
                        className="block w-full text-center bg-emerald-600 text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500 transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredSites.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
            <MapPin className="w-8 h-8 text-zinc-300" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">No sites found</h3>
          <p className="text-zinc-500 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
