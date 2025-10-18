import React, { useState } from 'react';
import { Settings, Sparkles, X, Camera, User, Mail } from 'lucide-react';
import { currentUser, mockPosts } from '../../lib/mockData';
import { Post } from '../../components/Post';

export function ProfilePage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'interests'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: currentUser.username,
    email: currentUser.email,
    bio: '', // bio is not present on currentUser, initialize as empty string
    interests: currentUser.interests
  });

  const userPosts = mockPosts.filter((post) => post.author.id === currentUser.id);
  
  // Beğenilen gönderiler - gerçek uygulamada bu veriler backend'den gelir
  // Mock data için: ilk 3 gönderiyi beğenilmiş olarak göster
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
    setShowEditModal(false);
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
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 px-4 py-3 transition-all ${
              activeTab === 'interests'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            İlgi Alanları
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
      
      {activeTab === 'interests' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-gray-900 mb-4">İlgi Alanlarını Yönet</h3>
          <div className="grid grid-cols-2 gap-3">
            {currentUser.interests.map((interest) => (
              <div
                key={interest}
                className="flex items-center justify-between p-3 bg-gray-100 rounded-xl"
              >
                <span className="text-gray-700">#{interest}</span>
                <button className="text-gray-400 hover:text-red-500 transition-all">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-gray-400 hover:text-gray-800 transition-all">
            + Yeni İlgi Alanı Ekle
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs" style={{ zIndex: 10001 }}>
        showEditModal: {showEditModal ? 'true' : 'false'}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
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
              <div style={{
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
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-4">
                  <span className="text-4xl">{currentUser.avatar}</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Fotoğraf Değiştir</span>
                </button>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kullanıcı adınızı girin"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E-posta adresinizi girin"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İlgi Alanları
                </label>
                <div className="flex flex-wrap gap-2">
                  {editForm.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                    >
                      #{interest}
                      <button
                        onClick={() => {
                          const newInterests = editForm.interests.filter((_, i) => i !== index);
                          setEditForm({...editForm, interests: newInterests});
                        }}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Yeni ilgi alanı ekle..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setEditForm({
                          ...editForm,
                          interests: [...editForm.interests, e.currentTarget.value.trim()]
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                  />
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
