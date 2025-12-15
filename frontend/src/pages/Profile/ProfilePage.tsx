import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import { Settings, Sparkles, X, Camera, User, Mail, Image as ImageIcon } from 'lucide-react';
import { currentUser, mockPosts, interestOptions } from '../../lib/mockData';
import ImageModal from '../../components/ImageModal';
import { Post } from '../../components/Post';

export function ProfilePage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  type ProfileShape = { username: string; email: string; interests: string[]; avatar?: string; cover?: string; bio?: string };

  // start with an empty profile to avoid flashing the mock `currentUser` values
  const [profile, setProfile] = useState<ProfileShape & { id?: string }>({ username: '', email: '', interests: [], avatar: '', cover: '', bio: '' });
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

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [likedPostsList, setLikedPostsList] = useState<any[]>([]);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState<boolean>(false);

  // If a route param is present we should show that user's profile (and posts)
  const params = useParams();
  const routeUserId = params?.userId as string | undefined;

  // Parse JWT payload (client-side) to extract authenticated user's id (if any).
  // We try common claim names: _id, id, sub, userId.
  const parseJwtPayload = (token?: string | null) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      // base64url -> base64
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Pad base64 string if necessary
      while (base64.length % 4) base64 += '=';
      const json = atob(base64);
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  };

  // Fetch posts liked by a user (authenticated user's liked posts or public for another user)
  const fetchLikedPosts = async (userId?: string) => {
    setIsLoadingLikedPosts(true);
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      let url: string;
      // If userId provided and it's not the authenticated "me", use public endpoint
      if (userId && userId !== String(authUserId)) {
        url = `${API_BASE}/api/posts/user/${encodeURIComponent(userId)}/liked`;
      } else {
        // authenticated user's liked posts
        url = `${API_BASE}/api/posts/liked`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.debug('Failed to fetch liked posts', res.status);
        setLikedPostsList([]);
        return [];
      }

      const data = await res.json();
      const postsFromServer = data?.data || data || [];

      const API_BASE_ = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const cloudinaryBase = ((import.meta as any).env?.VITE_CLOUDINARY_BASE as string) || 'https://res.cloudinary.com/dgjodxmkv/image/upload';
      const toAbsolute = (url?: string) => {
        if (!url) return undefined;
        const trimmed = String(url).trim();
        if (!trimmed) return undefined;
        if (trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('//')) return trimmed;
        if (trimmed.startsWith('/')) return API_BASE_ + trimmed;
        return API_BASE_ + '/' + trimmed;
      };

      const mapped = (postsFromServer || []).map((p: any) => ({
        id: p._id || p.id,
        author: {
          id: p.author?._id || p.author?.id || profile.id,
          username: p.author?.username || profile.username,
          email: p.author?.email || profile.email,
          interests: p.author?.interests || [],
          followers: [],
          following: [],
          isPremium: false,
          avatar: toAbsolute(p.author?.avatar) || toAbsolute(profile.avatar) || undefined
        },
        content: p.content,
        imageUrl: toAbsolute(p.image) || toAbsolute(p.imageUrl) || (p.imagePublicId ? `${cloudinaryBase}/${p.imagePublicId}` : undefined),
        tags: p.tags || p.interests || [],
        likes: p.likes || [],
        commentCount: (typeof p.commentCount === 'number') ? p.commentCount : (Array.isArray(p.comments) ? p.comments.length : 0)
      }));

      setLikedPostsList(mapped);
      return mapped;
    } catch (err) {
      console.error('Unable to load liked posts:', err);
      setLikedPostsList([]);
      return [];
    } finally {
      setIsLoadingLikedPosts(false);
    }
  };

  const authPayload = parseJwtPayload(localStorage.getItem('authToken'));
  const authUserId = authPayload?.[_getProp(authPayload, ['_id', 'id', 'sub', 'userId'])];

  // Helper to find the first existing property name from a list
  function _getProp(obj: any, keys: string[]) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k;
    return keys[0];
  }

  // Determine owner: if no route param -> personal profile page (/profile). Show edit only if logged-in.
  // If routeUserId exists, show edit only when it equals the authenticated user's id.
  const isOwnProfile = routeUserId ? (Boolean(authUserId) && routeUserId === String(authUserId)) : Boolean(authUserId);

  // Show only posts returned from server as "liked". Do not fall back to mock data.
  const likedPostsData = likedPostsList;

  // userPosts will be provided by the server when available; otherwise fall back to mock data
  const userPosts = posts.length > 0 ? posts : mockPosts.filter((post) => post.author.id === currentUser.id);



  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('Lütfen önce giriş yapın');
        return;
      }
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to toggle like');

      const data = await res.json();
      const { likes, isLiked } = data.data;

      setPosts((prev) => prev.map((p) => {
        if (p.id === postId) {
          return { ...p, likes: likes };
        }
        return p;
      }));

      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // Update liked posts list shown in 'Beğendiklerim'
      setLikedPostsList((prev) => {
        if (isLiked) {
          // Try to add the post object from current `posts` if available
          const existing = posts.find((p) => p.id === postId);
          if (existing && !prev.find((x) => x.id === postId)) {
            return [existing, ...prev];
          }
          return prev;
        } else {
          return prev.filter((p) => p.id !== postId);
        }
      });

    } catch (err) {
      console.error('Like error:', err);
      toast.error('Beğeni işlemi başarısız');
    }
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  // Delete a post owned by the current user
  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?');
    if (!confirmed) return;
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Lütfen önce giriş yapın');
        return;
      }
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : Promise.resolve({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `Silme başarısız: ${res.status}`;
        toast.error(msg);
        return;
      }
      // remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Gönderi silindi');
    } catch (err) {
      console.error('Delete post failed', err);
      toast.error('Gönderi silinirken hata oluştu');
    }
  };
  // Edit flow: open modal, then save
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [showPostEditModal, setShowPostEditModal] = useState(false);
  const [editPostForm, setEditPostForm] = useState<{ title?: string; content: string; tags?: string; image?: string | null }>(() => ({ title: '', content: '', tags: '', image: null }));
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);
  const [editOptions, setEditOptions] = useState<string[]>(interestOptions);
  const [editSelectedInterests, setEditSelectedInterests] = useState<string[]>([]);
  const [editNewInterest, setEditNewInterest] = useState('');

  const openEditPost = (post: any) => {
    setEditingPost(post);
    const existingTags = (post.tags || post.interests || []).map((t: string) => String(t).trim()).filter(Boolean);
    setEditPostForm({ title: post.title || '', content: post.content || '', tags: existingTags.join(', '), image: post.imageUrl || null });
    // Ensure editOptions contains any tags that are present on the post so chips can render
    setEditOptions((prev) => {
      const merged = Array.from(new Set([...(prev || []), ...existingTags]));
      return merged;
    });
    setEditSelectedInterests(existingTags);
    setShowPostEditModal(true);
  };

  // helper: convert File to data URL (base64)
  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const saveEditedPost = async () => {
    if (!editingPost) return;
    setIsSavingPostEdit(true);
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Lütfen önce giriş yapın');
        return;
      }

      const body: any = { content: editPostForm.content };
      if (editPostForm.title !== undefined) body.title = editPostForm.title;
      // Prefer the chip-based selection (editSelectedInterests) if the user interacted with chips.
      // If the user typed into the tags input, fallback to that value.
      let tagsArray: string[] | undefined = undefined;
      if (Array.isArray(editSelectedInterests) && editSelectedInterests.length > 0) {
        tagsArray = editSelectedInterests.map((t) => String(t).trim()).filter(Boolean);
      } else if (editPostForm.tags !== undefined) {
        tagsArray = String(editPostForm.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      }
      if (tagsArray !== undefined) body.tags = tagsArray;
      // Handle image: if user removed image explicitly (null) and there was an existing image, send empty string to remove;
      // if user selected an image (data URL or url), send it; otherwise don't include image to keep unchanged.
      if (editPostForm.image !== undefined) {
        if (editPostForm.image === null) {
          // user cleared image
          body.image = '';
        } else if (typeof editPostForm.image === 'string' && editPostForm.image.trim()) {
          body.image = editPostForm.image;
        }
      }

      const res = await fetch(`${API_BASE}/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const data = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : Promise.resolve({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `Güncelleme başarısız: ${res.status}`;
        toast.error(msg);
        return;
      }
      const payload = data && (data.data || data) ? (data.data || data) : data;

      setPosts((prev) => prev.map((p) => p.id === editingPost.id ? {
        ...p,
        content: payload?.content || editPostForm.content,
        title: payload?.title || editPostForm.title || p.title,
        tags: payload?.tags || payload?.interests || (editPostForm.tags ? editPostForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : p.tags)
      } : p));

      setShowPostEditModal(false);
      setEditingPost(null);
      toast.success('Gönderi güncellendi');
    } catch (err) {
      console.error('Update post failed', err);
      toast.error('Gönderi güncellenirken hata oluştu');
    } finally {
      setIsSavingPostEdit(false);
    }
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
    // If route contains a userId, we should show that user's profile and posts.
    // Otherwise fetch the logged-in user's profile as before.
    const fetchProfile = async () => {
      try {
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
        const token = localStorage.getItem('authToken');

        if (routeUserId) {
          // Viewing someone else's profile: fetch their public profile by id (to get interests/bio/cover)
          setIsLoadingProfile(true);
          try {
            const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
            const res = await fetch(`${API_BASE}/api/auth/user/${routeUserId}`);
            if (res.ok) {
              const data = await res.json();
              const payload = data && (data.data || data) ? (data.data || data) : data;
              setProfile({ username: payload.username || `kullanıcı-${routeUserId.slice(-6)}`, email: '', interests: payload.interests || [], avatar: payload.avatar || '', cover: payload.cover || '', bio: payload.bio || '', id: routeUserId });
            } else {
              // fallback: still attempt to load posts and derive simple profile
              const returned = await fetchPostsForUser(routeUserId);
              if (returned && returned.length > 0) {
                const first = returned[0];
                setProfile({ username: first.author?.username || `kullanıcı-${routeUserId.slice(-6)}`, email: first.author?.email || '', interests: first.author?.interests || [], avatar: first.author?.avatar || '', cover: '', bio: '', id: routeUserId });
              } else {
                setProfile({ username: `kullanıcı-${routeUserId.slice(-6)}`, email: '', interests: [], avatar: '', cover: '', bio: '', id: routeUserId });
              }
            }
          } catch (err) {
            console.error('Failed to load public profile:', err);
            const returned = await fetchPostsForUser(routeUserId);
            if (returned && returned.length > 0) {
              const first = returned[0];
              setProfile({ username: first.author?.username || `kullanıcı-${routeUserId.slice(-6)}`, email: first.author?.email || '', interests: first.author?.interests || [], avatar: first.author?.avatar || '', cover: '', bio: '', id: routeUserId });
            } else {
              setProfile({ username: `kullanıcı-${routeUserId.slice(-6)}`, email: '', interests: [], avatar: '', cover: '', bio: '', id: routeUserId });
            }
          } finally {
            setIsLoadingProfile(false);
          }
          // still fetch posts for the user
          await fetchPostsForUser(routeUserId);
          // Also prefetch liked posts for the viewed user so the tab count is correct
          try { await fetchLikedPosts(routeUserId); } catch (e) { console.debug('prefetch liked posts failed', e); }
          return;
        }

        // No route user id — show authenticated user's profile
        if (!token) { setIsLoadingProfile(false); return; }
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
        const payload = data && data.data ? data.data : data;
        const userObj = { username: payload.username || '', email: payload.email || '', interests: payload.interests || [], avatar: payload.avatar || '', cover: payload.cover || '', bio: payload.bio || '', id: payload._id || payload.id };
        setProfile(userObj);
        setEditForm({ username: payload.username || '', email: payload.email || '', bio: payload.bio || '', interests: payload.interests || [] });
        setIsLoadingProfile(false);
        // after profile loaded, fetch that user's posts
        // If backend didn't return an id, use the authenticated "my-posts" endpoint instead of requiring an id
        if (userObj.id) {
          await fetchPostsForUser(userObj.id);
          // Prefetch authenticated user's liked posts so the tab shows correct count
          try { await fetchLikedPosts(); } catch (e) { console.debug('prefetch liked posts failed', e); }
        } else {
          await fetchPostsForUser('me');
          try { await fetchLikedPosts(); } catch (e) { console.debug('prefetch liked posts failed', e); }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setIsLoadingProfile(false);
      }
    };

    console.debug('ProfilePage mount: routeUserId=', routeUserId);
    fetchProfile();
    // If no route param (we're on /profile) try to fetch posts for the authenticated user early
    // This handles the case where Sidebar navigation goes to /profile before Sidebar has resolved the user's id.
    if (!routeUserId) {
      const token = localStorage.getItem('authToken');
      if (token) {
        // kick off posts load immediately; fetchProfile will also attempt later but that's fine
        fetchPostsForUser('me').catch((e) => console.debug('early fetchPostsForUser(me) failed', e));
        // also fetch liked posts early so the tab count is populated
        fetchLikedPosts().catch((e) => console.debug('early fetchLikedPosts failed', e));
      } else {
        // no token -> nothing to load
        setIsLoadingPosts(false);
      }
    }
  }, [routeUserId]);

  // When user opens the 'Beğendiklerim' tab, fetch liked posts for the viewed profile (or authenticated user)
  useEffect(() => {
    if (activeTab !== 'liked') return;
    // If routeUserId exists, try to fetch that user's liked posts (public endpoint)
    if (routeUserId) {
      fetchLikedPosts(routeUserId).catch((e) => console.debug('fetchLikedPosts failed', e));
    } else {
      // No route user -> fetch authenticated user's liked posts
      fetchLikedPosts().catch((e) => console.debug('fetchLikedPosts failed', e));
    }
  }, [activeTab, routeUserId]);

  // Fetch posts for profile user
  const fetchPostsForUser = async (userId?: string) => {
    if (!userId) {
      console.debug('No userId provided, skipping posts fetch');
      setIsLoadingPosts(false);
      return [];
    }

    setIsLoadingPosts(true);
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      let url;
      if (userId === 'me') {
        const token = localStorage.getItem('authToken');
        if (token && profile.id) {
          url = `${API_BASE}/api/posts/user/${encodeURIComponent(profile.id)}`;
        } else {
          url = `${API_BASE}/api/posts/my-posts`; // fallback
        }
      } else {
        // Validate userId to prevent empty/invalid values
        const safeId = String(userId).trim();
        if (!safeId || safeId === 'me') {
          url = `${API_BASE}/api/posts/my-posts`;
        } else {
          url = `${API_BASE}/api/posts/user/${encodeURIComponent(safeId)}`;
        }
      }

      console.debug('Fetching posts from:', url);
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to load posts (${res.status}):`, errorText);

        // If it's a 400 error, try alternative approach
        if (res.status === 400 && userId !== 'me') {
          console.debug('400 error, trying my-posts endpoint instead');
          const myPostsUrl = `${API_BASE}/api/posts/my-posts`;
          const myPostsRes = await fetch(myPostsUrl, { headers });

          if (myPostsRes.ok) {
            const data = await myPostsRes.json();
            return processPostsData(data, profile);
          }
        }

        setPosts([]);
        return [];
      }

      const data = await res.json();
      return processPostsData(data, profile);

    } catch (err) {
      console.error('Unable to load user posts:', err);
      setPosts([]);
      return [];
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Helper function to process posts data
  const processPostsData = (data: any, profile: any) => {
    const postsFromServer = data?.data || data || [];
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
    const cloudinaryBase = ((import.meta as any).env?.VITE_CLOUDINARY_BASE as string) || 'https://res.cloudinary.com/dgjodxmkv/image/upload';

    const toAbsolute = (url?: string) => {
      if (!url) return undefined;
      const trimmed = String(url).trim();
      if (!trimmed) return undefined;
      if (trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('//')) return trimmed;
      if (trimmed.startsWith('/')) return API_BASE + trimmed;
      return API_BASE + '/' + trimmed;
    };

    const mapped = postsFromServer.map((p: any) => ({
      id: p._id || p.id,
      author: {
        id: p.author?._id || p.author?.id || profile.id,
        username: p.author?.username || profile.username,
        email: p.author?.email || profile.email,
        interests: p.author?.interests || [],
        followers: [],
        following: [],
        isPremium: false,
        avatar: toAbsolute(p.author?.avatar) || toAbsolute(profile.avatar) || undefined
      },
      content: p.content,
      imageUrl: toAbsolute(p.image) || toAbsolute(p.imageUrl) ||
        (p.imagePublicId ? `${cloudinaryBase}/${p.imagePublicId}` : undefined),
      tags: p.tags || p.interests || [],
      likes: p.likes || [],
      commentCount: (typeof p.commentCount === 'number') ? p.commentCount : (Array.isArray(p.comments) ? p.comments.length : 0)
    }));

    // Persist into local state and return the mapped data
    setPosts(mapped);
    return mapped;
  };

  // Save profile from edit modal
  const handleSaveProfile = async () => {
    const isSameInterests = (a: string[] = [], b: string[] = []) => {
      const na = (a || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean).sort();
      const nb = (b || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean).sort();
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

    if (!hasChanges()) {
      setShowEditModal(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem('authToken');
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

      const data = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : Promise.resolve({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setSaveError(msg);
        try { toast.error(msg); } catch (e) { /* ignore */ }
        return;
      }

      const payload = data && data.data ? data.data : data;
      const updated = {
        username: payload.username || editForm.username || profile.username,
        email: payload.email || editForm.email || profile.email,
        interests: payload.interests || editForm.interests || profile.interests || [],
        avatar: payload.avatar || profile.avatar || '',
        cover: payload.cover || profile.cover || '',
        bio: payload.bio || editForm.bio || profile.bio || ''
      };

      setProfile(updated);
      setEditForm({ username: updated.username, email: updated.email, bio: updated.bio || '', interests: updated.interests || [] });
      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated })); } catch (e) { /* ignore */ }
      setShowEditModal(false);
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
            const payload = data && data.data ? data.data : data;
            setProfile((prev) => ({ ...prev, avatar: payload.avatar || prev.avatar, cover: payload.cover || prev.cover }));
            // notify other components (e.g., Sidebar) about profile change
            try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar: payload.avatar, cover: payload.cover } })); } catch (e) { /* ignore */ }
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
              {isOwnProfile && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditProfile();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 mt-14"
                  style={{ cursor: 'pointer', zIndex: 10 }}
                >
                  <Settings className="w-4 h-4" />
                  <span>Profili Düzenle</span>
                </button>
              )}
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
              {(profile.interests || []).map((interest: string) => (
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
            className={`flex-1 px-4 py-3 transition-all ${activeTab === 'posts'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Gönderiler ({isLoadingPosts ? '...' : userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 px-4 py-3 transition-all ${activeTab === 'liked'
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
          {isLoadingPosts ? (
            <div className="p-6 bg-white border border-gray-200 rounded-2xl">Yükleniyor...</div>
          ) : (
            userPosts.map((post) => (
              <div key={post.id}>
                <Post
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  isLiked={likedPosts.has(post.id)}
                  onEdit={isOwnProfile ? openEditPost : undefined}
                  onDelete={isOwnProfile ? handleDeletePost : undefined}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Image lightbox/modal */}
      {lightboxSrc && (
        <ImageModal src={lightboxSrc} alt="Görüntü" onClose={() => setLightboxSrc(null)} />
      )}

      {/* Post Edit Modal */}
      {showPostEditModal && (
        <div
          onClick={() => { setShowPostEditModal(false); setEditingPost(null); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Gönderiyi Düzenle</h3>
              <button onClick={() => { setShowPostEditModal(false); setEditingPost(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-600" /></button>
            </div>
            <div className="p-4">
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
                  value={editPostForm.content}
                  onChange={(e) => setEditPostForm((s) => ({ ...s, content: e.target.value }))}
                  placeholder="Ne düşünüyorsun?"
                  className="flex-1 resize-none border-none focus:outline-none focus:ring-0 text-gray-800"
                  rows={4}
                />
              </div>

              {/* Image preview */}
              {editPostForm.image && (
                <div className="mt-3 relative overflow-hidden rounded-xl border border-gray-200 flex justify-center bg-gray-50">
                  <img src={editPostForm.image ?? undefined} alt="preview" className="max-w-full max-h-96 object-scale-down" />
                  <button
                    onClick={() => setEditPostForm((s) => ({ ...s, image: null }))}
                    className="absolute top-1 right-1 bg-red-500 text-black rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold z-10 shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editOptions.map((opt) => {
                      const active = editSelectedInterests.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            setEditSelectedInterests((prev) => prev.includes(opt) ? prev.filter((i) => i !== opt) : [...prev, opt]);
                          }}
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
                        id="edit-new-interest"
                        name="editNewInterest"
                        type="text"
                        placeholder="Yeni ilgi alanı ekle..."
                        value={editNewInterest}
                        onChange={(e) => setEditNewInterest(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (editNewInterest || '').trim();
                        if (!val) return toast.error('Lütfen bir ilgi alanı yazın');
                        const exists = editOptions.some(o => o.toLowerCase() === val.toLowerCase());
                        if (exists) {
                          if (!editSelectedInterests.includes(val)) setEditSelectedInterests((p) => [...p, val]);
                          setEditNewInterest('');
                          return;
                        }
                        setEditOptions((prev) => [...prev, val]);
                        setEditSelectedInterests((p) => [...p, val]);
                        setEditNewInterest('');
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
                    id="edit-post-image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) { toast.error("Resim 5MB'den büyük olamaz"); return; }
                      try {
                        const dataUrl = await fileToDataUrl(f);
                        setEditPostForm((s) => ({ ...s, image: dataUrl }));
                      } catch (err) {
                        console.error('File to data URL failed', err);
                        toast.error('Resim okunamadı');
                      }
                    }}
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  onClick={saveEditedPost}
                  disabled={isSavingPostEdit}
                  className="ml-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  {isSavingPostEdit ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button onClick={() => { setShowPostEditModal(false); setEditingPost(null); }} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">İptal</button>
              <button onClick={saveEditedPost} disabled={isSavingPostEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">{isSavingPostEdit ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'liked' && (
        <div className="space-y-4">
          {isLoadingLikedPosts ? (
            <div className="p-6 bg-white border border-gray-200 rounded-2xl">Yükleniyor...</div>
          ) : (likedPostsData.length > 0 ? (
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
          ))}
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
                    <img src={previewUrl ?? undefined} alt="preview" className="w-full h-full object-cover" />
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
                        <img src={previewUrl ?? undefined} alt="mini-preview" className="w-full h-full object-cover" />
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
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
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
                          setEditForm({ ...editForm, interests: newInterests });
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

