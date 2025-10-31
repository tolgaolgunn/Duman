import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { mockPosts, mockComments, Comment } from '../../lib/mockData';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Sayfa yüklendiğinde veya postId değiştiğinde en üste kaydır
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [postId]);

  // Gönderiyi bul
  const post = useMemo(() => {
    return mockPosts.find(p => p.id === postId);
  }, [postId]);

  // Bu gönderiye ait yorumları filtrele
  const postComments = useMemo(() => {
    if (!post) return [];
    return mockComments
      .filter((comment: Comment) => comment.postId === post.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [post]);

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLikeCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const handleLike = () => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(post.id)) {
        newSet.delete(post.id);
      } else {
        newSet.add(post.id);
      }
      return newSet;
    });
  };

  const isLiked = likedPosts.has(post.id);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>
      </div>

      {/* Post Content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">{post.author.avatar}</div>
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

        {/* Post Text */}
        <p className="text-gray-800 text-lg mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* Post Image */}
        {post.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img 
              src={post.imageUrl} 
              alt="" 
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isLiked
                ? 'bg-red-50 text-red-600'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600' : ''}`} />
            <span>{formatLikeCount(post.likes.length)} beğeni</span>
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

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Yorumlar ({postComments.length})
        </h3>

        {postComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Henüz yorum yok. İlk yorumu siz yapın!</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {postComments.map((comment: Comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{comment.author.avatar}</div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-900 font-semibold text-sm">
                        @{comment.author.username}
                      </p>
                      {comment.author.isPremium && (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      <span className="text-gray-400 text-xs">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <div className="flex gap-3">
          <div className="text-2xl flex-shrink-0">{post.author.avatar}</div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Yorum yazın..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              rows={3}
            />
            <button
              onClick={() => {
                if (commentText.trim()) {
                  // TODO: Backend'e yorum gönderme işlemi burada yapılacak
                  console.log('Yorum gönderildi:', commentText);
                  setCommentText('');
                }
              }}
              disabled={!commentText.trim()}
              className="mt-2 px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Yorum Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
