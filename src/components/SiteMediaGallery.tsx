import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Filter, Search, Loader2, MapPin, Calendar, User, Clock, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SiteMediaGallery() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [siteFilter, setSiteFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dropdown options
  const [sites, setSites] = useState<{id: number, name: string}[]>([]);
  const [stages, setStages] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/media', token!);
        setMediaItems(data);

        // Extract unique sites and stages for filters
        const uniqueSites = new Map();
        const uniqueStages = new Map();
        
        data.forEach((item: any) => {
          if (!uniqueSites.has(item.site_id)) {
            uniqueSites.set(item.site_id, { id: item.site_id, name: item.site_name });
          }
          if (!uniqueStages.has(item.stage_id)) {
            uniqueStages.set(item.stage_id, { id: item.stage_id, name: item.stage_name });
          }
        });

        setSites(Array.from(uniqueSites.values()));
        setStages(Array.from(uniqueStages.values()));

      } catch (err) {
        console.error('Failed to fetch media:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredMedia = mediaItems.filter(item => {
    if (siteFilter && item.site_id.toString() !== siteFilter) return false;
    if (stageFilter && item.stage_id.toString() !== stageFilter) return false;
    if (dateFilter) {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      if (itemDate !== dateFilter) return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            Site Media
          </h1>
          <p className="text-zinc-500 mt-1">
            Aggregate view of all photos uploaded across project sites and stages.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Sites</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Stages</option>
          {stages.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {(siteFilter || stageFilter || dateFilter) && (
          <button
            onClick={() => {
              setSiteFilter('');
              setStageFilter('');
              setDateFilter('');
            }}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
            <ImageIcon className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">No media found</h3>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Try adjusting your filters or wait for technicians to upload photos during checklist submissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.map((item, index) => {
            const meta = item.photo_metadata ? (typeof item.photo_metadata === 'string' ? JSON.parse(item.photo_metadata) : item.photo_metadata) : null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.answer_id}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                  <img
                    src={item.photo_data}
                    alt={item.question_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {item.stage_name}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="font-bold text-zinc-900 text-sm line-clamp-2 mb-2" title={item.question_text}>
                    {item.question_text}
                  </h4>
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate" title={item.site_name}>{item.site_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date ? new Date(item.date).toLocaleDateString() : 'Unknown Date'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{item.uploader_name}</span>
                      </div>
                      {meta?.latitude && (
                        <div className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                          GPS
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/sites/${item.site_id}`)}
                  className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 border-t border-zinc-200 text-xs font-bold text-zinc-600 transition-colors flex items-center justify-center gap-1"
                >
                  View Site
                  <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
