import React from 'react';
import { Home, User, MessageCircle, TrendingUp, Settings, LogOut, Sparkles } from 'lucide-react';
import { currentUser } from '../lib/mockData';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isOpen = true, onToggle }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'chat', label: 'Sohbet Odaları', icon: MessageCircle },
    { id: 'trending', label: 'Trendler', icon: TrendingUp },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
            <span className="text-white">💨</span>
          </div>
          {isOpen && <h1 className="text-gray-800 flex-1">Duman</h1>}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all"
            >
              {isOpen ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {isOpen && (
        <div className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onNavigate('profile')}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">{currentUser.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-gray-900 truncate">@{currentUser.username}</p>
                {currentUser.isPremium && (
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-gray-500 text-sm">{currentUser.followers.length} takipçi</p>
            </div>
          </div>  
        </div>
      )}
      
      {/* Collapsed User Avatar */}
      {!isOpen && (
        <div className="p-4 border-b border-gray-100 flex justify-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onNavigate('profile')}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">{currentUser.avatar}</span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gray-100 text-gray-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-gray-800' : 'text-gray-500'}`} />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Premium Banner */}
      {!currentUser.isPremium && isOpen && (
        <div className="m-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 mb-1">Premium'a Geç</p>
              <p className="text-gray-600 text-sm mb-3">
                AI asistanı ve daha fazlası
              </p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all">
                Yükselt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Collapsed Premium Icon */}
      {!currentUser.isPremium && !isOpen && (
        <div className="m-3 flex justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all`}
          title={!isOpen ? 'Çıkış Yap' : undefined}
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          {isOpen && <span>Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );
}
