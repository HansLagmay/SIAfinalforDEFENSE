import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AgentSidebar from '../components/agent/AgentSidebar';
import AgentDashboard from '../components/agent/AgentDashboard';
import AgentInquiries from '../components/agent/AgentInquiries';
import AgentCalendar from '../components/agent/AgentCalendar';
import AgentProperties from '../components/agent/AgentProperties';
import AgentSettings from '../components/agent/AgentSettings';
import AgentNotifications from '../components/agent/AgentNotifications';
import type { User } from '../types';
import { getUser, clearSession } from '../utils/session';
import ErrorBoundary from '../components/shared/ErrorBoundary';

const AgentPortal = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = getUser('agent');
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogout = () => {
    clearSession('agent');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-gray-100 lg:overflow-hidden">
      <AgentSidebar user={user} onLogout={handleLogout} />
      
      <div className="flex-1 min-w-0 lg:h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ErrorBoundary title="Dashboard failed to load">
              <AgentDashboard user={user} />
            </ErrorBoundary>
          } />
          <Route path="/inquiries" element={
            <ErrorBoundary title="Inquiries failed to load">
              <AgentInquiries user={user} />
            </ErrorBoundary>
          } />
          <Route path="/calendar" element={
            <ErrorBoundary title="Calendar failed to load">
              <AgentCalendar user={user} />
            </ErrorBoundary>
          } />
          <Route path="/properties" element={
            <ErrorBoundary title="Properties failed to load">
              <AgentProperties />
            </ErrorBoundary>
          } />
          <Route path="/settings" element={
            <ErrorBoundary title="Settings failed to load">
              <AgentSettings />
            </ErrorBoundary>
          } />
          <Route path="/notifications" element={
            <ErrorBoundary title="Notifications failed to load">
              <AgentNotifications />
            </ErrorBoundary>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default AgentPortal;
