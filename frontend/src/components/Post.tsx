import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Post as PostType } from '../lib/mockData';
import { Send } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface PostProps {
  post: PostType;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  isLiked: boolean;
  onEdit?: (post: PostType) => void;
  onDelete?: (postId: string) => void;
}

// Function to determine like emoji based on like count
function getLikeEmoji(likeCount: number): string {
  if (likeCount < 1000) return '👍';
  if (likeCount < 2000) return '❤️';
  if (likeCount < 3000) return '🔥';
  if (likeCount < 4000) return '🌟';
  return '💎';
}

// Format like count
function formatLikeCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
  return (count / 1000000).toFixed(1) + 'M';
}

// Format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'az önce';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' dakika önce';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' saat önce';
  return Math.floor(seconds / 86400) + ' gün önce';
}

export function Post({ post, onLike, onComment, isLiked, onEdit, onDelete }: PostProps) {
  const navigate = useNavigate();
  const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:3000';
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; author: { id?: string; username: string; avatar?: string }; content: string; createdAt: string }>>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState<number>(
    // Prefer explicit commentCount if present, otherwise fall back to comments array length if provided by the API
    (post as any)?.commentCount ?? (Array.isArray((post as any)?.comments) ? (post as any).comments.length : 0)
  );
  const [previewComments, setPreviewComments] = useState<Array<{ id: string; author: { id?: string; username: string; avatar?: string }; content: string; createdAt: string }>>([]);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string; username?: string; avatar?: string } | null>(null);

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

  const currentUserAvatar = useMemo(() => {
    if (!currentUser) return null;
    return currentUser.avatar || (currentUser.username ? currentUser.username.charAt(0).toUpperCase() : null);
  }, [currentUser]);
  const likeCount = post.likes.length;
  const likeEmoji = getLikeEmoji(likeCount);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
      {/* Post Header */}
  <div className="p-4 flex items-start gap-3 relative">
        {/* Avatar: if it's a URL (uploaded image) show the image, otherwise show emoji/text */}
        {post.author.avatar && (typeof post.author.avatar === 'string' && (post.author.avatar.startsWith('http') || post.author.avatar.startsWith('data:'))) ? (
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => { post.author.id && navigate(`/profile/${post.author.id}`); }}>
            <ImageWithFallback
              src={post.author.avatar}
              alt={post.author.username || 'avatar'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => { post.author.id && navigate(`/profile/${post.author.id}`); }}>
            <span className="text-2xl">{post.author.avatar}</span>
          </div>
        )}
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
        {/* three-dot menu positioned in header (top-right) */}
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
              <div className="right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50" style={{ position: 'absolute' }}>
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

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
  <div className="px-4 pb-3">
    <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center">
      <ImageWithFallback
        src={post.imageUrl}
        alt="Post image"
        className="max-w-full max-h-96 object-scale-down"
      />
    </div>
  </div>
)}

      {/* Inline preview comments (1-2 most recent) */}
      {previewComments.length > 0 && !showComments && (
        <div className="px-4 pb-3 border-t border-gray-100 bg-white">
          <div className="space-y-3">
            {previewComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6b7280,#374151)' }}>
                  {typeof c.author.avatar === 'string' && (c.author.avatar.startsWith('http') || c.author.avatar.startsWith('data:')) ? (
                    <ImageWithFallback src={c.author.avatar} alt={c.author.username || 'avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm">{c.author.avatar || (c.author.username ? c.author.username.charAt(0).toUpperCase() : '�')}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 break-words text-sm">@{c.author.username}</p>
                  <p className="text-gray-700 text-sm mt-1 break-words whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setShowComments(true);
                // focus after render
                setTimeout(() => commentInputRef.current?.focus(), 0);
              }}
              className="text-sm text-gray-500 hover:underline"
            >
              Tüm {localCommentCount} yorumu göster
            </button>
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            isLiked
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

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
              {currentUserAvatar ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm">{currentUserAvatar}</span>
                </div>
              ) : (
                // If the post author's avatar is a URL, show the image; otherwise show the raw avatar text/letter
                typeof post.author.avatar === 'string' && (post.author.avatar.startsWith('http') || post.author.avatar.startsWith('data:')) ? (
                  <ImageWithFallback src={post.author.avatar} alt={post.author.username || 'avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm">{post.author.avatar}</span>
                  </div>
                )
              )}
            </div>
            <input
              ref={commentInputRef}
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
              disabled={submittingComment}
            />
            <button
              onClick={async () => { if (newComment.trim()) await submitComment(); commentInputRef.current?.focus(); }}
              disabled={submittingComment || !newComment.trim()}
              aria-label="Yorumu gönder"
              className="ml-2 p-2 rounded-full bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="space-y-3">
              {commentsLoading ? (
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-500">Henüz yorum yok. İlk yorumu siz yazın!</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6b7280,#374151)' }}>
                    {typeof c.author.avatar === 'string' && (c.author.avatar.startsWith('http') || c.author.avatar.startsWith('data:')) ? (
                      <ImageWithFallback src={c.author.avatar} alt={c.author.username || 'avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm">{c.author.avatar || (c.author.username ? c.author.username.charAt(0).toUpperCase() : '�')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 break-words">@{c.author.username}</p>
                    <p className="text-gray-700 text-sm mt-1 break-words whitespace-pre-wrap">{c.content}</p>
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
      method: 'POST',
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
      if (!post) return;
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

    // Fetch preview once when preview is empty (works after refresh even if count not provided)
    if (previewComments.length === 0) {
      fetchPreview();
    }

    return () => { mounted = false; };
  }, [localCommentCount, post?.id]);
}

