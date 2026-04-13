import { NavLink, useNavigate } from 'react-router-dom';
import type { User } from '../../types';
import SessionSwitcher from '../shared/SessionSwitcher';

interface AdminSidebarProps {
  user: User | null;
  onLogout: () => void;
}

const AdminSidebar = ({ user, onLogout }: AdminSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full lg:w-64 lg:min-w-64 bg-gray-800 text-white flex flex-col lg:h-screen lg:overflow-hidden lg:sticky lg:top-0">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">TES Property</h1>
        <p className="text-sm text-gray-400 mt-1">Admin Portal</p>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Logged in as</p>
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          
          {/* Session Switcher for multi-account demo */}
          <SessionSwitcher role="admin" currentUser={user} />
        </div>
      )}

      <nav className="flex-1 p-4 overflow-hidden">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/inquiries"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Inquiries
        </NavLink>

        <NavLink
          to="/admin/properties"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Properties
        </NavLink>

        <NavLink
          to="/admin/property-assignment"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 8a2 2 0 11-4 0 2 2 0 014 0zM6 15a3 3 0 00-3 3v2h8v-2a3 3 0 00-3-3H6z" />
          </svg>
          Property Assignment
        </NavLink>

        <NavLink
          to="/admin/agents"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Agents
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Agent Performance
        </NavLink>

        <NavLink
          to="/admin/commissions"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.09A5.002 5.002 0 0115 9v5a2 2 0 01-2 2H7a2 2 0 01-2-2V9a5.002 5.002 0 014-4.91V3a1 1 0 011-1z" />
          </svg>
          Payroll and Commissions
        </NavLink>

        <NavLink
          to="/admin/licenses"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 01.447.105l6 3A1 1 0 0117 6v4c0 4.418-3.582 7.5-7 8-3.418-.5-7-3.582-7-8V6a1 1 0 01.553-.895l6-3A1 1 0 0110 2zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          License Compliance
        </NavLink>

        <NavLink
          to="/admin/customer-moderation"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a4 4 0 110 8 4 4 0 010-8zM2 16a6 6 0 1112 0v1H2v-1zm13-3h3v2h-3v-2zm0 3h3v2h-3v-2z" />
          </svg>
          Customer Moderation
        </NavLink>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/superadmin')}
            className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-300 hover:bg-gray-700 transition w-full"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Agent Registration →
          </button>
          
          <button
            onClick={() => navigate('/database')}
            className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-300 hover:bg-gray-700 transition w-full"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
            Database Portal 🗄️
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center px-4 py-3 rounded-lg text-red-400 hover:bg-gray-700 transition w-full"
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
