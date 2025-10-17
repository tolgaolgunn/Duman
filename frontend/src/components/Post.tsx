import React, { useState } from 'react';
import { MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Post as PostType } from '../lib/mockData';
import { ImageWithFallback } from './ImageWithFallback';

interface PostProps {
  post: PostType;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  isLiked: boolean;
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

export function Post({ post, onLike, onComment, isLiked }: PostProps) {
  const [showComments, setShowComments] = useState(false);
  const likeCount = post.likes.length;
  const likeEmoji = getLikeEmoji(likeCount);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
      {/* Post Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{post.author.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-gray-900">@{post.author.username}</p>
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
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <ImageWithFallback
            src={post.imageUrl}
            alt="Post image"
            className="w-full rounded-xl object-cover max-h-96"
          />
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
          <span>{post.commentCount}</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-all ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">{post.author.avatar}</span>
            </div>
            <input
              type="text"
              placeholder="Yorumunuzu yazın..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
            />
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">👩‍🎨</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">@zeynep_kaya</p>
                <p className="text-gray-700 text-sm mt-1">Harika bir paylaşım! 👏</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
