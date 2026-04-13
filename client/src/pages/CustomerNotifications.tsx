import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import { notificationsAPI } from '../services/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

const CustomerNotifications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('customer_token');

  const load = async () => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await notificationsAPI.getAllWithToken(token);
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
    if (!token) return;
    try {
      await notificationsAPI.markReadWithToken(id, token);
      await load();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    try {
      await notificationsAPI.removeWithToken(id, token);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAll = async () => {
    if (!token) return;
    try {
      await notificationsAPI.clearAllWithToken(token);
      setItems([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Your inquiry and appointment updates</p>
          </div>
          <button onClick={clearAll} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Clear All</button>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading notifications...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-gray-600">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className={`bg-white rounded-xl shadow p-4 border ${item.read_at ? 'border-gray-200' : 'border-blue-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!item.read_at && (
                      <button onClick={() => markRead(item.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Mark Read</button>
                    )}
                    <button onClick={() => remove(item.id)} className="px-2 py-1 text-xs border rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;
