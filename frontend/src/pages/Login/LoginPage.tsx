import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (username: string, password: string) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      onLogin(username, password);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img src="/duman.svg" alt="Duman Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-gray-800 text-3xl font-bold">Duman</h1>
          <p className="text-gray-600 mt-2">Hesabınıza giriş yapın</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                Kullanıcı Adı veya E-posta
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="kullanici_adi veya email@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                  placeholder="Şifrenizi girin"
                  required
                />
                {/* Show Password Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-gray-600 bg-gray-50 border-gray-300 rounded focus:ring-gray-600 focus:ring-2"
                />
                <span className="ml-2 text-gray-600 text-sm">Beni hatırla</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Şifremi unuttum
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Hesabınız yok mu?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-gray-800 hover:underline font-medium"
              >
                Kayıt olun
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
