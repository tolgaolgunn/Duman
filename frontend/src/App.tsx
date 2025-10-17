import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/Home/HomePage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { ChatRoom } from './components/ChatRoom';
import { TrendingPage } from './pages/Trending/TrendingPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import { ForgotPasswordPage } from './pages/Login/ForgotPasswordPage';

type Page = 'home' | 'profile' | 'chat' | 'trending' | 'settings' | 'login' | 'register' | 'forgot-password';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Demo için true başlatıyoruz
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogin = (username: string, password: string) => {
    // Demo login - gerçek uygulamada API call yapılır
    console.log('Login attempt:', { username, password });
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleRegister = (userData: any) => {
    // Demo registration - gerçek uygulamada API call yapılır
    console.log('Registration attempt:', userData);
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const handleResetPassword = (email: string) => {
    // Demo password reset - gerçek uygulamada API call yapılır
    console.log('Password reset requested for:', email);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'profile':
        return <ProfilePage />;
      case 'chat':
        return <ChatRoom />;
      case 'trending':
        return <TrendingPage />;
      case 'settings':
        return <SettingsPage />;
      case 'login':
        return <LoginPage onNavigate={(p: string) => setCurrentPage(p as Page)} onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage onNavigate={(p: string) => setCurrentPage(p as Page)} onRegister={handleRegister} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={(p: string) => setCurrentPage(p as Page)} onResetPassword={handleResetPassword} />;
      default:
        return <HomePage />;
    }
  };

  // Authentication gerekli sayfalar için kontrol
  if (!isAuthenticated && !['login', 'register', 'forgot-password'].includes(currentPage)) {
    setCurrentPage('login');
  }

  // Auth sayfaları için tam ekran göster
  if (['login', 'register', 'forgot-password'].includes(currentPage)) {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={(p: string) => setCurrentPage(p as Page)} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'} p-6`}>
        {renderPage()}
      </main>
    </div>
  );
}
