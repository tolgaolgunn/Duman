import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';

interface UserBrief {
  id?: string;
  username?: string;
  avatar?: string;
  isPremium?: boolean;
}

interface PostDetail {
  id: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  author: UserBrief;
  likes: string[];
  commentCount: number;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: UserBrief;
}

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [postId]);

  useEffect(() => {
    // Fetch post and comments from API. Make comment parsing tolerant to a few server shapes
    const fetchComments = async () => {
      // If postId is not a valid Mongo ObjectId, skip network fetch to avoid backend 400
      const isValidObjectId = typeof postId === 'string' && /^[a-fA-F0-9]{24}$/.test(postId);
      if (!isValidObjectId) return [];
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const text = await res.text();
        let json: any = null;
        try { json = JSON.parse(text); } catch { json = text; }
        console.debug('GET /comments response:', res.status, json);

        if (res.ok) {
          if (Array.isArray(json)) return json;
          if (json && Array.isArray(json.data)) return json.data;
          // fallback: empty
          return [];
        }
        return [];
      } catch (e) {
        console.error('Fetch comments failed', e);
        return [];
      }
    };

    const fetchPost = async () => {
      const isValidObjectId = typeof postId === 'string' && /^[a-fA-F0-9]{24}$/.test(postId);
      if (!isValidObjectId) return null;
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const json = await res.json().catch(() => null);
        console.debug('GET /posts/:postId response:', res.status, json);
        if (!res.ok) throw new Error('Gönderi alınamadı');
        return json?.data || json;
      } catch (e) {
        console.error('Fetch post failed', e);
        return null;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([fetchPost(), fetchComments()]);
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const Avatar: React.FC<{ src?: string; size?: 'lg' | 'sm'; alt?: string }> = ({ src, size = 'lg', alt }) => {
    const imgClass = size === 'lg' ? 'w-12 h-12 rounded-full object-cover' : 'w-8 h-8 rounded-full object-cover';
    const fallbackClass = size === 'lg' ? 'w-12 h-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center' : 'w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center';

    if (src && /^https?:\/\//i.test(src)) {
      return <img src={src} alt={alt || 'avatar'} className={imgClass} />;
    }

    // If src is not a URL, show first character or the raw src (which may be an emoji)
    const content = src ? (src.length === 1 ? src : src.charAt(0)) : (alt ? alt.charAt(0) : '?');
    return <div className={fallbackClass} aria-hidden>{content}</div>;
  };

  const ensureAbsoluteUrl = (src?: string) => {
    if (!src) return undefined;
    try {
      // If already absolute or protocol-relative, return as-is
      if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) return src;

      // If path starts with '/', prefix with origin
      if (src.startsWith('/')) {
        if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin + src;
        return src;
      }

      // If looks like a cloudinary or remote host without protocol, add https://
      if (src.includes('res.cloudinary.com') || src.includes('/image/upload/')) {
        return 'https://' + src.replace(/^https?:\/\//i, '');
      }

      // fallback: return as-is
      return src;
    } catch (e) {
      return src;
    }
  };

  const formatLikeCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const renderRichContent = (content?: string) => {
    if (!content) return null;
    const parts = content.split(/(\s+)/);

    return (
      <div className="break-words whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part.match(/^\s+$/)) {
            return <span key={index}>{part}</span>;
          }

          if (part.match(/^https?:\/\//i)) {
            const cleanUrl = part.replace(/[.,;!?)]+$/, '');
            const trailingChar = part.slice(cleanUrl.length);
            const isImage = 
              /\.(jpe?g|png|gif|webp|svg|bmp|tiff)(\?|$)/i.test(cleanUrl) || 
              cleanUrl.includes('res.cloudinary.com') || 
              cleanUrl.includes('/image/upload/');

            if (isImage) {
              return (
                <React.Fragment key={index}>
                  <div className="block my-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm max-w-full">
                    <img
                      src={ensureAbsoluteUrl(cleanUrl)}
                      alt="Görsel"
                      className="w-full h-auto max-h-[500px] object-contain bg-gray-50"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('hidden');
                      }}
                    />
                  </div>
                  {trailingChar && <span>{trailingChar}</span>}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={index}>
                <a 
                  href={cleanUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {cleanUrl}
                </a>
                {trailingChar && <span>{trailingChar}</span>}
              </React.Fragment>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const targetPostId = post?.id || postId;
      const res = await fetch(`/api/posts/${targetPostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      if (!res.ok) {
        const text = await res.text();
        let json = {} as any;
        try { json = JSON.parse(text); } catch {}
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      const text = await res.text();
      const data = (() => { try { return JSON.parse(text); } catch { return text; } })();
      console.debug('POST /comments response', res.status, data);
      const created = data?.data ?? null;
      if (created) {
        // Prepend and refresh count
        setComments((s) => [created, ...s]);
        setPost((p) => p ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p);
        setCommentText('');
      } else {
        // If server returned non-standard shape, re-fetch comments to ensure sync
        const targetPostId = post?.id || postId;
        const refreshRes = await fetch(`/api/posts/${targetPostId}/comments`);
        const refreshJson = await refreshRes.json().catch(() => null);
        const newList = Array.isArray(refreshJson) ? refreshJson : (refreshJson?.data || []);
        setComments(Array.isArray(newList) ? newList : []);
        setPost((p) => p ? { ...p, commentCount: Array.isArray(newList) ? newList.length : (p.commentCount || 0) } : p);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment submit error', err);
      // You might want to show a toast here
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto">Yükleniyor...</div>;
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">Gönderi bulunamadı</p>
          <p className="text-gray-400 text-sm">Gönderi silinmiş veya mevcut değil</p>
        </div>
      </div>
    );
  }

  const isLiked = false; 
  try {
    // eslint-disable-next-line no-console
    console.debug('PostDetailPage imageUrl:', post?.imageUrl, 'normalized:', ensureAbsoluteUrl(post?.imageUrl));
  } catch (e) {}
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div>{/* Avatar */}
            <Avatar src={post.author.avatar} size="lg" alt={post.author.username} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-semibold">@{post.author.username}</p>
              {post.author.isPremium && (
                <Sparkles className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <p className="text-gray-500 text-sm">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <div className="text-gray-800 text-lg mb-4">{renderRichContent(post.content)}</div>

        {post.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={ensureAbsoluteUrl(post.imageUrl)}
              alt="Görsel"
              className="w-full h-auto max-h-96 object-contain"
              loading="lazy"
              onError={(e) => {
                // hide broken image gracefully
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('hidden');
              }}
            />
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isLiked ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-700'}`}>
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600' : ''}`} />
            <span>{formatLikeCount(post.likes?.length ?? 0)} beğeni</span>
          </button>

          <div className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount} yorum</span>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-all ml-auto">
            <Share2 className="w-5 h-5" />
            <span>Paylaş</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yorumlar ({comments.length})</h3>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Henüz yorum yok. İlk yorumu siz yapın!</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
                {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">{/** comment avatar */}
                  <Avatar src={comment.author.avatar} size="sm" alt={comment.author.username} />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-900 font-semibold text-sm">@{comment.author.username}</p>
                      {comment.author.isPremium && <Sparkles className="w-3 h-3 text-yellow-500" />}
                      <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="text-gray-700">{renderRichContent(comment.content)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-shrink-0">{/** input avatar */}
            <Avatar src={post.author.avatar} size="sm" alt={post.author.username} />
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Yorum yazın..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              rows={3}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              className="mt-2 px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
