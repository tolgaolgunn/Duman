import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  const isActive = (path: string) => {
    return location.pathname === `/${path}` || (path === 'home' && location.pathname === '/');
  };

  const menuItems = [
    { id: 'home', label: 'Ana Sayfa', path: 'home' },
    { id: 'profile', label: 'Profil', path: 'profile' },
    { id: 'chat', label: 'Sohbet', path: 'chat' },
    { id: 'trending', label: 'Trendler', path: 'trending' },
    { id: 'settings', label: 'Ayarlar', path: 'settings' },
  ];

  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavigate(item.path)}
          className={`px-4 py-2 rounded-lg transition-all ${
            isActive(item.path)
              ? 'bg-gray-100 text-gray-800'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {item.label}
        </button>
      ))}
      {/* Notification bell on the right side */}
      <div className="ml-2">
        {/* lazy load to avoid circular imports in some setups */}
        <React.Suspense fallback={<div>...</div>}>
          {/* @ts-ignore */}
          <NotificationBellLazy />
        </React.Suspense>
      </div>
    </nav>
  );
};

// Lazy-load NotificationBell to avoid importing in every file
const NotificationBellLazy = React.lazy(() => import('./NotificationBell'));
