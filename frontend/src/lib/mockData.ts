export interface User {
  id: string;
  username: string;
  email: string;
  interests: string[];
  followers: string[];
  following: string[];
  isPremium: boolean;
  avatar?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  text: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  user: User;
  text: string;
  timestamp: Date;
  room: string;
}

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    username: "ahmet_yilmaz",
    email: "ahmet@example.com",
    interests: ["teknoloji", "yapay zeka", "yazılım"],
    followers: ["2", "3", "4"],
    following: ["2", "3"],
    isPremium: true,
    avatar: "👨‍💻"
  },
  {
    id: "2",
    username: "zeynep_kaya",
    email: "zeynep@example.com",
    interests: ["sanat", "tasarım", "fotoğrafçılık"],
    followers: ["1", "3"],
    following: ["1", "4"],
    isPremium: false,
    avatar: "👩‍🎨"
  },
  {
    id: "3",
    username: "mehmet_demir",
    email: "mehmet@example.com",
    interests: ["spor", "futbol", "fitness"],
    followers: ["1", "2", "4"],
    following: ["1", "2"],
    isPremium: true,
    avatar: "⚽"
  },
  {
    id: "4",
    username: "ayse_aksoy",
    email: "ayse@example.com",
    interests: ["müzik", "konser", "gitar"],
    followers: ["1"],
    following: ["1", "2", "3"],
    isPremium: false,
    avatar: "🎵"
  },
  {
    id: "5",
    username: "can_ozturk",
    email: "can@example.com",
    interests: ["teknoloji", "oyun", "e-spor"],
    followers: ["1", "2"],
    following: ["1"],
    isPremium: true,
    avatar: "🎮"
  }
];

