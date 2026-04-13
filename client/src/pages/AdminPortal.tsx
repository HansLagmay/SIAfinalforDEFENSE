import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProperties from '../components/admin/AdminProperties';
import AdminInquiries from '../components/admin/AdminInquiries';
import AdminAgents from '../components/admin/AdminAgents';
import AdminReports from '../components/admin/AdminReports';
import AdminCommissions from '../components/admin/AdminCommissions';
import AdminLicenseCompliance from '../components/admin/AdminLicenseCompliance';
import AdminCustomerModeration from '../components/admin/AdminCustomerModeration';
import { AdminPropertyAssignment } from '../components/admin/AdminPropertyAssignment';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import type { User } from '../types';
import { getUser, clearSession } from '../utils/session';

const AdminPortal = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = getUser('admin');
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogout = () => {
    clearSession('admin');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-gray-100 lg:overflow-hidden">
      <AdminSidebar user={user} onLogout={handleLogout} />
      
      <div className="flex-1 min-w-0 lg:h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ErrorBoundary title="Dashboard failed to load">
              <AdminDashboard />
            </ErrorBoundary>
          } />
          <Route path="/properties" element={
            <ErrorBoundary title="Properties failed to load">
              <AdminProperties />
            </ErrorBoundary>
          } />
          <Route path="/inquiries" element={
            <ErrorBoundary title="Inquiries failed to load">
              <AdminInquiries />
            </ErrorBoundary>
          } />
          <Route path="/agents" element={
            <ErrorBoundary title="Agents failed to load">
              <AdminAgents />
            </ErrorBoundary>
          } />
          <Route path="/reports" element={
            <ErrorBoundary title="Reports failed to load">
              <AdminReports />
            </ErrorBoundary>
          } />
          <Route path="/commissions" element={
            <ErrorBoundary title="Commissions failed to load">
              <AdminCommissions />
            </ErrorBoundary>
          } />
          <Route path="/licenses" element={
            <ErrorBoundary title="License report failed to load">
              <AdminLicenseCompliance />
            </ErrorBoundary>
          } />
          <Route path="/customer-moderation" element={
            <ErrorBoundary title="Customer moderation failed to load">
              <AdminCustomerModeration />
            </ErrorBoundary>
          } />
          <Route path="/property-assignment" element={
            <ErrorBoundary title="Property assignment failed to load">
              <AdminPropertyAssignment />
            </ErrorBoundary>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPortal;
