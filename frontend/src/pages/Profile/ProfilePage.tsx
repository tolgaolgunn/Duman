import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import { Settings, Sparkles, X, Camera, User, Mail } from 'lucide-react';
import { currentUser, mockPosts } from '../../lib/mockData';
import ImageModal from '../../components/ImageModal';
import { Post } from '../../components/Post';

export function ProfilePage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  type ProfileShape = { username: string; email: string; interests: string[]; avatar?: string; cover?: string; bio?: string };

  // start with an empty profile to avoid flashing the mock `currentUser` values
  const [profile, setProfile] = useState<ProfileShape>({ username: '', email: '', interests: [], avatar: '', cover: '', bio: '' });
  // edit form is initialized when opening the edit modal (avoid using mock data on first render)
  const [editForm, setEditForm] = useState<{ username: string; email: string; bio: string; interests: string[] }>({
    username: '',
    email: '',
    bio: '',
    interests: []
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
  // initialize edit form with latest profile
  setEditForm({ username: profile.username, email: profile.email, bio: profile.bio || '', interests: profile.interests });
    console.log('setShowEditModal(true) called');
    
    // Test: setTimeout ile state'i kontrol et
    setTimeout(() => {
      console.log('After timeout, showEditModal should be true');
    }, 100);
  };

  useEffect(() => {
    // Fetch profile from backend using stored authToken
    const fetchProfile = async () => {
      try {
  const token = localStorage.getItem('authToken');
  console.debug && console.debug('fetchProfile: token present?', !!token);
  if (!token) { setIsLoadingProfile(false); return; }
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          console.error('Failed to load profile', res.status);
          setIsLoadingProfile(false);
          return;
        }
  const data = await res.json();
  console.debug && console.debug('fetchProfile: response', data);
  setProfile({ username: data.username, email: data.email, interests: data.interests || [], avatar: data.avatar || '', cover: data.cover || '', bio: data.bio || '' });
  setEditForm({ username: data.username, email: data.email, bio: data.bio || '', interests: data.interests || [] });
  setIsLoadingProfile(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = () => {
    // helper to compare interests arrays
    const normalizeInterests = (arr: string[] = []) => [...arr].map(i => i.trim()).filter(Boolean).sort();
    const isSameInterests = (a: string[] = [], b: string[] = []) => {
      const na = normalizeInterests(a);
      const nb = normalizeInterests(b);
      if (na.length !== nb.length) return false;
      for (let i = 0; i < na.length; i++) if (na[i] !== nb[i]) return false;
      return true;
    };

    const hasChanges = () => {
      if (editForm.username !== profile.username) return true;
      if (editForm.email !== profile.email) return true;
      if ((editForm.bio || '') !== (profile.bio || '')) return true;
      if (!isSameInterests(editForm.interests, profile.interests || [])) return true;
      return false;
    };

    // If nothing changed, close modal and do nothing (no toast)
    if (!hasChanges()) {
      setShowEditModal(false);
      return;
    }

    const save = async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const token = localStorage.getItem('authToken');
        console.debug && console.debug('handleSaveProfile: token present?', !!token, 'body:', { username: editForm.username, email: editForm.email, interests: editForm.interests, bio: editForm.bio });
        if (!token) throw new Error('Kullanıcı oturumu bulunamadı');
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: editForm.username,
            email: editForm.email,
            interests: editForm.interests,
            bio: editForm.bio,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          let data: any = {};
          try { data = JSON.parse(text); } catch { data = { error: text }; }
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        console.debug && console.debug('handleSaveProfile: response', data);
        // Update local profile state with returned data (include avatar/cover/bio)
        setProfile({ username: data.username, email: data.email, interests: data.interests || [], avatar: data.avatar || '', cover: data.cover || '', bio: data.bio || '' });
        setEditForm({ username: data.username, email: data.email, bio: data.bio || '', interests: data.interests || [] });
        // notify other components (Sidebar etc.) about profile change
        try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { username: data.username, email: data.email, avatar: data.avatar, cover: data.cover, bio: data.bio } })); } catch (e) { /* ignore */ }
        setShowEditModal(false);
        // show success toast
        try { toast.success('Profil güncellendi.'); } catch (e) { /* ignore */ }
      } catch (err: any) {
        console.error('Failed to save profile:', err);
        const msg = err?.message || 'Profil kaydedilemedi';
        setSaveError(msg);
        try { toast.error(msg); } catch (e) { /* ignore */ }
      } finally {
        setIsSaving(false);
      }
    };

    save();
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        // Show preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

  await uploadFileWithProgress(file, 'avatar');
  toast.success('Profil fotoğrafı yüklendi.');
        // cleanup preview
        setPreviewUrl(null);
      } catch (err: any) {
  console.error('Fotoğraf yükleme hatası', err);
  toast.error('Fotoğraf yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
      }
    };
    input.click();
  };

  const uploadFileToServer = async (file: File, type: 'avatar' | 'cover') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Lütfen önce giriş yapın');
      return;
    }

    const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);

    // Use XHR to get progress events
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/auth/upload-photo`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = function () {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
              setProfile((prev) => ({ ...prev, avatar: data.avatar || prev.avatar, cover: data.cover || prev.cover }));
              // notify other components (e.g., Sidebar) about profile change
              try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar: data.avatar, cover: data.cover } })); } catch (e) { /* ignore */ }
            resolve();
          } catch (e) {
            reject(e);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data?.error || `HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = function () {
        setUploadProgress(null);
        reject(new Error('Network error'));
      };

      xhr.send(form);
    });
  };

  // Convenience that uses uploadFileToServer but provides progress state
  const uploadFileWithProgress = async (file: File, type: 'avatar' | 'cover') => {
    try {
      setUploadProgress(0);
      await uploadFileToServer(file, type);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleEditPhoto = () => {
    console.log('Fotoğraf düzenleme moduna geçiliyor');
    // Burada gerçek uygulamada fotoğraf düzenleme arayüzü açılır
  toast('Fotoğraf düzenleme özelliği yakında eklenecek!');
  };

  const handleRemovePhoto = () => {
    const confirmed = window.confirm('Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?');
    if (confirmed) {
      console.log('Fotoğraf kaldırılıyor...');
      // Burada gerçek uygulamada fotoğraf silme işlemi yapılır
  toast('Profil fotoğrafı kaldırıldı!');
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
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
  await uploadFileWithProgress(file, 'cover');
  toast.success('Kapak fotoğrafı yüklendi.');
        setPreviewUrl(null);
      } catch (err: any) {
  console.error('Kapak yükleme hatası', err);
  toast.error('Kapak yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
      }
    };
    input.click();
  };

  const handleEditCover = () => {
    console.log('Cover fotoğrafı düzenleme moduna geçiliyor');
  toast('Cover fotoğrafı düzenleme özelliği yakında eklenecek!');
  };

  const handleRemoveCover = () => {
    const confirmed = window.confirm('Cover fotoğrafınızı kaldırmak istediğinizden emin misiniz?');
    if (confirmed) {
      console.log('Cover fotoğrafı kaldırılıyor...');
  toast('Cover fotoğrafı kaldırıldı!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
  {/* Cover Image */}
  <div
    className="h-32"
    style={{
      backgroundColor: '#000000',
      backgroundImage: profile.cover ? `url('${profile.cover}')` : undefined,
      backgroundSize: profile.cover ? 'contain' : undefined,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}
    onClick={() => {
      if (profile.cover) setLightboxSrc(profile.cover);
    }}
  ></div>

        {/* Profile Info */}
        <div className="px-6 pb-6" >
          {isLoadingProfile ? (
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                <Skeleton circle={true} height={96} width={96} />
              </div>
              <div className="flex-1 mt-14 space-y-2">
                <Skeleton height={16} width={160} />
                <Skeleton height={12} width={220} />
                <Skeleton height={12} width={260} />
              </div>
              <div className="w-36 mt-14">
                <Skeleton height={40} />
              </div>
            </div>
          ) : (
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightboxSrc(profile.avatar || null)} />
              ) : (
                <span className="text-4xl">{(profile.username && profile.username.charAt(0).toUpperCase()) || ''}</span>
              )}
            </div>
            <div className="flex-1 mt-14">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-gray-900">@{profile.username}</h2>
                {currentUser.isPremium && (
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-gray-500">{profile.email}</p>
              {profile.bio && (
                <p className="text-gray-700 mt-2">{profile.bio}</p>
              )}
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
          )}

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
              {(profile.interests || []).map((interest) => (
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

      {/* Image lightbox/modal */}
      {lightboxSrc && (
        <ImageModal src={lightboxSrc} alt="Görüntü" onClose={() => setLightboxSrc(null)} />
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
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-4 overflow-hidden bg-gray-100">
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : profile.avatar ? (
                      <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-4xl text-white">{(profile.username && profile.username.charAt(0).toUpperCase()) || currentUser.avatar}</span>
                      </div>
                    )}
                  </div>
                {uploadProgress !== null && (
                  <div className="w-48 mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 text-center">Yükleme: {uploadProgress}%</div>
                  </div>
                )}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Photo button clicked, current state:', showPhotoMenu);
                      setShowPhotoMenu(!showPhotoMenu);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                      {previewUrl ? (
                        <img src={previewUrl} alt="mini-preview" className="w-full h-full object-cover" />
                      ) : profile.avatar ? (
                        <img src={profile.avatar} alt="mini-avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">📷</span>
                      )}
                    </div>
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
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                  disabled={isSaving}
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
                    disabled={isSaving}
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
                disabled={isSaving}
              >
                İptal
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
            {saveError && (
              <div className="p-4 text-sm text-red-600 border-t border-gray-100">
                {saveError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

