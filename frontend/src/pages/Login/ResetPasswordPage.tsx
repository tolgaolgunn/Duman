import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams() as { token?: string };
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsValid(false);
        return;
      }
      try {
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/api/auth/verify-reset-token/${encodeURIComponent(token)}`);
        if (!res.ok) {
          setIsValid(false);
          return;
        }
        const data = await res.json();
        setIsValid(true);
        setEmail(data.email || '');
      } catch (err) {
        console.error('Verify token error', err);
        setIsValid(false);
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage('Şifre en az 6 karakter olmalı');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword })
      });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!res.ok) {
        setMessage(data?.error || data?.message || `Hata: ${res.status}`);
        return;
      }

      toast.success('Şifre başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Reset password error', err);
      setMessage('Şifre sıfırlama sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValid === null) {
    return <div className="min-h-screen flex items-center justify-center">Doğrulanıyor...</div>;
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-lg font-semibold mb-2">Geçersiz veya Süresi Dolmuş Bağlantı</h2>
            <p className="text-sm text-gray-600 mb-4">Şifre sıfırlama bağlantısı geçersiz ya da süresi dolmuş olabilir.</p>
            <button onClick={() => navigate('/forgot-password')} className="px-4 py-2 bg-gray-100 rounded">Tekrar İste</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden bg-gray-100">
            <Lock className="w-6 h-6 text-gray-600" />
          </div>
          <h1 className="text-gray-800 text-2xl font-bold">Şifreyi Yenile</h1>
          <p className="text-gray-600 text-sm mt-2">{email ? `E-posta: ${email}` : ''}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Yeni Şifre</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="Yeni şifre" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="Yeni şifre (tekrar)" required />
            </div>

            {message && <div className="text-sm text-center text-red-600">{message}</div>}

            <div className="flex gap-2">
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 bg-gray-100 rounded-xl">{isLoading ? 'Gönderiliyor...' : 'Şifreyi Değiştir'}</button>
              <button type="button" onClick={() => navigate('/login')} className="px-4 py-3 bg-white border rounded-xl">Girişe Dön</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
