import { useEffect, useState } from 'react';
import { notificationsAPI } from '../../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

const AgentNotifications = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setItems(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const intervalId = window.setInterval(load, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const markRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Notifications</h1>
      <p className="text-gray-600 mb-6">Inquiry assignments and status alerts</p>

      {loading ? (
        <div>Loading notifications...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-600">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`bg-white rounded-lg shadow p-4 border ${item.read_at ? 'border-gray-200' : 'border-blue-300'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.read_at && (
                  <button onClick={() => markRead(item.id)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentNotifications;
