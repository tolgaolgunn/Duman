import React, { useState } from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { currentUser, mockPosts } from '../lib/mockData';
import { Post } from './Post';

export function ProfilePage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'interests'>('posts');

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
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
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 mt-14">
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
    </div>
  );
}
