import React, { useState } from 'react';
import { Settings, Sparkles, X, Camera, User, Mail } from 'lucide-react';
import { currentUser, mockPosts } from '../../lib/mockData';
import { Post } from '../../components/Post';

export function ProfilePage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: currentUser.username,
    email: currentUser.email,
    bio: '', // bio is not present on currentUser, initialize as empty string
    interests: currentUser.interests
  });
  const [newInterest, setNewInterest] = useState('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);

  const userPosts = mockPosts.filter((post) => post.author.id === currentUser.id);
  const likedPostsData = mockPosts.slice(0, 3);

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  const handleEditProfile = () => {
    console.log('Edit profile button clicked');
    console.log('Current showEditModal:', showEditModal);
    setShowEditModal(true);
    console.log('setShowEditModal(true) called');
    
    // Test: setTimeout ile state'i kontrol et
    setTimeout(() => {
      console.log('After timeout, showEditModal should be true');
    }, 100);
  };

  const handleSaveProfile = () => {
    // Burada gerçek uygulamada API çağrısı yapılır
    console.log('Profile updated:', editForm);
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: currentUser.username,
      email: currentUser.email,
      bio: '', // bio property doesn't exist on currentUser, so keep as empty string
      interests: currentUser.interests
    });
    setNewInterest('');
    setShowEditModal(false);
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !editForm.interests.includes(newInterest.trim())) {
      setEditForm({
        ...editForm,
        interests: [...editForm.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handlePhotoAction = (action: string) => {
    console.log('Photo action:', action);
    setShowPhotoMenu(false);
    
    switch (action) {
      case 'add':
        handleAddPhoto();
        break;
      case 'edit':
        handleEditPhoto();
        break;
      case 'remove':
        handleRemovePhoto();
        break;
      default:
        console.log('Unknown photo action:', action);
    }
  };

  const handleAddPhoto = () => {
    // Dosya seçici oluştur
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Yeni fotoğraf seçildi:', file.name);
        // Burada gerçek uygulamada fotoğraf yükleme işlemi yapılır
        alert(`Fotoğraf yüklendi: ${file.name}`);
      }
    };
    input.click();
  };

  const handleEditPhoto = () => {
    console.log('Fotoğraf düzenleme moduna geçiliyor');
    // Burada gerçek uygulamada fotoğraf düzenleme arayüzü açılır
    alert('Fotoğraf düzenleme özelliği yakında eklenecek!');
  };

  const handleRemovePhoto = () => {
    const confirmed = window.confirm('Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?');
    if (confirmed) {
      console.log('Fotoğraf kaldırılıyor...');
      // Burada gerçek uygulamada fotoğraf silme işlemi yapılır
      alert('Profil fotoğrafı kaldırıldı!');
    }
  };

  const handleCoverAction = (action: string) => {
    console.log('Cover action:', action);
    setShowCoverMenu(false);
    
    switch (action) {
      case 'add':
        handleAddCover();
        break;
      case 'edit':
        handleEditCover();
        break;
      case 'remove':
        handleRemoveCover();
        break;
      default:
        console.log('Unknown cover action:', action);
    }
  };

  const handleAddCover = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Yeni cover fotoğrafı seçildi:', file.name);
        alert(`Cover fotoğrafı yüklendi: ${file.name}`);
      }
    };
    input.click();
  };

  const handleEditCover = () => {
    console.log('Cover fotoğrafı düzenleme moduna geçiliyor');
    alert('Cover fotoğrafı düzenleme özelliği yakında eklenecek!');
  };

  const handleRemoveCover = () => {
    const confirmed = window.confirm('Cover fotoğrafınızı kaldırmak istediğinizden emin misiniz?');
    if (confirmed) {
      console.log('Cover fotoğrafı kaldırılıyor...');
      alert('Cover fotoğrafı kaldırıldı!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-32 bg-black" style={{backgroundColor: '#000000'}}></div>

        {/* Profile Info */}
        <div className="px-6 pb-6" >
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-4xl">{currentUser.avatar}</span>
            </div>
            <div className="flex-1 mt-14">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-gray-900">@{currentUser.username}</h2>
                {currentUser.isPremium && (
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-gray-500">{currentUser.email}</p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked!');
                handleEditProfile();
              }}
              onMouseDown={() => console.log('Mouse down on button')}
              onMouseUp={() => console.log('Mouse up on button')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 mt-14"
              style={{ cursor: 'pointer', zIndex: 10 }}
            >
              <Settings className="w-4 h-4" />
              <span>Profili Düzenle</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-gray-900">{userPosts.length}</p>
              <p className="text-gray-500 text-sm">Gönderi</p>
            </div>
            <div>
              <p className="text-gray-900">{currentUser.followers.length}</p>
              <p className="text-gray-500 text-sm">Takipçi</p>
            </div>
            <div>
              <p className="text-gray-900">{currentUser.following.length}</p>
              <p className="text-gray-500 text-sm">Takip</p>
            </div>
          </div>

          {/* Interests */}
          <div>
            <p className="text-gray-700 mb-2">İlgi Alanları:</p>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                >
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-4 py-3 transition-all ${
              activeTab === 'posts'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Gönderiler ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 px-4 py-3 transition-all ${
              activeTab === 'liked'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Beğendiklerim ({likedPostsData.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <div key={post.id}>
              <Post
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                isLiked={likedPosts.has(post.id)}
              />
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedPostsData.length > 0 ? (
            likedPostsData.map((post) => (
              <div key={post.id}>
                <Post
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  isLiked={likedPosts.has(post.id)}
                />
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❤️</span>
              </div>
              <p className="text-gray-500 mb-2">Henüz beğendiğiniz gönderi yok</p>
              <p className="text-gray-400 text-sm">Beğendiğiniz gönderiler burada görünecek</p>
            </div>
          )}
        </div>
      )}
      

      {/* Debug Info */}
      <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs" style={{ zIndex: 10001 }}>
        showEditModal: {showEditModal ? 'true' : 'false'} | showPhotoMenu: {showPhotoMenu ? 'true' : 'false'} | showCoverMenu: {showCoverMenu ? 'true' : 'false'}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          onClick={() => {
            setShowPhotoMenu(false);
            setShowCoverMenu(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
              {/* {console.log('Modal is rendering!')} */}
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                zIndex: 10000
              }}
            >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Profili Düzenle</h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-4">
                  <span className="text-4xl">{currentUser.avatar}</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Photo button clicked, current state:', showPhotoMenu);
                      setShowPhotoMenu(!showPhotoMenu);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    <span className="text-lg">📷</span>
                    <span className="text-sm">Fotoğraf Değiştir</span>
                  </button>
                  
                  {/* Photo Menu Dropdown */}
                  {showPhotoMenu && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                    >
                      <div className="py-2">
                        {/* Profile Photo Section */}
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Profil Fotoğrafı
                        </div>
                        <button
                          onClick={() => handlePhotoAction('add')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <span className="text-lg">📁</span>
                          <span>Profil Fotoğrafı Ekle</span>
                        </button>
                        <button
                          onClick={() => handlePhotoAction('remove')}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                        >
                          <span className="text-lg">🗑️</span>
                          <span>Profil Fotoğrafı Kaldır</span>
                        </button>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        {/* Cover Photo Section */}
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Kapak Fotoğrafı
                        </div>
                        <button
                          onClick={() => handleCoverAction('add')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <span className="text-lg">📁</span>
                          <span>Kapak Fotoğrafı Ekle</span>
                        </button>
                        <button
                          onClick={() => handleCoverAction('remove')}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                        >
                          <span className="text-lg">🗑️</span>
                          <span>Kapak Fotoğrafı Kaldır</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span className="text-lg">👤</span>
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kullanıcı adınızı girin"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E-posta adresinizi girin"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Hakkında
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                />
              </div>

              {/* Interests */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  İlgi Alanları
                </label>
                <div className="flex flex-wrap gap-2">
                  {editForm.interests.map((interest, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 text-sm hover:border-gray-300 transition-colors"
                    >
                      <span className="mr-1">#{interest}</span>
                      <button
                        onClick={() => {
                          const newInterests = editForm.interests.filter((_, i) => i !== index);
                          setEditForm({...editForm, interests: newInterests});
                        }}
                        className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-all text-sm font-bold"
                        title="Kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Yeni ilgi alanı ekle..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddInterest();
                      }
                    }}
                  />
                  <button 
                    onClick={handleAddInterest}
                    className="px-4 py-2 flex items-center justify-center rounded-xl border border-gray-300
                      bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-all text-sm font-bold" 
                    title="İlgi Alanı Ekle"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

