import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';
import Home from './components/Home';
import Sites from './components/Sites';
import SiteDetail from './components/SiteDetail';
import WarehouseView from './components/WarehouseView';
import ApprovalsView from './components/ApprovalsView';
import AIHelp from './components/AIHelp';
import ChecklistFill from './components/ChecklistFill';
import AdminPanel from './components/AdminPanel';
import ReportsView from './components/ReportsView';
import TeamView from './components/TeamView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (user.role === 'Vendor') {
    return <VendorDashboard />;
  }

  return (
    <Dashboard>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/sites/:siteId/checklist/:stageId" element={<ChecklistFill />} />
        <Route path="/warehouse" element={<WarehouseView />} />
        <Route path="/approvals" element={<ApprovalsView />} />
        <Route path="/ai-brain" element={<AIHelp />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/team" element={<TeamView />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Dashboard>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
