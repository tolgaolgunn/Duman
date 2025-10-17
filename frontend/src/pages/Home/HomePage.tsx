import React, { useState } from 'react';
import { Plus, Filter, Image as ImageIcon } from 'lucide-react';
import { mockPosts, currentUser } from '../../lib/mockData';
import { Post } from '../../components/Post';

export function HomePage() {
  const [posts] = useState(mockPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const filteredPosts = selectedInterests.length > 0
    ? posts.filter((post) =>
        post.tags.some((tag) => selectedInterests.includes(tag))
      )
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
                    selectedInterests.includes(interest)
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{interest}
                </button>
              ))}
            </div>
            {selectedInterests.length > 0 && (
              <button
                onClick={() => setSelectedInterests([])}
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{currentUser.avatar}</span>
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Ne düşünüyorsun?"
              className="flex-1 resize-none border-none focus:outline-none focus:ring-0 text-gray-800"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Resim Ekle</span>
            </button>
            <button
              onClick={() => {
                if (newPostContent.trim()) {
                  setNewPostContent('');
                  setShowNewPost(false);
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
              onClick={() => setSelectedInterests([])}
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
