import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Globe, 
  Bell, 
  Lock, 
  LogOut,
  Camera,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileView() {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(user?.language_preference || 'English');

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-600 text-3xl font-bold">
                {user?.full_name?.charAt(0)}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-zinc-900">{user?.full_name}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">
                  <Shield className="w-3 h-3" />
                  {user?.role}
                </span>
                {user?.phone_verified && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact Information</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</div>
                  <div className="text-sm text-zinc-900">{user?.email}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
            <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</div>
                  <div className="text-sm text-zinc-900">{user?.phone || 'Not provided'}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Preferences</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Language</div>
                  <div className="text-sm text-zinc-900">{language}</div>
                </div>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-100 border-none rounded-lg text-xs font-bold uppercase tracking-wider px-3 py-1.5 focus:ring-2 focus:ring-zinc-900"
              >
                <option value="English">English</option>
                <option value="Bengali">Bengali</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notifications</div>
                  <div className="text-sm text-zinc-900">Push & Email Enabled</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
            <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Security</div>
                  <div className="text-sm text-zinc-900">Change Password</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
