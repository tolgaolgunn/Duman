import React, { useState } from 'react';
import { User, Bell, Lock, Palette, Sparkles, XCircle, RefreshCw, ChevronDown, ChevronUp, Settings as SettingsIcon, UserX, Ban, VolumeX, MessageSquare } from 'lucide-react';
import { currentUser, interestOptions } from '../../lib/mockData';

export function SettingsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [premiumPlan, setPremiumPlan] = useState<'normal' | 'student'>(currentUser.premiumPlan || 'normal');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Yeni ayarlar için state'ler
  const [showDisableAccount, setShowDisableAccount] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showMutedUsers, setShowMutedUsers] = useState(false);
  const [showMutedWords, setShowMutedWords] = useState(false);
  const [showChatPrivacy, setShowChatPrivacy] = useState(false);
  const [chatPrivacy, setChatPrivacy] = useState<'everyone' | 'followers' | 'following'>('everyone');
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const [newMutedWord, setNewMutedWord] = useState('');

  // Yaş hesaplama
  const calculateAge = (birthDate?: Date): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(currentUser.birthDate);

  // Tarih formatlama
  const formatDate = (date?: Date): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Şifre validasyonu
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) {
      errors.push('En az 6 karakter olmalıdır');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('En az 1 büyük harf içermelidir');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('En az 1 küçük harf içermelidir');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('En az 1 noktalama işareti içermelidir');
    }
    return errors;
  };

  const handlePasswordChange = () => {
    const errors: string[] = [];
    
    if (!currentPassword) {
      errors.push('Mevcut şifre gereklidir');
    }
    
    const newPasswordErrors = validatePassword(newPassword);
    errors.push(...newPasswordErrors);
    
    if (newPassword !== confirmPassword) {
      errors.push('Yeni şifreler eşleşmiyor');
    }
    
    setPasswordErrors(errors);
    
    if (errors.length === 0) {
      // Şifre değiştirme işlemi burada yapılacak
      alert('Şifre başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    }
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
          <h3 className="text-gray-900">Hesap</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-700 mb-1.5 text-sm font-medium">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              defaultValue={currentUser.username}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-gray-700 mb-1.5 text-sm font-medium">Telefon</label>
            <input
              id="phone"
              type="tel"
              defaultValue={currentUser.phone || ''}
              placeholder="Telefon numaranızı girin"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1.5 text-sm font-medium">E-posta</label>
            <input
              id="email"
              type="email"
              defaultValue={currentUser.email}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Onaylanma</span>
              {currentUser.isVerified ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-lg">Onaylandı</span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">Onaylanmadı</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Hesap Oluşturma Tarihi</span>
            <span className="text-gray-600">{formatDate(currentUser.createdAt)}</span>
          </div>
          <div>
            <label htmlFor="gender" className="block text-gray-700 mb-1.5 text-sm font-medium">Cinsiyet</label>
            <select
              id="gender"
              defaultValue={currentUser.gender || ''}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seçiniz</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-gray-700 mb-1.5 text-sm font-medium">Doğum Tarihi</label>
            <input
              id="birthDate"
              type="date"
              defaultValue={currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : ''}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {age !== null && (
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 text-sm">Yaş</span>
              <span className="text-gray-600 text-sm">{age}</span>
            </div>
          )}
          <div>
            <button 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Şifre Değiştir</span>
              </div>
              {showPasswordChange ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Şifre Değiştirme Formu */}
            {showPasswordChange && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 transition-all duration-200">
                <div>
                  <label htmlFor="currentPassword" className="block text-gray-700 mb-1.5 text-sm font-medium">Şu Anki Şifre</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-gray-700 mb-1.5 text-sm font-medium">Yeni Şifre</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordErrors([]);
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      passwordErrors.length > 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                    placeholder="Yeni şifrenizi girin"
                  />
                  {newPassword && (
                    <div className="mt-1.5 text-xs text-gray-600">
                      <p className="mb-1 font-medium">Şifre gereksinimleri:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                        <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                          En az 6 karakter
                        </li>
                        <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                          1 büyük harf
                        </li>
                        <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                          1 küçük harf
                        </li>
                        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-green-600' : ''}>
                          1 noktalama işareti
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 mb-1.5 text-sm font-medium">Yeni Şifre Tekrar</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordErrors([]);
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      passwordErrors.length > 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Şifreler eşleşmiyor</p>
                  )}
                </div>
                {passwordErrors.length > 0 && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-red-700">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordErrors([]);
                    }}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all border border-gray-400 shadow-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-back text-sm font-semibold rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all border-2 border-blue-900 shadow-sm"
                  >
                    Şifreyi Değiştir
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-all font-medium">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      {/* Premium */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Premium</h3>
        </div>
        <div className="space-y-4">
          {currentUser.isPremium ? (
            <>
              {currentUser.premiumCreatedAt && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Premium Oluşturma Tarihi</span>
                  <span className="text-gray-600">{formatDate(currentUser.premiumCreatedAt)}</span>
                </div>
              )}
              <div>
                <label htmlFor="premiumPlanActive" className="block text-gray-700 mb-1.5 text-sm font-medium">Premium Planı</label>
                <select
                  id="premiumPlanActive"
                  value={premiumPlan}
                  onChange={(e) => setPremiumPlan(e.target.value as 'normal' | 'student')}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="normal">Normal</option>
                  <option value="student">Öğrenci</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-3 py-2.5 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Uzat
                </button>
                <button className="flex-1 px-3 py-2.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-all border border-red-200 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />
                  İptal Et
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-4 text-sm">
                AI Gündem Asistanı ile gündemdeki konuları özetleyin ve daha fazlasına erişin.
              </p>
              <div>
                <label htmlFor="premiumPlan" className="block text-gray-700 mb-1.5 text-sm font-medium">Premium Planı Seçin</label>
                <select
                  id="premiumPlan"
                  value={premiumPlan}
                  onChange={(e) => setPremiumPlan(e.target.value as 'normal' | 'student')}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 transition-all"
                >
                  <option value="normal">Normal - ₺29.99/ay</option>
                  <option value="student">Öğrenci - ₺19.99/ay</option>
                </select>
              </div>
              <button className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all font-medium">
                Premium'a Geç
              </button>
            </>
          )}
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
        <button className="mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-all font-medium">
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
              className={`w-14 h-8 rounded-full transition-all border-2 ${
                notificationsEnabled 
                  ? 'bg-gray-400 border-gray-600' 
                  : 'bg-gray-300 border-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-all border border-gray-300 ${
                  notificationsEnabled ? 'ml-7' : 'ml-1'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Account Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-gray-900">Gizlilik ve Hesap</h3>
        </div>
        <div className="space-y-2">
          {/* Mesaj istekleri */}
          <div>
            <button
              onClick={() => setShowChatPrivacy(!showChatPrivacy)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Mesaj İstekleri</p>
                  <p className="text-sm text-gray-500">
                    {chatPrivacy === 'everyone' && 'Herkes'}
                    {chatPrivacy === 'followers' && 'Sadece Takipçiler'}
                    {chatPrivacy === 'following' && 'Sadece Takip Ettiklerim'}
                  </p>
                </div>
              </div>
              {showChatPrivacy ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showChatPrivacy && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <label className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 rounded-lg" aria-label="Herkes seçeneği">
                  <input
                    type="radio"
                    name="chatPrivacy"
                    value="everyone"
                    checked={chatPrivacy === 'everyone'}
                    onChange={(e) => setChatPrivacy(e.target.value as 'everyone' | 'followers' | 'following')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium">Herkes</p>
                    <p className="text-sm text-gray-500">Herkes size mesaj gönderebilir</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 rounded-lg" aria-label="Sadece Takipçiler seçeneği">
                  <input
                    type="radio"
                    name="chatPrivacy"
                    value="followers"
                    checked={chatPrivacy === 'followers'}
                    onChange={(e) => setChatPrivacy(e.target.value as 'everyone' | 'followers' | 'following')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium">Sadece Takipçiler</p>
                    <p className="text-sm text-gray-500">Sadece sizi takip edenler mesaj gönderebilir</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 rounded-lg" aria-label="Sadece Takip Ettiklerim seçeneği">
                  <input
                    type="radio"
                    name="chatPrivacy"
                    value="following"
                    checked={chatPrivacy === 'following'}
                    onChange={(e) => setChatPrivacy(e.target.value as 'everyone' | 'followers' | 'following')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium">Sadece Takip Ettiklerim</p>
                    <p className="text-sm text-gray-500">Sadece takip ettiğiniz kişiler mesaj gönderebilir</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Engellenen kişiler */}
          <div>
            <button
              onClick={() => setShowBlockedUsers(!showBlockedUsers)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Engellenen Kişiler</p>
                  <p className="text-sm text-gray-500">Engellediğiniz kullanıcıları yönetin</p>
                </div>
              </div>
              {showBlockedUsers ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showBlockedUsers && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">Şu anda engellenen kullanıcı yok.</p>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-all">
                  Kullanıcı Ekle
                </button>
              </div>
            )}
          </div>

          {/* Sessize alınan kişiler */}
          <div>
            <button
              onClick={() => setShowMutedUsers(!showMutedUsers)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <VolumeX className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Sessize Alınan Kişiler</p>
                  <p className="text-sm text-gray-500">Sessize aldığınız kullanıcıları yönetin</p>
                </div>
              </div>
              {showMutedUsers ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showMutedUsers && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">Şu anda sessize alınan kullanıcı yok.</p>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-all">
                  Kullanıcı Ekle
                </button>
              </div>
            )}
          </div>

          {/* Sessize alınan kelimeler */}
          <div>
            <button
              onClick={() => setShowMutedWords(!showMutedWords)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <VolumeX className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Sessize Alınan Kelimeler</p>
                  <p className="text-sm text-gray-500">Bu kelimeleri içeren içerikler sessize alınır</p>
                </div>
              </div>
              {showMutedWords ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showMutedWords && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMutedWord}
                    onChange={(e) => setNewMutedWord(e.target.value)}
                    placeholder="Kelime ekle..."
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMutedWord.trim()) {
                        setMutedWords([...mutedWords, newMutedWord.trim()]);
                        setNewMutedWord('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newMutedWord.trim()) {
                        setMutedWords([...mutedWords, newMutedWord.trim()]);
                        setNewMutedWord('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Ekle
                  </button>
                </div>
                {mutedWords.length > 0 && (
                  <div className="space-y-2">
                    {mutedWords.map((word) => (
                      <div key={word} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">#{word}</span>
                        <button
                          onClick={() => setMutedWords(mutedWords.filter((w) => w !== word))}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {mutedWords.length === 0 && (
                  <p className="text-sm text-gray-500">Sessize alınan kelime yok.</p>
                )}
              </div>
            )}
          </div>

          {/* Hesabı devre dışı bırakma */}
          <div>
            <button
              onClick={() => setShowDisableAccount(!showDisableAccount)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Hesabı Devre Dışı Bırak</p>
                  <p className="text-sm text-gray-500">Hesabınızı geçici olarak devre dışı bırakın</p>
                </div>
              </div>
              {showDisableAccount ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showDisableAccount && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <p className="text-sm text-gray-600">
                  Hesabınızı devre dışı bıraktığınızda profiliniz ve içerikleriniz gizlenecek. İstediğiniz zaman tekrar aktif edebilirsiniz.
                </p>
                <button className="px-4 py-2 border-2 border-black-600 bg-black-600 text-black text-sm rounded-lg hover:bg-black-700 transition-all font-medium">
                  Hesabı Devre Dışı Bırak
                </button>
              </div>
            )}
          </div>

          {/* Hesap silme */}
          <div>
            <button
              onClick={() => setShowDeleteAccount(!showDeleteAccount)}
              className="w-full px-4 py-3 bg-gray-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium">Hesabı Sil</p>
                  <p className="text-sm text-red-600">Hesabınızı kalıcı olarak silin</p>
                </div>
              </div>
              {showDeleteAccount ? (
                <ChevronUp className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-red-600" />
              )}
            </button>
            {showDeleteAccount && (
              <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  DİKKAT: Bu işlem geri alınamaz! Hesabınızı silmek istediğinize emin misiniz?
                </p>
                <p className="text-sm text-gray-600">
                  Hesabınızı sildiğinizde tüm verileriniz, içerikleriniz ve geçmişiniz kalıcı olarak silinecektir.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Şifrenizi girin"
                    className="flex-1 px-3 py-2 text-sm bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button className="px-4 py-2 border-2 border-black-600 bg-black-600 text-black text-sm rounded-lg hover:bg-red-700 transition-all font-medium">
                    Hesabı Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}