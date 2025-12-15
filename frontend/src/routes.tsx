import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createBrowserRouter, RouterProvider, useNavigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/Home/HomePage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { ChatRoom } from './pages/Chat/ChatRoom';
import { TrendingPage } from './pages/Trending/TrendingPage';
import { TrendingPostsPage } from './pages/Trending/TrendingPostsPage';
import { PostDetailPage } from './pages/Post/PostDetailPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import { ForgotPasswordPage } from './pages/Login/ForgotPasswordPage';
import ResetPasswordPage from './pages/Login/ResetPasswordPage';
import { Sidebar } from './components/Sidebar';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import PremiumPage from './pages/Premium/PremiumPage';
import PaymentSuccessPage from './pages/Premium/PaymentSuccessPage';

// Layout component that includes sidebar
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const currentPage = location.pathname.slice(1) || 'home';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'} p-6`}>
        {children}
      </main>
    </div>
  );
};

// Auth wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage for authentication state
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (username: string, email: string, password: string) => {
    console.log('Login attempt:', { username, email, password });
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/home');
  };

  const handleRegister = (userData: any) => {
    console.log('Registration attempt:', userData);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/home');
  };

  const handleResetPassword = (email: string) => {
    console.log('Password reset requested for:', email);
  };

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  // If not authenticated and not on auth pages, redirect to login
  if (!isAuthenticated && !location.pathname.includes('/login') &&
    !location.pathname.includes('/register') &&
    !location.pathname.includes('/forgot-password')) {
    navigate('/login');
    return null;
  }

  // If on auth pages, render without layout
  if (location.pathname.includes('/login') ||
    location.pathname.includes('/register') ||
    location.pathname.includes('/forgot-password')) {
    return <>{children}</>;
  }

  // For authenticated pages, wrap with layout
  return <Layout>{children}</Layout>;
};

// Wrapper components for auth pages
const LoginPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  // Base URL for API. Prefer Vite env var VITE_API_BASE, otherwise default to backend port 3000
  const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';

  const handleLogin = async (username: string, password: string) => {
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';

      console.log('Attempting login to:', `${API_BASE}/api/auth/login`);

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username,
          password
        })
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        // Read response text to show backend error details
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = { error: text }; }

        // Map common status codes to friendly messages and show toast
        if (res.status === 404) {
          const msg = data?.error || 'API endpoint bulunamadı. Backend servisi çalışıyor mu?';
          toast.error(msg);
          throw new Error(msg);
        }
        if (res.status === 401) {
          // Authentication failed (wrong email or password)
          const serverMsg = data?.error || 'E-posta veya şifre hatalı';
          toast.error(serverMsg);
          throw new Error(serverMsg);
        }
        const otherMsg = data?.error || `HTTP ${res.status}: Giriş başarısız`;
        toast.error(otherMsg);
        throw new Error(otherMsg);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Save token and mark authenticated (standardized key: 'token')
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Giriş başarılı');
        navigate('/home');
      } else {
        throw new Error('Token alınamadı');
      }

    } catch (err: any) {
      console.error('Login failed:', err);
      // Network error
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        const msg = 'Sunucuya bağlanılamıyor. Backend servisi çalıştığınızdan emin olun.';
        toast.error(msg);
        throw new Error(msg);
      }
      // If we already showed a toast above, rethrow so the UI also receives the error
      throw new Error(err?.message || 'Giriş sırasında beklenmeyen bir hata oluştu');
    }
  };

  return (
    <LoginPage
      onNavigate={handleNavigate}
      onLogin={handleLogin}
    />
  );
};

const RegisterPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  const handleRegister = (userData: any) => {
    console.log('Registration attempt:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/home');
  };

  return (
    <RegisterPage
      onNavigate={handleNavigate}
      onRegister={handleRegister}
    />
  );
};

const ForgotPasswordPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  const handleResetPassword = async (email: string) => {
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const text = await res.text();
        let data = {} as any;
        try { data = JSON.parse(text); } catch { data = { error: text }; }
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      return;
    } catch (err: any) {
      console.error('Forgot password failed', err);
      throw new Error(err?.message || 'Şifre sıfırlama sırasında hata oluştu');
    }
  };

  return (
    <ForgotPasswordPage
      onNavigate={handleNavigate}
      onResetPassword={handleResetPassword}
    />
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPageWrapper />,
  },
  {
    path: '/home',
    element: (
      <AuthWrapper>
        <HomePage />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile',
    element: (
      <AuthWrapper>
        <ProfilePage />
      </AuthWrapper>
    ),
  },
  {
    // Allow visiting another user's profile by id: /profile/:userId
    path: '/profile/:userId',
    element: (
      <AuthWrapper>
        <ProfilePage />
      </AuthWrapper>
    ),
  },
  {
    path: '/chat',
    element: (
      <AuthWrapper>
        <ChatRoom />
      </AuthWrapper>
    ),
  },
  {
    path: '/trending',
    element: (
      <AuthWrapper>
        <TrendingPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/trending/trendingposts/:topic?',
    element: (
      <AuthWrapper>
        <TrendingPostsPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/premium',
    element: (
      <AuthWrapper>
        <PremiumPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/payment/success',
    element: (
      <AuthWrapper>
        <PaymentSuccessPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/notifications',
    element: (
      <AuthWrapper>
        <NotificationsPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/post/:postId',
    element: (
      <AuthWrapper>
        <PostDetailPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/settings',
    element: (
      <AuthWrapper>
        <SettingsPage />
      </AuthWrapper>
    ),
  },
  {
    path: '/login',
    element: <LoginPageWrapper />,
  },
  {
    path: '/register',
    element: <RegisterPageWrapper />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPageWrapper />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  }
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