// Mock posts
export const mockPosts: Post[] = [
  {
    id: "1",
    author: mockUsers[0],
    content: "Yapay zeka modellerinin eğitiminde kullanılan yeni teknikler gerçekten etkileyici! GPT-4'ün ardından neler göreceğiz acaba? 🤖",
    tags: ["teknoloji", "yapay zeka"],
    likes: Array.from({ length: 3847 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    commentCount: 45
  },
  {
    id: "2",
    author: mockUsers[1],
    content: "Bugün Istanbul Modern'de muhteşem bir sergi gördüm. Dijital sanat ve geleneksel sanatın buluşması harika! 🎨",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
    tags: ["sanat", "sergi", "tasarım"],
    likes: Array.from({ length: 1256 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    commentCount: 23
  },
  {
    id: "3",
    author: mockUsers[2],
    content: "Galatasaray - Fenerbahçe derbisi için tahminleriniz neler? Ben 2-1 Galatasaray diyorum! ⚽🔥",
    tags: ["spor", "futbol"],
    likes: Array.from({ length: 5234 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    commentCount: 187
  },
  {
    id: "4",
    author: mockUsers[3],
    content: "Yeni gitarımla ilk cover'ımı çektim! Mor ve Ötesi - Bir Derdim Var. Linki biyografimde 🎸",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800",
    tags: ["müzik", "gitar", "cover"],
    likes: Array.from({ length: 892 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    commentCount: 34
  },
  {
    id: "5",
    author: mockUsers[4],
    content: "League of Legends yeni sezon yaması ile meta tamamen değişti. ADC'ler tekrar güçlendi! 🎮",
    tags: ["teknoloji", "oyun", "e-spor"],
    likes: Array.from({ length: 2167 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    commentCount: 67
  },
  {
    id: "6",
    author: mockUsers[0],
    content: "React 19'un yeni özellikleri çıktı! Server Components artık stabil. Full-stack React dönemi başlıyor 🚀",
    tags: ["teknoloji", "yazılım", "react"],
    likes: Array.from({ length: 4523 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    commentCount: 98
  },
  {
    id: "7",
    author: mockUsers[1],
    content: "Minimalist tasarım trendi 2025'te de devam ediyor. Az ama öz! ✨",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    tags: ["tasarım", "minimalizm"],
    likes: Array.from({ length: 678 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    commentCount: 19
  },
  {
    id: "8",
    author: mockUsers[0],
    content: "Machine Learning'de yeni bir breakthrough! Transformer mimarisi artık her yerde 🚀",
    tags: ["teknoloji", "yapay zeka"],
    likes: Array.from({ length: 2156 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    commentCount: 89
  },
  {
    id: "9",
    author: mockUsers[4],
    content: "Yapay zeka ile oyun geliştirme artık çok daha kolay. NPC'ler gerçekten zeki! 🎮🤖",
    tags: ["oyun", "yapay zeka", "teknoloji"],
    likes: Array.from({ length: 1456 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    commentCount: 56
  },
  {
    id: "10",
    author: mockUsers[0],
    content: "ChatGPT'nin yeni özellikleri gerçekten etkileyici. Artık kod yazmada bile yardımcı oluyor 💻",
    tags: ["yapay zeka", "yazılım", "teknoloji"],
    likes: Array.from({ length: 3234 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    commentCount: 134
  },
  {
    id: "11",
    author: mockUsers[2],
    content: "Fenerbahçe'nin yeni transferleri harika! Bu sezon çok güçlü olacağız 💪⚽",
    tags: ["spor", "futbol"],
    likes: Array.from({ length: 2891 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    commentCount: 201
  },
  {
    id: "12",
    author: mockUsers[3],
    content: "Türk müziğinde yeni bir dönem başlıyor! Genç müzisyenler harika işler çıkarıyor 🎵",
    tags: ["müzik"],
    likes: Array.from({ length: 1234 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    commentCount: 45
  },
  {
    id: "13",
    author: mockUsers[4],
    content: "Valorant Champions Tour başlıyor! Türk takımları bu sezon şampiyonluğa oynuyor 🏆",
    tags: ["oyun", "e-spor"],
    likes: Array.from({ length: 1876 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    commentCount: 78
  },
  {
    id: "14",
    author: mockUsers[1],
    content: "UI/UX tasarımında yeni trendler: Glassmorphism ve Neumorphism birleşiyor! 🎨",
    tags: ["tasarım"],
    likes: Array.from({ length: 987 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
    commentCount: 32
  },
  {
    id: "15",
    author: mockUsers[0],
    content: "Python 3.13 çıktı! Performans iyileştirmeleri gerçekten etkileyici 🐍",
    tags: ["yazılım", "teknoloji"],
    likes: Array.from({ length: 2456 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    commentCount: 112
  },
  {
    id: "16",
    author: mockUsers[0],
    content: "Neural networks'ün yeni mimarileri: Attention mekanizmaları her şeyi değiştirdi 🧠",
    tags: ["yapay zeka", "teknoloji"],
    likes: Array.from({ length: 1890 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000),
    commentCount: 67
  },
  {
    id: "17",
    author: mockUsers[4],
    content: "Web3 oyunları geleceği şekillendiriyor. Play-to-earn modelleri artık mainstream! 🎮💰",
    tags: ["oyun", "teknoloji"],
    likes: Array.from({ length: 1678 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 34 * 60 * 60 * 1000),
    commentCount: 94
  },
  {
    id: "18",
    author: mockUsers[2],
    content: "Beşiktaş'ta yeni teknik direktör ataması! Bu sezon farklı olacak 🔴⚫",
    tags: ["spor", "futbol"],
    likes: Array.from({ length: 2134 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    commentCount: 156
  },
  {
    id: "19",
    author: mockUsers[3],
    content: "Yerli müzik endüstrisi büyüyor! Streaming platformları Türk sanatçılara daha fazla fırsat veriyor 🎤",
    tags: ["müzik"],
    likes: Array.from({ length: 890 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 38 * 60 * 60 * 1000),
    commentCount: 28
  },
  {
    id: "20",
    author: mockUsers[1],
    content: "Figma'nın yeni özellikleri tasarımcıların işini kolaylaştırıyor. AI ile otomatik tasarım! 🎨✨",
    tags: ["tasarım", "teknoloji"],
    likes: Array.from({ length: 1456 }, (_, i) => `user_${i}`),
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
    commentCount: 71
  }
];

// Mock comments
export const mockComments: Comment[] = [
  // Post 1 comments (Yapay Zeka)
  {
    id: "1",
    postId: "1",
    author: mockUsers[1],
    text: "Haklısın! Özellikle multimodal modeller çok heyecan verici.",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: "2",
    postId: "1",
    author: mockUsers[4],
    text: "GPT-5 için beklentilerim çok yüksek 🔥",
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: "3",
    postId: "1",
    author: mockUsers[2],
    text: "Bir sonraki seviye ne olacak acaba? 🤔",
    createdAt: new Date(Date.now() - 45 * 60 * 1000)
  },
  // Post 2 comments (Sanat)
  {
    id: "4",
    postId: "2",
    author: mockUsers[0],
    text: "Harika görünüyor! Ben de gitmek istiyorum.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: "5",
    postId: "2",
    author: mockUsers[3],
    text: "Sanat ve teknolojinin buluşması gerçekten etkileyici 🎨",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  // Post 3 comments (Spor)
  {
    id: "6",
    postId: "3",
    author: mockUsers[0],
    text: "Ben de 2-1 Galatasaray diyorum! 🔥",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: "7",
    postId: "3",
    author: mockUsers[1],
    text: "Fenerbahçe bu sezon çok güçlü, zor maç olacak",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: "8",
    postId: "3",
    author: mockUsers[4],
    text: "Derbi günü heyecanı başladı bile! ⚽",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  // Post 4 comments (Müzik)
  {
    id: "9",
    postId: "4",
    author: mockUsers[1],
    text: "Çok güzel olmuş! Linki paylaşır mısın? 🎸",
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
  },
  {
    id: "10",
    postId: "4",
    author: mockUsers[2],
    text: "Mor ve Ötesi harika bir grup!",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  // Post 5 comments (Oyun)
  {
    id: "11",
    postId: "5",
    author: mockUsers[0],
    text: "ADC main olarak bu haberi çok sevdim! 🎮",
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
  },
  {
    id: "12",
    postId: "5",
    author: mockUsers[3],
    text: "Support main olarak ne diyorsun? 😄",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  // Post 6 comments (React)
  {
    id: "13",
    postId: "6",
    author: mockUsers[1],
    text: "React 19 gerçekten game changer olacak! 🚀",
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000)
  },
  {
    id: "14",
    postId: "6",
    author: mockUsers[4],
    text: "Server Components ile neler yapabiliriz acaba?",
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
  },
  // Post 8 comments (ML)
  {
    id: "15",
    postId: "8",
    author: mockUsers[1],
    text: "Transformer mimarisi gerçekten devrim yarattı!",
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000)
  },
  {
    id: "16",
    postId: "8",
    author: mockUsers[3],
    text: "Attention mechanism'ları öğrenmek istiyorum 🤖",
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
  },
  // Post 10 comments (ChatGPT)
  {
    id: "17",
    postId: "10",
    author: mockUsers[2],
    text: "ChatGPT gerçekten hayatımı kolaylaştırdı!",
    createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000)
  },
  {
    id: "18",
    postId: "10",
    author: mockUsers[1],
    text: "Kod yazarken çok yardımcı oluyor gerçekten 💻",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
  },
  {
    id: "19",
    postId: "10",
    author: mockUsers[4],
    text: "Ama dikkatli kullanmak lazım, her zaman doğru değil 😅",
    createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000)
  }
];

// Current user (logged in user)
export const currentUser: User = mockUsers[0];

// Trending topics for AI assistant
export const trendingTopics = [
  {
    topic: "Yapay Zeka",
    postCount: 234,
    summary: "GPT-4 ve yeni AI modelleri hakkında yoğun tartışmalar devam ediyor. Multimodal modellerin gelişimi ve etik konular gündemde."
  },
  {
    topic: "Süper Lig",
    postCount: 189,
    summary: "Galatasaray - Fenerbahçe derbisi öncesi heyecan dorukta. Transfer döneminde yapılan hamlelerin etkileri tartışılıyor."
  },
  {
    topic: "React 19",
    postCount: 156,
    summary: "React'in yeni sürümü Server Components ile büyük değişiklikler getiriyor. Geliştiriciler yeni özellikleri keşfediyor."
  },
  {
    topic: "Dijital Sanat",
    postCount: 98,
    summary: "NFT pazarında durgunluk devam ederken, AI ile üretilen sanat eserleri tartışmalara yol açıyor."
  },
  {
    topic: "Teknoloji",
    postCount: 312,
    summary: "Yeni teknolojiler ve inovasyonlar hakkında güncel tartışmalar. Yapay zeka, blockchain ve gelecek teknolojileri gündemde."
  },
  {
    topic: "Spor",
    postCount: 267,
    summary: "Futbol, basketbol ve diğer spor dallarında son gelişmeler. Transfer haberleri ve maç sonuçları."
  },
  {
    topic: "Müzik",
    postCount: 145,
    summary: "Yeni albümler, konserler ve müzik dünyasındaki son gelişmeler. Sanatçılar ve etkinlikler."
  },
  {
    topic: "Oyun",
    postCount: 223,
    summary: "Video oyunları, e-spor ve oyun endüstrisindeki son haberler. Yeni çıkan oyunlar ve turnuvalar."
  },
  {
    topic: "Tasarım",
    postCount: 178,
    summary: "Grafik tasarım, web tasarım ve yaratıcı endüstrilerdeki trendler. Tasarım araçları ve teknikleri."
  },
  {
    topic: "Yazılım",
    postCount: 201,
    summary: "Yazılım geliştirme, programlama dilleri ve teknolojiler. Geliştiriciler için ipuçları ve kaynaklar."
  }
];

export const interestOptions = [
  "teknoloji",
  "yapay zeka",
  "yazılım",
  "sanat",
  "tasarım",
  "fotoğrafçılık",
  "spor",
  "futbol",
  "fitness",
  "müzik",
  "konser",
  "gitar",
  "oyun",
  "e-spor",
  "sinema",
  "kitap",
  "seyahat",
  "yemek",
  "moda"
];
