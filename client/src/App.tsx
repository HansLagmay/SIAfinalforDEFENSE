import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './pages/CustomerPortal';
import CustomerAppointments from './pages/CustomerAppointments';
import CustomerProfile from './pages/CustomerProfile';
import CustomerFavorites from './pages/CustomerFavorites';
import CustomerPreferences from './pages/CustomerPreferences';
import CustomerNotifications from './pages/CustomerNotifications';
import LoginPage from './pages/LoginPage';
import AdminPortal from './pages/AdminPortal';
import AgentPortal from './pages/AgentPortal';
import SuperAdminPortal from './pages/SuperAdminPortal';
import DatabasePortal from './pages/DatabasePortal';
import ProtectedRoute from './components/shared/ProtectedRoute';
import CustomerProtectedRoute from './components/shared/CustomerProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Customer Protected Routes */}
        <Route
          path="/appointments"
          element={
            <CustomerProtectedRoute>
              <CustomerAppointments />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <CustomerProtectedRoute>
              <CustomerProfile />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <CustomerProtectedRoute>
              <CustomerFavorites />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/preferences"
          element={
            <CustomerProtectedRoute>
              <CustomerPreferences />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <CustomerProtectedRoute>
              <CustomerNotifications />
            </CustomerProtectedRoute>
          }
        />

        {/* Admin/Agent Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/*"
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SuperAdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/database"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DatabasePortal />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
