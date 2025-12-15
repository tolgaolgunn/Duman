import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

type NotificationItem = {
  _id: string;
  message: string;
  link?: string;
  isRead?: boolean;
  sender?: { username?: string; avatar?: string } | null;
  createdAt?: string;
  type?: string;
  meta?: any;
};

type Props = {
  compact?: boolean;
  unreadCount?: number;
};

export const NotificationBell: React.FC<Props> = ({ compact = false, unreadCount: externalUnreadCount }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  const internalUnreadCount = notifications.filter(n => !n.isRead).length;
  const displayUnreadCount = typeof externalUnreadCount === 'number' ? externalUnreadCount : internalUnreadCount;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      const API_BASE = (import.meta as any).env?.VITE_API_BASE as string || '';
      const url = API_BASE ? `${API_BASE}/api/notifications` : '/api/notifications';

      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      const text = await res.text().catch(() => '');
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { notifications: [] }; }

      if (res.ok) {
        // route returns { success: true, notifications }
        const list = (data && (data.notifications || data.data || data)) || [];
        // normalize items to ensure isRead exists
        const norm = Array.isArray(list) ? list.map((n: any) => ({
          _id: n._id || n.id,
          message: n.message || '',
          link: n.link || '#',
          isRead: !!n.isRead,
          sender: n.sender || null,
          createdAt: n.createdAt || n.created_at || null,
          type: n.type || 'system',
          meta: n.meta || {}
        })) : [];
        setNotifications(norm);
        const initialUnread = norm.filter((x: any) => !x.isRead).length;
        try { window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { unreadCount: initialUnread } })); } catch (e) { }
        try { localStorage.setItem('duman_unread', String(initialUnread)); } catch (e) { }
      } else {
        console.warn('Fetch notifications failed', res.status, data);
        setNotifications([]);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // click outside to close
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    let mounted = true;
    const setupSocket = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        // Fetch profile to get current user id
        const profileRes = await fetch('/api/auth/profile', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        if (!profileRes.ok) return;
        const profileJson = await profileRes.json().catch(() => null);
        const user = profileJson?.data || profileJson;
        if (!user || !user.id) return;

        // Prefer explicit backend base URL via VITE_API_BASE, otherwise default to localhost:3000
        const API_BASE = (import.meta as any).env?.VITE_API_BASE as string || 'http://localhost:3000';
        const socketUrl = API_BASE;

        const socket = io(socketUrl, { transports: ['websocket'], withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('authenticate', { userId: user.id });
        });

        const handleIncoming = (raw: any) => {
          if (!mounted) return;
          // normalize various payload shapes
          const n: NotificationItem = {
            _id: raw._id || raw.id || raw.notificationId || raw.data?.notificationId || String(Date.now()),
            message: raw.message || raw.meta?.message || raw.data?.message || raw.notification?.body || raw.body || '',
            link: raw.link || raw.meta?.link || raw.data?.link || (raw.notification && raw.notification.click_action) || '#',
            isRead: !!(raw.isRead || raw.read || raw.meta?.isRead),
            sender: raw.sender || raw.meta?.sender || null,
            createdAt: raw.createdAt || raw.meta?.createdAt || raw.data?.createdAt || new Date().toISOString(),
            type: raw.type || raw.meta?.type || 'system',
            meta: raw.meta || raw.data || {}
          };
          setNotifications(prev => {
            const next = [n, ...prev];
            const unread = next.filter((x: any) => !x.isRead).length;
            try { window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { unreadCount: unread } })); } catch (e) { }
            try { localStorage.setItem('duman_unread', String(unread)); } catch (e) { }
            return next;
          });
        };

        socket.on('newNotification', handleIncoming);
        socket.on('notification', handleIncoming);

      } catch (e) {
        console.warn('Socket setup failed', e);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      try { socketRef.current?.disconnect(); } catch (e) { }
    };
  }, []);

  // Fetch notifications once on mount so compact badge shows unread count immediately
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickNotif = async (n: NotificationItem) => {
    // If it's an invite, don't mark as read or navigate on body click
    // The user must use the Accept/Decline buttons
    if (n.type === 'invite') return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      // mark read
      await fetch(`/api/notifications/${n._id}/read`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
      try { window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { unreadCount: 0 } })); } catch (e) { }
      try { localStorage.setItem('duman_unread', '0'); } catch (e) { }
      setOpen(false);
      if (n.link && n.link !== '#') {
        navigate(n.link);
      }
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent, n: NotificationItem) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const roomId = n.meta?.roomId;
      if (!roomId) return;

      const res = await fetch(`/api/chat/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (res.ok) {
        // Manually mark as read since handleClickNotif ignores invites
        await fetch(`/api/notifications/${n._id}/read`, {
          method: 'PATCH',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));

        setOpen(false);
        // Navigate to /chat and pass the roomId via state so ChatRoom can pick it up
        navigate('/chat', { state: { selectedRoomId: roomId } });
      }
    } catch (err) {
      console.error('Accept invite failed', err);
    }
  };

  const handleDeclineInvite = async (e: React.MouseEvent, n: NotificationItem) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const roomId = n.meta?.roomId;
      if (!roomId) return;

      await fetch(`/api/chat/rooms/${roomId}/invite/decline`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      // Manually mark as read
      await fetch(`/api/notifications/${n._id}/read`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
    } catch (err) {
      console.error('Decline invite failed', err);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    try { window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { unreadCount: 0 } })); } catch (e) { }
    try { localStorage.setItem('duman_unread', '0'); } catch (e) { }

    // API call
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/notifications/markAllRead', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
      }
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  // Compact render: just an icon matching other menu icons
  if (compact) {
    return (
      <span className="relative inline-flex items-center justify-center w-6 h-6 flex-shrink-0">
        <Bell className="w-5 h-5 text-gray-500 flex-shrink-0" />
        {displayUnreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 flex items-center justify-center h-5 text-[10px] font-bold rounded-full z-10 border-2 border-white leading-none ${displayUnreadCount > 9 ? 'min-w-[20px] px-1' : 'w-5 p-0'}`}
            style={{ backgroundColor: '#dc2626', color: 'white', transform: 'translate(40%, -40%)' }}
          >
            {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
          </span>
        )}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        title="Bildirimler"
        className="relative px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {displayUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {displayUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-2 border-b font-semibold">Bildirimler</div>
          <div className="max-h-64 overflow-auto">
            {loading && <div className="p-3">Yükleniyor...</div>}
            {!loading && notifications.length === 0 && <div className="p-3">Bildirim yok</div>}
            {!loading && notifications.map(n => (
              <div key={n._id}
                onClick={() => handleClickNotif(n)}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${n.isRead ? 'bg-white' : 'bg-gray-50'} flex items-center justify-between gap-3`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.sender?.username || 'Sistem'}</div>
                  <div className="text-xs text-gray-600">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                </div>

                {n.type === 'invite' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={(e) => handleAcceptInvite(e, n)}
                      className="px-3 py-1 text-xs text-green-600 hover:bg-gray-100 rounded-md"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={(e) => handleDeclineInvite(e, n)}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-gray-100 rounded-md"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 text-center">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600"
            >Tümünü okundu yap</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
