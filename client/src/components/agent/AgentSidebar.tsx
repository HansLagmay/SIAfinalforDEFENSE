import { NavLink } from 'react-router-dom';
import type { User } from '../../types';

interface AgentSidebarProps {
  user: User | null;
  onLogout: () => void;
}

const AgentSidebar = ({ user, onLogout }: AgentSidebarProps) => {
  return (
    <div className="w-full lg:w-64 lg:min-w-64 bg-gray-800 text-white flex flex-col lg:h-screen lg:overflow-hidden lg:sticky lg:top-0">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">TES Property</h1>
        <p className="text-sm text-gray-400 mt-1">Agent Portal</p>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Logged in as</p>
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 overflow-hidden">
        <NavLink
          to="/agent/dashboard"
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
          to="/agent/inquiries"
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
          My Inquiries
        </NavLink>

        <NavLink
          to="/agent/calendar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Calendar
        </NavLink>

        <NavLink
          to="/agent/properties"
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
          to="/agent/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17a1 1 0 00-1.98 0l-.18 1.06a1 1 0 01-1.45.72l-.94-.5a1 1 0 00-1.36.37l-.99 1.72a1 1 0 00.36 1.36l.94.5a1 1 0 010 1.76l-.94.5a1 1 0 00-.36 1.36l.99 1.72a1 1 0 001.36.37l.94-.5a1 1 0 011.45.72l.18 1.06a1 1 0 001.98 0l.18-1.06a1 1 0 011.45-.72l.94.5a1 1 0 001.36-.37l.99-1.72a1 1 0 00-.36-1.36l-.94-.5a1 1 0 010-1.76l.94-.5a1 1 0 00.36-1.36l-.99-1.72a1 1 0 00-1.36-.37l-.94.5a1 1 0 01-1.45-.72l-.18-1.06zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Settings
        </NavLink>

        <NavLink
          to="/agent/notifications"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
            <path d="M8 15a2 2 0 104 0H8z" />
          </svg>
          Notifications
        </NavLink>
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

export default AgentSidebar;
