import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { mockPosts } from '../../lib/mockData';

export function TrendingPostsPage() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();

  // Sayfa yüklendiğinde veya topic değiştiğinde en üste kaydır
  // behavior: 'auto' = anında kaydırır (hızlı), 'smooth' = yumuşak animasyonlu kaydırır
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [topic]);

  // Konu adını tag'lere eşleştirme mapping'i
  const topicToTagsMap: Record<string, string[]> = {
    'yapay zeka': ['yapay zeka', 'ai'],
    'süper lig': ['spor', 'futbol'],
    'react 19': ['react', 'yazılım', 'teknoloji'],
    'dijital sanat': ['sanat', 'tasarım'],
    'teknoloji': ['teknoloji'],
    'spor': ['spor', 'futbol'],
    'müzik': ['müzik', 'gitar', 'cover'],
    'oyun': ['oyun', 'e-spor'],
    'tasarım': ['tasarım', 'minimalizm'],
    'yazılım': ['yazılım', 'react', 'teknoloji']
  };

  // Konuya göre gönderileri filtrele ve sırala
  const filteredPosts = useMemo(() => {
    if (!topic) return [];

    const decodedTopic = decodeURIComponent(topic).toLowerCase().trim();
    
    // Mapping'den tag'leri al, yoksa direkt konu adını kullan
    const searchTags = topicToTagsMap[decodedTopic] || [decodedTopic];
    
    return [...mockPosts]
      .filter((post) => 
        post.tags.some((tag: string) => {
          const normalizedTag = tag.toLowerCase().trim();
          return searchTags.some(searchTag => 
            normalizedTag === searchTag || 
            normalizedTag.includes(searchTag) ||
            searchTag.includes(normalizedTag)
          );
        })
      )
      .sort((a, b) => b.likes.length - a.likes.length);
  }, [topic]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/trending')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Trendler'e Dön</span>
        </button>
        
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            #{topic ? decodeURIComponent(topic) : 'Tüm Konular'}
          </h2>
          <p className="text-gray-600">
            {filteredPosts.length} gönderi bulundu
          </p>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">Bu konuya ait gönderi bulunamadı</p>
          <p className="text-gray-400 text-sm">Başka bir konu deneyin</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">{post.author.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-gray-900 font-semibold">@{post.author.username}</p>
                    {post.author.isPremium && (
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-400 text-sm">
                      {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-auto max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">
                    {post.likes.length.toLocaleString('tr-TR')} beğeni
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.commentCount} yorum</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
