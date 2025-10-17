import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  interests: string[];
}

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onRegister: (userData: RegisterData) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegister }) => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    interests: []
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const interestOptions = [
    "teknoloji", "yapay zeka", "yazılım", "sanat", "tasarım", "fotoğrafçılık",
    "spor", "futbol", "fitness", "müzik", "konser", "gitar", "oyun", "e-spor",
    "sinema", "kitap", "seyahat", "yemek", "moda"
  ];

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Şifreler eşleşmiyor!');
      return false;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalıdır!');
      return false;
    }
    if (formData.interests.length < 2) {
      setErrorMessage('En az 2 ilgi alanı seçmelisiniz!');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        interests: formData.interests
      };

      const _meta: any = import.meta || {};
      const API_BASE = _meta.env?.VITE_API_URL || 'http://localhost:3000';
      const url = `${API_BASE.replace(/\/$/, '')}/api/auth/register`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (text.trim().startsWith('<!DOCTYPE html')) {
          throw new Error('Sunucudan beklenmedik bir HTML yanıtı alındı.');
        }
        data = { error: text };
      }

      if (!res.ok) throw new Error(data.error || data.message || `Kayıt başarısız (${res.status})`);

      if (data.token) localStorage.setItem('token', data.token);
      onRegister(formData);
      onNavigate('home');

    } catch (err: any) {
      setErrorMessage(err.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-auto">
      {/* Hata Mesajı Modalı */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-600 mb-3">Kayıt Hatası</h3>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl max-h-screen overflow-y-auto bg-white border border-gray-200 rounded-2xl p-8 pb-24">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💨</span>
          </div>
          <h1 className="text-gray-800 text-3xl font-bold">Duman</h1>
          <p className="text-gray-600 mt-2">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username / Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Kullanıcı Adı *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
                placeholder="kullanici_adi"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">E-posta *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Şifre *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
                  placeholder="En az 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Şifre Tekrar *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
                  placeholder="Şifrenizi tekrar girin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              İlgi Alanları * (En az 2 tane seçin)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                    formData.interests.includes(interest)
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formData.interests.includes(interest) && <Check className="w-4 h-4" />}
                  #{interest}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Seçili: {formData.interests.length} ilgi alanı
            </p>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-semibold"
            >
              Hesap Oluştur
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Zaten hesabınız var mı?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-gray-800 hover:underline font-medium"
            >
              Giriş yapın
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana sayfaya dön</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
