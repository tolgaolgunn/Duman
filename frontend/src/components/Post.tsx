import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, Sparkles, Send, MoreVertical, Trash2, Edit2, X, Check } from 'lucide-react';
import { Post as PostType } from '../lib/mockData';
import { ImageWithFallback } from './ImageWithFallback';

interface CommentType {
  id: string;
  author: {
    id?: string;
    username: string;
    avatar?: string
  };
  content: string;
  createdAt: string;
}

interface PostProps {
  post: PostType;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  isLiked: boolean;
  onEdit?: (post: PostType) => void;
  onDelete?: (postId: string) => void;
}

// ------------------------------------
// YARDIMCI FONKSİYONLAR
// ------------------------------------

function getLikeEmoji(likeCount: number): string {
  if (likeCount < 1000) return '👍';
  if (likeCount < 2000) return '❤️';
  if (likeCount < 3000) return '🔥';
  if (likeCount < 4000) return '🌟';
  return '💎';
}

function formatLikeCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function getTimeAgo(date?: string | number | Date | null): string {
  if (!date) return '';
  let d: Date;
  if (date instanceof Date) d = date;
  else {
    d = new Date(date as any);
  }
  if (Number.isNaN(d.getTime())) return '';

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'az önce';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' dakika önce';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' saat önce';
  return Math.floor(seconds / 86400) + ' gün önce';
}

function stringToHslColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 50%, 40%)`;
}

const decodeJwt = (token?: string | null) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(atob(b));
  } catch (e) {
    return null;
  }
};

// Render text that may contain URLs: render images for image URLs, links for other URLs, keep plain text otherwise
function renderRichContent(content?: string, className = ''): React.ReactNode {
  if (!content) return null;
  const normalized = String(content).replace(/\\\//g, '/').replace(/&amp;/g, '&');
  const urlPattern = new RegExp('https?:\\/\\/\\S+', 'g');
  const segments: Array<{ type: 'text' | 'url'; text: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(normalized)) !== null) {
    const full = match[0];
    const index = match.index;
    if (index > lastIndex) segments.push({ type: 'text', text: normalized.slice(lastIndex, index) });

    const cleanUrl = full.replace(/[.,;!?)]+$/, '');
    const trailing = full.slice(cleanUrl.length);
    segments.push({ type: 'url', text: cleanUrl });
    if (trailing) segments.push({ type: 'text', text: trailing });

    lastIndex = index + full.length;
  }
  if (lastIndex < normalized.length) segments.push({ type: 'text', text: normalized.slice(lastIndex) });

  return (
    <div className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') return <span key={idx}>{seg.text}</span>;
        const url = seg.text;
        const isImage = /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('res.cloudinary.com') || url.includes('/image/upload/');
        if (isImage) {
          return (
            <div key={idx} className="mb-3">
              <img src={ensureAbsoluteUrl(url)} alt="attachment" className="w-full max-h-80 object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('hidden'); }} loading="lazy" />
            </div>
          );
        }
        return (
          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-words">
            {url}
          </a>
        );
      })}
    </div>
  );
}

const ensureAbsoluteUrl = (src?: string) => {
  if (!src) return src;
  try {
    if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) return src;
    if (src.startsWith('/')) {
      if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin + src;
      return src;
    }
    if (src.includes('res.cloudinary.com') || src.includes('/image/upload/')) {
      return 'https://' + src.replace(/^https?:\/\//i, '');
    }
    return src;
  } catch (e) {
    return src;
  }
};



export function Post({ post, onLike, onComment, isLiked, onEdit, onDelete }: PostProps) {
  const navigate = useNavigate();

  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState<number>(
    (post as any)?.commentCount ?? (Array.isArray((post as any)?.comments) ? (post as any).comments.length : 0)
  );
  const [previewComments, setPreviewComments] = useState<CommentType[]>([]);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string; username?: string; avatar?: string } | null>(null);

  // State for tracking active menus and edit modes
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeCommentMenuId && !(event.target as Element).closest('.comment-menu-trigger') && !(event.target as Element).closest('.comment-menu-dropdown')) {
        setActiveCommentMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCommentMenuId]);

  const handleEditClick = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
    setActiveCommentMenuId(null);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editCommentContent })
      });

      if (res.ok) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c));
        setPreviewComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c));
        setEditingCommentId(null);
        toast.success('Yorum güncellendi');
      } else {
        toast.error('Yorum güncellenemedi');
      }
    } catch (e) {
      console.error(e);
      toast.error('Hata oluştu');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPreviewComments(prev => prev.filter(c => c.id !== commentId));
        setLocalCommentCount(prev => prev - 1);
        toast.success('Yorum silindi');
      } else {
        toast.error('Yorum silinemedi');
      }
    } catch (e) {
      console.error(e);
      toast.error('Hata oluştu');
    }
    setActiveCommentMenuId(null);
  };

  // Check whether a token is present in localStorage (used to allow commenting
  // even when JWT payload doesn't include a username). We read it directly
  // so the input can be enabled immediately after login.
  const hasAuthToken = Boolean(
    (localStorage.getItem('token') || localStorage.getItem('authToken'))
  );

  // Checks a failed response for auth/token expiry and handles it.
  // If `redirect` is true, navigates to login. Returns true when handled.
  const handleAuthError = (status: number, payload: any, redirect = false) => {
    const msg = (payload && (payload.error || payload.message)) || '';
    const looksLikeTokenError = status === 401 || /token|expired|jwt/i.test(String(msg));
    if (looksLikeTokenError) {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
      } catch (e) { }
      setCurrentUser(null);
      try { toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'); } catch (e) { }
      if (redirect) {
        navigate('/login');
      }
      return true;
    }
    return false;
  };


  const currentUserAvatar = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:'))) {
      return currentUser.avatar;
    }
    return currentUser.username ? currentUser.username.charAt(0).toUpperCase() : null;
  }, [currentUser]);

  const likeCount = post.likes.length;
  const likeEmoji = getLikeEmoji(likeCount);

  // Debug: show original and normalized post image URL
  try {
    // eslint-disable-next-line no-console
    console.debug('Post component imageUrl:', (post as any).imageUrl, 'normalized:', ensureAbsoluteUrl((post as any).imageUrl));
  } catch (e) { }


  const submitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);

    const commentToSend = newComment.trim();

    try {
      // If this post uses a mock/local id (not a 24-char Mongo ObjectId), don't call backend
      const isValidObjectId = typeof post.id === 'string' && /^[a-fA-F0-9]{24}$/.test(post.id);
      if (!isValidObjectId) {
        console.debug('submitComment: skipping network call for mock post id', post.id);
        setSubmittingComment(false);
        return;
      }
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentToSend }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { error: text }; }
        // If it's an auth error (expired token), handle it centrally and redirect the user.
        if (handleAuthError(res.status, json, true)) {
          setSubmittingComment(false);
          return;
        }
        const msg = json?.error || `Yorum gönderilemedi: ${res.status}`;
        toast.error(msg);
        throw new Error(msg);
      }

      const responseData = await res.json();
      const createdComment = responseData.data || responseData;

      if (createdComment && createdComment.content) {
        setComments((s) => [createdComment, ...s]);
        setLocalCommentCount((c) => c + 1);
        // Yeni yorumu eklerken önizlemeyi de güncelle (sadece ilk 1 yorumu koru)
        setPreviewComments((p) => [createdComment, ...p].slice(0, 1));
        setNewComment('');
      } else {
        throw new Error('Yorum oluşturma yanıtı geçersiz.');
      }
    } catch (err: any) {
      console.error('Yorum gönderme hatası:', err);
      try { toast.error(err?.message || 'Yorum gönderilemedi'); } catch (e) { }
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, post.id, setComments, setLocalCommentCount, setPreviewComments]);


  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      // Avoid fetching comments for mock posts with non-ObjectId ids
      const isValidObjectId = typeof post.id === 'string' && /^[a-fA-F0-9]{24}$/.test(post.id);
      if (!isValidObjectId) {
        setComments([]);
        setPreviewComments([]);
        setCommentsLoading(false);
        return;
      }
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/posts/${post.id}/comments`, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { error: text }; }
        if (handleAuthError(res.status, json, false)) {
          setComments([]);
          setPreviewComments([]);
          setCommentsLoading(false);
          return;
        }
        throw new Error(`Yorumlar alınamadı: ${res.status}`);
      }

      const dataText = await res.text();
      let parsed: any = {};
      try { parsed = JSON.parse(dataText); } catch { /* Ignore */ }

      let list: CommentType[] = [];
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data;
      else if (parsed && Array.isArray(parsed.comments)) list = parsed.comments;

      if (list.length) {
        setComments(list);
        setLocalCommentCount(list.length);
        // ÖNİZLEME DÜZELTİLDİ: Sadece ilk 1 yorum gösteriliyor
        setPreviewComments(list.slice(0, 1));
      } else {
        setComments([]);
        setPreviewComments([]);
      }
    } catch (err) {
      console.error('Yorumları yükleme hatası:', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  // ------------------------------------
  // USE EFFECT'LER
  // ------------------------------------

  // 1. Mevcut kullanıcıyı yükle
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const decoded = decodeJwt(token);
    if (decoded && decoded.username) {
      setCurrentUser({
        id: decoded.id || decoded.userId,
        username: decoded.username,
        avatar: decoded.avatar,
      });
    } else {
      setCurrentUser(null);
    }
  }, []);


  // 2. Yorumları Göster/Gizle durumuna göre yorumları çek
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);

  // 3. Yorum önizlemesini çek
  useEffect(() => {
    let mounted = true;
    const fetchPreview = async () => {
      // Skip preview fetch for mock posts
      const isValidObjectId = typeof post?.id === 'string' && /^[a-fA-F0-9]{24}$/.test(post?.id);
      if (!isValidObjectId) return;
      if (post?.id && previewComments.length === 0) {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`/api/posts/${post.id}/comments`, { headers });
          if (!res.ok) return;

          const dataText = await res.text().catch(() => null);
          let data: any = {};
          if (typeof dataText === 'string') {
            try { data = JSON.parse(dataText); } catch { /* Ignore */ }
          }
          const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.comments) ? data.comments : []));

          if (mounted && Array.isArray(list) && list.length) {
            // ÖNİZLEME DÜZELTİLDİ: Sadece ilk 1 yorum gösteriliyor
            setPreviewComments(list.slice(0, 1));
          }
        } catch (e) {
          console.debug('fetchPreview error', e);
        }
      }
    };

    fetchPreview();

    return () => { mounted = false; };
  }, [post?.id, previewComments.length]);

  // Helper for safe ID comparison
  const isOwner = (currentId?: string, targetId?: string) => {
    if (!currentId || !targetId) return false;
    return String(currentId) === String(targetId);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition-all">

      {/* Post Header */}
      <div className="p-4 flex items-start gap-3 relative">
        {/* Yazar Avatarı */}
        {post.author.avatar && (typeof post.author.avatar === 'string' && (post.author.avatar.startsWith('http') || post.author.avatar.startsWith('data:'))) ? (
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => { post.author.id && navigate(`/profile/${post.author.id}`); }}>
            <ImageWithFallback
              src={ensureAbsoluteUrl(post.author.avatar)}
              alt={post.author.username || 'avatar'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: stringToHslColor(post.author.username || 'anonim') }}
            onClick={() => { post.author.id && navigate(`/profile/${post.author.id}`); }}
          >
            <span className="text-2xl text-white">{post.author.avatar || (post.author.username ? post.author.username.charAt(0).toUpperCase() : '?')}</span>
          </div>
        )}

        {/* Yazar Bilgisi ve Etiketler */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-gray-900 cursor-pointer" onClick={() => { post.author.id && navigate(`/profile/${post.author.id}`); }}>@{post.author.username}</p>
            {post.author.isPremium && (
              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">{getTimeAgo(post.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Üç Nokta Menüsü (Post için) */}
        {(typeof onEdit === 'function' || typeof onDelete === 'function') && (
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="px-2 py-1 rounded-full hover:bg-gray-100 text-gray-600"
              title="Daha fazla"
            >
              <span className="text-lg">⋯</span>
            </button>
            {menuOpen && (
              <div className="right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 absolute">
                <div className="py-1">
                  {typeof onEdit === 'function' && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(post); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      Düzenle
                    </button>
                  )}
                  {typeof onDelete === 'function' && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(post.id); }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post İçeriği */}
      <div className="px-4 pb-3">
        <div className="text-gray-800 whitespace-pre-wrap">{renderRichContent(post.content)}</div>
      </div>

      {/* Post Görseli */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center">
            <ImageWithFallback
              src={ensureAbsoluteUrl(post.imageUrl)}
              alt="Post image"
              className="max-w-full max-h-96 object-scale-down"
            />
          </div>
        </div>
      )}

      {/* Inline preview comments (1-2 most recent) */}
      {previewComments.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 bg-white">
          <div className="space-y-3">
            {previewComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: stringToHslColor(c.author.username || 'Anonim') }}
                >
                  {typeof c.author.avatar === 'string' && (c.author.avatar.startsWith('http') || c.author.avatar.startsWith('data:')) ? (
                    <ImageWithFallback src={ensureAbsoluteUrl(c.author.avatar)} alt={c.author.username || 'avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm text-white">{c.author.avatar || (c.author.username ? c.author.username.charAt(0).toUpperCase() : '')}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 break-words text-sm font-medium">@{c.author.username}</p>
                  <div className="text-gray-700 text-sm mt-1 break-words whitespace-pre-wrap">{renderRichContent(c.content)}</div>
                </div>
              </div>
            ))}
            <button onClick={() => { setShowComments(true); commentInputRef.current?.focus(); }} className="text-sm text-gray-500 hover:underline">Tüm {localCommentCount} yorumu göster</button>
          </div>
        </div>
      )}

      {/* Post Aksiyonları */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isLiked
            ? 'bg-gray-100 text-gray-800'
            : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <span className="text-xl">{likeEmoji}</span>
          <span>{formatLikeCount(likeCount)}</span>
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            onComment(post.id);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{localCommentCount}</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>


      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">

          {/* Yorum Ekleme Alanı */}
          <div className="flex gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: stringToHslColor(currentUser?.username || 'Anonim') }}
            >
              {(typeof currentUserAvatar === 'string' && (currentUserAvatar.startsWith('http') || currentUserAvatar.startsWith('data:'))) ? (
                <ImageWithFallback src={ensureAbsoluteUrl(currentUserAvatar)} alt={currentUser?.username || 'avatar'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm text-white">{currentUserAvatar || '?'}</span>
                </div>
              )}
            </div>
            <input
              ref={commentInputRef}
              id={`comment-${post.id}`}
              name="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newComment.trim()) return;
                  await submitComment();
                }
              }}
              type="text"
              placeholder="Yorumunuzu yazın..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              disabled={submittingComment || !hasAuthToken}
              aria-label="Yorum yaz"
            />
            <button
              onClick={async () => { await submitComment(); commentInputRef.current?.focus(); }}
              disabled={submittingComment || !newComment.trim() || !hasAuthToken}
              aria-label="Yorumu gönder"
              className="ml-2 p-2 rounded-full bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Yorum Listesi */}
          <div className="space-y-3">
            {commentsLoading ? (
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-500">Henüz yorum yok. İlk yorumu siz yazın!</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 group items-start">
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: stringToHslColor(c.author.username || 'Anonim') }}
                  >
                    {typeof c.author.avatar === 'string' && (c.author.avatar.startsWith('http') || c.author.avatar.startsWith('data:')) ? (
                      <ImageWithFallback src={ensureAbsoluteUrl(c.author.avatar)} alt={c.author.username || 'avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm text-white">{c.author.avatar || (c.author.username ? c.author.username.charAt(0).toUpperCase() : '')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 font-medium text-sm">@{c.author.username}</p>

                      {/* Comment Menu Trigger */}
                      {currentUser && (isOwner(currentUser.id, c.author.id) || isOwner(currentUser.id, post.author.id)) && editingCommentId !== c.id && (
                        <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id);
                            }}
                            className="comment-menu-trigger w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeCommentMenuId === c.id && (
                            <div className="comment-menu-dropdown absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                              {isOwner(currentUser.id, c.author.id) && (
                                <button
                                  onClick={() => handleEditClick(c)}
                                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit2 size={14} />
                                  Güncelle
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                Sil
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Content or Edit Form */}
                    {editingCommentId === c.id ? (
                      <div className="mt-1">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            İptal
                          </button>
                          <button
                            onClick={() => handleUpdateComment(c.id)}
                            className="px-3 py-1 text-xs text-blue-600 hover:bg-gray-100 rounded-md"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700 text-sm mt-0.5 break-words whitespace-pre-wrap">{renderRichContent(c.content)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  async function fetchComments() {
    setCommentsLoading(true);
    try {
      // Support both storage keys used in the app: some flows write 'token',
      // others write 'authToken'. Check both so requests include the JWT.
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, { headers });

      if (!res.ok) {
        throw new Error(`Yorumlar alınamadı: ${res.status}`);
      }

      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      console.debug('fetchComments response for post', post.id, res.status, parsed);

      // Normalize possible shapes: { success:true, data: [...] } OR [...] OR { data: [...] }
      let list: any[] = [];
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data;
      else if (parsed && Array.isArray(parsed.comments)) list = parsed.comments;

      if (list.length) {
        setComments(list);
        setLocalCommentCount(list.length);
        setPreviewComments(list.slice(0, 5));
      } else {
        // If the comments endpoint returned nothing, try fetching the post itself
        // (some server responses include comments on the post object)
        try {
          const postRes = await fetch(`${API_BASE}/api/posts/${post.id}`);
          if (postRes.ok) {
            const postText = await postRes.text();
            let postParsed: any = null;
            try { postParsed = JSON.parse(postText); } catch { postParsed = postText; }
            const maybeComments = Array.isArray(postParsed?.data?.comments)
              ? postParsed.data.comments
              : (Array.isArray(postParsed?.comments) ? postParsed.comments : []);
            if (maybeComments && maybeComments.length) {
              setComments(maybeComments);
              setLocalCommentCount(maybeComments.length);
              setPreviewComments(maybeComments.slice(0, 5));
              return;
            }
          }
        } catch (e) {
          console.debug('fetchComments fallback post fetch failed', e);
        }

        setComments([]);
        setPreviewComments([]);
        // If server returned something unexpected, keep comments empty but log for debugging
        if (res.ok && !list.length) console.debug('fetchComments: no comments found in response', parsed);
      }
    } catch (err) {
      console.error('Yorumları yükleme hatası:', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function submitComment() {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      // Support both storage keys used in the app
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) throw new Error('Yorum gönderilemedi');

      const responseData = await res.json();

      // Extract the comment from the response data
      const createdComment = responseData.data; // This is the key fix

      if (createdComment) {
        // Prepend new comment to list
        setComments((s) => [createdComment, ...s]);
        setLocalCommentCount((c) => c + 1);
        // also update preview (keep most recent two)
        setPreviewComments((p) => [createdComment, ...p].slice(0, 5));
        setNewComment('');
      } else {
        throw new Error('Yorum oluşturulamadı');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  }


  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  // Fetch a small preview of comments (1-2) for feed view so users see recent replies
  useEffect(() => {
    let mounted = true;
    const fetchPreview = async () => {
      if (!post || (localCommentCount || 0) <= 0) return;
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, { headers });
        if (!res.ok) return;
        const dataText = await res.text().catch(() => null);
        let data: any = null;
        if (typeof dataText === 'string') {
          try { data = JSON.parse(dataText); } catch { data = dataText; }
        } else {
          data = dataText;
        }
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.comments) ? data.comments : []));
        if (mounted) setPreviewComments(list.slice(0, 5));
      } catch (e) {
        // ignore preview errors
        console.debug('fetchPreview error', e);
      }
    };

    // Only fetch preview when comments are present and preview is empty
    if (previewComments.length === 0 && (localCommentCount || 0) > 0) {
      fetchPreview();
    }

    return () => { mounted = false; };
  }, [localCommentCount, post?.id]);
}

