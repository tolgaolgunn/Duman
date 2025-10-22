import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Send,
  Plus,
  Settings,
  Crown,
  Users,
  Lock,
  Globe,
  Trash2,
  UserPlus,
  Hash,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  isPremium: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  isPremium: boolean;
}

export function ChatRoom() {
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "1",
      name: "Premium Lounge",
      description: "Özel premium üyeler salonu",
      memberCount: 42,
      isPrivate: true,
      isPremium: true,
      lastMessage: "Hoş geldiniz!",
      unreadCount: 3,
    },
    {
      id: "2",
      name: "Genel Sohbet",
      description: "Herkese açık genel sohbet odası",
      memberCount: 156,
      isPrivate: false,
      isPremium: true,
      lastMessage: "Merhaba nasılsınız?",
    },
    {
      id: "3",
      name: "VIP Kulüp",
      description: "VIP üyeler için özel alan",
      memberCount: 28,
      isPrivate: true,
      isPremium: true,
      unreadCount: 1,
    },
  ]);

  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      user: "Ahmet K.",
      content: "Merhaba herkese!",
      timestamp: "14:30",
      isPremium: true,
    },
    {
      id: "2",
      user: "Zeynep Y.",
      content: "Hoş geldin! Nasılsın?",
      timestamp: "14:32",
      isPremium: true,
    },
    {
      id: "3",
      user: "Mehmet D.",
      content: "Bu oda gerçekten harika!",
      timestamp: "14:35",
      isPremium: true,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        user: "Sen",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isPremium: true,
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      const room: Room = {
        id: Date.now().toString(),
        name: newRoomName,
        description: newRoomDescription,
        memberCount: 1,
        isPrivate: isPrivateRoom,
        isPremium: true,
      };
      setRooms([...rooms, room]);
      setNewRoomName("");
      setNewRoomDescription("");
      setIsPrivateRoom(false);
      setCreateDialogOpen(false);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter((room) => room.id !== roomId));
    if (selectedRoom.id === roomId) {
      setSelectedRoom(rooms[0]);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white text-black" style={{ height: '100vh', backgroundColor: 'white' }}>
      {/* Sol Panel - Oda Listesi */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="text-yellow-500" size={24} />
              <h1 className="text-xl">Premium Odalar</h1>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white border-neutral-300 rounded-full hover:bg-neutral-100"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Arama */}
          <div className="relative">
            <Input
              placeholder="Oda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-neutral-300 rounded-lg focus:border-neutral-400"
            />
          </div>
        </div>

        {/* Oda Listesi */}
        <ScrollArea className="flex-1 bg-white">
          <div className="p-2 bg-white">
            {filteredRooms.map((room) => (
                <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-4 mb-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom.id === room.id
                    ? "bg-gray-300 border border-gray-400"
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash size={16} className="text-neutral-500" />
                      <span>{room.name}</span>
                      {room.isPrivate && <Lock size={14} className="text-neutral-500" />}
                      {!room.isPrivate && <Globe size={14} className="text-neutral-500" />}
                    </div>
                    <p className="text-sm text-neutral-500 mb-2">{room.description}</p>
                    {room.lastMessage && (
                      <p className="text-sm text-neutral-600 truncate">{room.lastMessage}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
                  <Users size={14} />
                  <span>{room.memberCount} üye</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sağ Panel - Mesajlaşma */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={20} className="text-neutral-600" />
              <h2 className="text-xl">{selectedRoom.name}</h2>
              {selectedRoom.isPrivate && <Lock size={16} className="text-neutral-500" />}
              <Badge variant="outline" className="rounded-lg border border-yellow-500 hover:bg-neutral-100 text-yellow-500">
                <Crown size={12} className="mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">{selectedRoom.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-neutral-300 hover:bg-neutral-100 rounded-full"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Davet Et
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white rounded-full border-neutral-300 hover:bg-neutral-100"
              onClick={() => setSettingsDialogOpen(true)}
            >
              <Settings size={16} className="mr-2" />
              Ayarlar
            </Button>
          </div>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{message.user}</span>
                  {message.isPremium && (
                    <Crown size={14} className="text-yellow-600" />
                  )}
                  <span className="text-sm text-neutral-500">{message.timestamp}</span>
                </div>
                <p className="text-neutral-700">{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mesaj Gönder */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          <div className="flex gap-2">
            <Input
              placeholder="Mesajınızı yazın..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-white border-neutral-300 focus:border-neutral-400 rounded-lg"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-black text-white hover:bg-neutral-800 rounded-lg"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Ayarlar Modalı */}
      {settingsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Oda Ayarları</h3>
              <button 
                onClick={() => setSettingsDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-room-name" className="block text-sm font-medium text-gray-700 mb-2">Oda Adı</label>
                <Input
                  id="settings-room-name"
                  defaultValue={selectedRoom.name}
                  className="bg-white border-neutral-300 rounded-lg"
                />
              </div>
              
              <div>
                <label htmlFor="room-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama ({newRoomDescription.length}/200)
                </label>
                <textarea
                  id="room-settings-description"
                  placeholder="Oda ayarları açıklaması"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  maxLength={200}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              
              <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={18} />
                    <span>Özel Oda</span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Sadece davet edilenler katılabilir
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedRooms = rooms.map(room => 
                      room.id === selectedRoom.id 
                        ? { ...room, isPrivate: !room.isPrivate }
                        : room
                    );
                    setRooms(updatedRooms);
                    setSelectedRoom({ ...selectedRoom, isPrivate: !selectedRoom.isPrivate });
                  }}
                  className={
                    selectedRoom.isPrivate
                      ? "bg-black text-black hover:bg-neutral-800 rounded-full"
                      : "bg-black text-black border-neutral-300 hover:bg-neutral-100 rounded-full"
                  }
                >
                  {selectedRoom.isPrivate ? "Açık" : "Kapalı"}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setSettingsDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </Button>
              <Button className="flex-1 px-4 py-2 bg-black text-black border border-black rounded-lg hover:bg-gray-500 transition-colors">
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manuel Oda Oluşturma Modalı */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Oda Oluştur</h3>
              <button 
                onClick={() => setCreateDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-2">Oda Adı</label>
                <Input
                  id="room-name"
                  placeholder="Oda adını girin"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-white border-neutral-300 rounded-lg"
                />
              </div>
              
              <div>
                <label htmlFor="room-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama ({newRoomDescription.length}/200)
                </label>
                <textarea
                  id="room-description"
                  placeholder="Oda açıklaması"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  maxLength={200}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-neutral-600" />
                  <span>Özel Oda</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrivateRoom(!isPrivateRoom)}
                  className={
                    isPrivateRoom
                      ? "bg-black text-black hover:bg-neutral-800 rounded-full"
                      : "bg-black text-black hover:bg-neutral-800 rounded-full"
                  }
                >
                  {isPrivateRoom ? "Açık" : "Kapalı"}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </Button>
              <Button
                onClick={handleCreateRoom}
                className="flex-1 px-4 py-2 bg-black text-black border border-black rounded-lg hover:bg-gray-500 transition-colors"
              >
                Oluştur
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Davet Et Modalı */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Kullanıcı Davet Et</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-username" className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                <Input
                  id="invite-username"
                  placeholder="Kullanıcı adını girin..."
                  className="bg-white border-neutral-300 rounded-lg"
                />
              </div>
              
              <div>
                <label htmlFor="room-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama ({newRoomDescription.length}/200)
                </label>
                <textarea
                  id="room-invite-description"
                  placeholder="Oda davet mesajı.."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  maxLength={200}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </Button>
              <Button className="flex-1 px-4 py-2 border border-black text-black rounded-lg hover:bg-gray-50 transition-colors">
                Davet Gönder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}