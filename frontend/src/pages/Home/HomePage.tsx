import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Filter, Image as ImageIcon } from 'lucide-react';
import { currentUser, interestOptions } from '../../lib/mockData';
import { Post } from '../../components/Post';

export function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  // filterInterests is used to filter the feed (header filters)
  const [filterInterests, setFilterInterests] = useState<string[]>([]);
    // postSelectedInterests is used in the new-post form to pick tags for the post
    const [postSelectedInterests, setPostSelectedInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [options, setOptions] = useState<string[]>(interestOptions);
  const [newInterest, setNewInterest] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const toggleInterestFilter = (interest: string) => {
    setFilterInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const togglePostInterest = (interest: string) => {
    setPostSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('Image preview URL:', result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load current user profile (to get avatar and interests)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const payload = data && (data.data || data) ? (data.data || data) : data;
        setProfile(payload);
        // Do NOT auto-select profile interests for the new-post form.
        // The user should explicitly choose which interests/tags to attach to each post.
        // However, keep the options list populated if the profile provides interests.
        if (Array.isArray(payload.interests) && payload.interests.length > 0) {
          setOptions((prev) => {
            // merge unique, keep existing options first
            const merged = [...prev];
            for (const it of payload.interests) {
              if (!merged.some(o => o.toLowerCase() === it.toLowerCase())) merged.push(it);
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed to load profile for HomePage', err);
      }
    };

    loadProfile();
  }, []);

  // On mount, load posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) return; // ignore silently for now
        const data = await res.json();
        const postsFromServer = (data && data.data) ? data.data : [];
        const mapped = postsFromServer.map((p: any) => ({
          id: p._id || p.id,
          author: {
            id: p.author?._id || p.author?.id || currentUser.id,
            username: p.author?.username || currentUser.username,
            email: p.author?.email || currentUser.email,
            // do not inject current user's profile interests into posts; only use author's explicit interests if provided
            interests: p.author?.interests || [],
            followers: [],
            following: [],
            isPremium: false,
            avatar: p.author?.avatar || currentUser.avatar
          },
          content: p.content,
          imageUrl: p.image || p.imageUrl,
          // backend may return either `tags` or `interests` depending on schema; accept both
          tags: p.tags || p.interests || [],
          likes: p.likes || [],
          createdAt: new Date(p.createdAt),
          commentCount: p.commentCount || 0
        }));
        setPosts(mapped);
      } catch (err) {
        console.warn('Unable to load posts', err);
      }
    };

    fetchPosts();
  }, []);

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const filteredPosts = filterInterests.length > 0
    ? posts.filter((post) => post.tags.some((tag: string) => filterInterests.includes(tag)))
    : posts;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-6">
        <div className="p-4">
          <h2 className="text-gray-900 mb-3">Ana Sayfa</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewPost(!showNewPost)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Gönderi</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                showFilters
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filtrele</span>
            </button>
          </div>
        </div>

        {/* Interest Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <p className="text-gray-700 mb-3">İlgi Alanlarına Göre Filtrele:</p>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterestFilter(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    filterInterests.includes(interest)
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{interest}
                </button>
              ))}
            </div>
            {filterInterests.length > 0 && (
              <button
                onClick={() => setFilterInterests([])}
                className="text-gray-600 text-sm mt-3 hover:underline"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username || 'avatar'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-2xl">{currentUser.avatar}</span>
                </div>
              )}
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Ne düşünüyorsun?"
              className="flex-1 resize-none border-none focus:outline-none focus:ring-0 text-gray-800"
              rows={3}
            />
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
  <div className="mt-3 relative overflow-hidden rounded-xl border border-gray-200 flex justify-center bg-gray-50">
    <img
      src={imagePreview}
      alt="Preview"
      className="max-w-full max-h-96 object-scale-down"
      style={{ display: 'block' }}
    />
    <button
      onClick={handleRemoveImage}
      className="absolute top-1 right-1 bg-red-500 text-black rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold z-10 shadow-lg"
    >
      ✕
    </button>
  </div>
)}
          
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            {/* Interests / Tags selector */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {options.map((opt) => {
                  const active = postSelectedInterests.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => togglePostInterest(opt)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${active ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      type="button"
                    >
                      #{opt}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni ilgi alanı ekle..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = (newInterest || '').trim();
                    if (!val) return toast.error('Lütfen bir ilgi alanı yazın');
                    // prevent duplicates (case-insensitive)
                    const exists = options.some(o => o.toLowerCase() === val.toLowerCase());
                    if (exists) {
                      // toggle selection in post form if already exists
                      if (!postSelectedInterests.includes(val)) togglePostInterest(val);
                      setNewInterest('');
                      return;
                    }
                    // limit options list to reasonable size
                    setOptions((prev: string[]) => [...prev, val]);
                    // auto-select the new interest (respect max 10 tags)
                    setPostSelectedInterests((prev: string[]) => prev.length >= 10 ? prev : [...prev, val]);
                    setNewInterest('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Ekle
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Resim Ekle</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={async () => {
                // handle share
                if (!newPostContent.trim() && !imagePreview) return toast.error('Lütfen içerik veya resim ekleyin');
                const token = localStorage.getItem('authToken');
                if (!token) return toast.error('Lütfen önce giriş yapın');

                const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
                const title = newPostContent.trim().substring(0, 60) || 'Gönderi';
                const body: any = {
                  title,
                  content: newPostContent.trim(),
                  image: imagePreview || null,
                  tags: postSelectedInterests
                };

                try {
                  const res = await fetch(`${API_BASE}/api/posts`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                  });

                  if (!res.ok) {
                    const text = await res.text();
                    let data: any = {};
                    try { data = JSON.parse(text); } catch { data = { error: text }; }
                    throw new Error(data?.error || `HTTP ${res.status}`);
                  }

                  const data = await res.json();
                  const payload = data && data.data ? data.data : data;

                  // Map server payload to Post component shape
                  const newPost = {
                    id: payload.id || payload._id || String(Date.now()),
                    author: {
                      id: payload.author?._id || payload.author || currentUser.id,
                      username: payload.author?.username || currentUser.username,
                      email: payload.author?.email || currentUser.email,
                      // avoid mixing profile interests into the post's author object for display
                      interests: payload.author?.interests || [],
                      followers: [],
                      following: [],
                      isPremium: false,
                      avatar: payload.author?.avatar || currentUser.avatar
                    },
                    content: payload.content || newPostContent,
                    imageUrl: payload.image || payload.imageUrl || imagePreview || undefined,
                    // server may return `tags` or `interests`; prefer payload values, otherwise fall back to what was selected client-side
                    tags: payload.tags || payload.interests || postSelectedInterests || [],
                    likes: payload.likes || [],
                    createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
                    commentCount: payload.commentCount || 0
                  };

                  setPosts((prev) => [newPost, ...prev]);
                  setNewPostContent('');
                  setSelectedImage(null);
                  setImagePreview(null);
                  setShowNewPost(false);
                  // Clear feed filters so the newly created post is visible
                  setFilterInterests([]);
                  toast.success('Gönderi paylaşıldı');
                } catch (err: any) {
                  console.error('Failed to create post', err);
                  toast.error(err?.message || 'Gönderi oluşturulamadı');
                }
              }}
              className="ml-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              Paylaş
            </button>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <React.Fragment key={post.id}>
              <Post
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                isLiked={likedPosts.has(post.id)}
              />
            </React.Fragment>
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">Seçili filtrelerle gönderi bulunamadı</p>
            <button
              onClick={() => setFilterInterests([])}
              className="text-gray-600 hover:underline"
            >
              Filtreleri temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
