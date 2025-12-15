import React, { useEffect, useState } from 'react';
import NotificationBell from '../../components/NotificationBell';

interface NotificationItem {
  _id: string;
  message: string;
  link?: string;
  isRead?: boolean;
  sender?: { username?: string; avatar?: string } | null;
  createdAt?: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) setNotifications(json.notifications || []);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Bildirimler</h2>
      <div className="mb-6">
        <NotificationBell />
      </div>
      <div className="bg-white border rounded-md">
        {loading && <div className="p-4 text-gray-600">Yükleniyor...</div>}
        {!loading && notifications.length === 0 && <div className="p-4 text-gray-600">Henüz bildirim yok</div>}
        {!loading && notifications.map(n => (
          <div key={n._id} className={`p-3 border-b ${n.isRead ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="text-sm font-medium">{n.sender?.username || 'Sistem'}</div>
            <div className="text-xs text-gray-600">{n.message}</div>
            <div className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
