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
  }
];

// Mock comments
export const mockComments: Comment[] = [
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
    postId: "2",
    author: mockUsers[0],
    text: "Harika görünüyor! Ben de gitmek istiyorum.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
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
