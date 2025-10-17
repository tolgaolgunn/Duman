import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
  onResetPassword: (email: string) => void;
}

export function ForgotPasswordPage({ onNavigate, onResetPassword }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate password reset process
    setTimeout(() => {
      onResetPassword(email);
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">💨</span>
            </div>
            <h1 className="text-gray-800 text-3xl font-bold">Duman</h1>
          </div>

          {/* Success Message */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-gray-900 text-xl font-semibold mb-2">E-posta Gönderildi!</h2>
            <p className="text-gray-600 mb-6">
              Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              E-postanızı kontrol edin ve bağlantıya tıklayarak yeni şifrenizi oluşturun.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('login')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Giriş Sayfasına Dön
              </button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all"
              >
                Tekrar Gönder
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana sayfaya dön</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💨</span>
          </div>
          <h1 className="text-gray-800 text-3xl font-bold">Duman</h1>
          <p className="text-gray-600 mt-2">Şifrenizi mi unuttunuz?</p>
        </div>

        {/* Reset Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-gray-600" />
            </div>
            <h2 className="text-gray-900 text-xl font-semibold mb-2">Şifre Sıfırlama</h2>
            <p className="text-gray-600 text-sm">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Şifrenizi hatırladınız mı?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-gray-800 hover:underline font-medium"
              >
                Giriş yapın
              </button>
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana sayfaya dön</span>
          </button>
        </div>
      </div>
    </div>
  );
}
