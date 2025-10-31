import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import { currentUser, trendingTopics, mockPosts, Post } from '../../lib/mockData';

export function TrendingPage() {
  const navigate = useNavigate();
  const [showAllTopics, setShowAllTopics] = useState(false);

  // En çok beğenilen ilk 5 gönderiyi büyükten küçüğe sırala
  const topPosts = useMemo(() => {
    return [...mockPosts]
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 5);
  }, []);

  // Konuları göster (5 veya 10)
  const displayedTopics = useMemo(() => {
    return showAllTopics ? trendingTopics : trendingTopics.slice(0, 5);
  }, [showAllTopics]);

  const handleTopicClick = (topicName: string) => {
    navigate(`/trending/trendingposts/${encodeURIComponent(topicName)}`);
  };

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-gray-900">Trendler</h2>
        </div>
        <p className="text-gray-600">
          En popüler konular ve en çok beğenilen gönderiler
        </p>
      </div>

      {/* AI Assistant Banner - Only for Premium Users */}
      {currentUser.isPremium && (
        <div className="bg-gradient-to-br from-yellow-50 to-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2 flex items-center gap-2">
                AI Gündem Asistanı
                <span className="px-2 py-0.5 bg-transparent text-yellow-500 text-xs rounded-full border border-yellow-500">
                  PREMIUM
                </span>
              </h3>
              <p className="text-gray-700 mb-4">
                Gündemdeki en önemli konuları AI ile analiz edip özetledik. İşte bugünün özeti:
              </p>
              <div className="space-y-3">
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="bg-white rounded-xl p-4 border border-red-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-900">{topic.topic}</h4>
                      <span className="text-black-600 text-sm">
                        {topic.postCount} gönderi
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h3 className="text-gray-900 mb-4">En Popüler Konular</h3>
        <div className="space-y-3">
          {displayedTopics.map((topic, index) => (
            <button
              key={topic.topic}
              onClick={() => handleTopicClick(topic.topic)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-1">#{topic.topic}</h4>
                <p className="text-gray-500 text-sm">{topic.postCount} gönderi</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
        {trendingTopics.length > 5 && !showAllTopics && (
          <button
            onClick={() => setShowAllTopics(true)}
            className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            Daha Fazlasını Göster
          </button>
        )}
      </div>

      {/* Top Posts */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-gray-900 mb-4">En Çok Beğenilen Gönderiler</h3>
        <div className="space-y-3">
          {topPosts.map((post, index) => (
            <button
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{post.author.avatar}</span>
                  <p className="text-gray-900">@{post.author.username}</p>
                  {post.author.isPremium && (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>❤️ {post.likes.length.toLocaleString('tr-TR')} beğeni</span>
                  <span>💬 {post.commentCount} yorum</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Non-Premium Call to Action */}
      {!currentUser.isPremium && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8 mt-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-gray-900 mb-2">Premium'a Geçin</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            AI Gündem Asistanı ile gündemdeki konuları özetleyin ve daha fazlasına erişin.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all">
            Premium'a Geç
          </button>
        </div>
      )}
    </div>
  );
}
