import React, { useState } from 'react';
import { User, Bell, Lock, Palette, Sparkles, Shield } from 'lucide-react';
import { currentUser, interestOptions } from '../../lib/mockData';

export function SettingsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Ayarlar</h2>
        <p className="text-gray-600">
          Hesap ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-gray-900">Hesap Bilgileri</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              defaultValue={currentUser.username}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">E-posta</label>
            <input
              type="email"
              defaultValue={currentUser.email}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-gray-900">İlgi Alanları</h3>
        </div>
        <p className="text-gray-600 mb-4">
          İçerik akışınızı kişiselleştirmek için ilgi alanlarınızı seçin
        </p>
        <div className="grid grid-cols-3 gap-2">
          {interestOptions.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                selectedInterests.includes(interest)
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{interest}
            </button>
          ))}
        </div>
        <button className="mt-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
          İlgi Alanlarını Güncelle
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-gray-900">Bildirimler</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900">Bildirimler</p>
              <p className="text-gray-500 text-sm">Yeni takipçiler ve etkileşimler</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-14 h-8 rounded-full transition-all ${
                notificationsEnabled ? 'bg-gray-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                  notificationsEnabled ? 'ml-7' : 'ml-1'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-gray-900">Gizlilik</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900">Özel Hesap</p>
              <p className="text-gray-500 text-sm">Sadece takipçileriniz içeriklerinizi görebilir</p>
            </div>
            <button
              onClick={() => setPrivateAccount(!privateAccount)}
              className={`w-14 h-8 rounded-full transition-all ${
                privateAccount ? 'bg-gray-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                  privateAccount ? 'ml-7' : 'ml-1'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-gray-900">Güvenlik</h3>
        </div>
        <button className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all text-left">
          Şifre Değiştir
        </button>
      </div>

      {/* Premium */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">
              {currentUser.isPremium ? 'Premium Üyeliğiniz Aktif' : 'Premium\'a Geçin'}
            </h3>
            <p className="text-gray-700 mb-4">
              {currentUser.isPremium
                ? 'AI Gündem Asistanı ve tüm premium özelliklere erişiminiz var.'
                : 'AI Gündem Asistanı ile gündemdeki konuları özetleyin ve daha fazlasına erişin.'}
            </p>
            {currentUser.isPremium ? (
              <button className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-yellow-200">
                Üyeliği Yönet
              </button>
            ) : (
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all">
                Premium'a Geç - ₺29.99/ay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
