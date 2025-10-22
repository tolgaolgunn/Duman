import React, { useState } from 'react';
import { Send, Users } from 'lucide-react';
import { currentUser } from '../../lib/mockData';

interface Message {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  text: string;
  timestamp: Date;
}

export function ChatRoom() {
  const [selectedRoom, setSelectedRoom] = useState<string>('teknoloji');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: { username: 'zeynep_kaya', avatar: '👩‍🎨' },
      text: 'Merhaba! React 19 hakkında ne düşünüyorsunuz?',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: '2',
      user: { username: 'mehmet_demir', avatar: '⚽' },
      text: 'Server Components gerçekten oyun değiştirici!',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
      id: '3',
      user: { username: 'ahmet_yilmaz', avatar: '👨‍💻' },
      text: 'Katılıyorum, özellikle performans iyileştirmeleri harika.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        user: {
          username: currentUser.username,
          avatar: currentUser.avatar || '👤',
        },
        text: message,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const availableRooms = currentUser.interests.length > 0 
    ? currentUser.interests 
    : ['genel', 'teknoloji', 'sanat', 'spor'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-[calc(100vh-8rem)] flex">
        {/* Room List */}
        <div className="w-64 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sohbet Odaları
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {availableRooms.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all ${
                  selectedRoom === room
                    ? 'bg-gray-100 text-gray-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">#{room}</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {Math.floor(Math.random() * 50) + 10} çevrimiçi
                </p>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
              + Oda Oluştur
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                <span>#</span>
              </div>
              <div>
                <h3 className="text-gray-900 capitalize">{selectedRoom}</h3>
                <p className="text-gray-500 text-sm">
                  {selectedRoom} ile ilgilenen kullanıcılar için oda
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.user.username === currentUser.username;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {!isCurrentUser && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{msg.user.avatar}</span>
                    </div>
                  )}
                  <div className={`flex-1 ${isCurrentUser ? 'flex justify-end' : ''}`}>
                    {!isCurrentUser && (
                      <p className="text-gray-900 text-sm mb-1">
                        @{msg.user.username}
                      </p>
                    )}
                    <div
                      className={`inline-block px-4 py-2 rounded-2xl max-w-md ${
                        isCurrentUser
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
