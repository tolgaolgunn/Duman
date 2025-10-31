import React, { useEffect, useRef, useState } from "react";
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
import { io, Socket } from 'socket.io-client';

interface Room {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  isPremium: boolean;
  isParticipant?: boolean;
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
  const [rooms, setRooms] = useState<Room[]>([]);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const [newMessage, setNewMessage] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomIcon, setNewRoomIcon] = useState("💬");
  const [newRoomTags, setNewRoomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
    const token = localStorage.getItem('authToken');

    // Optimistic local append
    const optimistic: Message = {
      id: Date.now().toString(),
      user: 'Sen',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isPremium: false,
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    fetch(`${API_BASE}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify({ roomId: selectedRoom!.id, message: optimistic.content })
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to send message', res.status, text);
        // remove optimistic
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        return;
      }
      const data = await res.json();
      const payload = data?.data || data;
      // server will emit 'newMessage' via socket; but ensure local state is updated with authoritative message
      setMessages(prev => prev.map(m => m.id === optimistic.id ? ({
        id: payload._id || payload.id,
        user: payload.sender?.username || payload.sender?.name || 'Sen',
        content: payload.message || payload.content || optimistic.content,
        timestamp: payload.timestamp || payload.createdAt || new Date().toISOString(),
        isPremium: payload.sender?.isPremium || false
      }) : m));
    }).catch((err) => {
      console.error('Send message error', err);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    });
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    // call backend to create room
    (async () => {
      try {
        setIsCreatingRoom(true);
        const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
        const token = localStorage.getItem('authToken');
        const body = {
          name: newRoomName.trim(),
          description: newRoomDescription.trim(),
          isPrivate: isPrivateRoom,
          icon: newRoomIcon,
          tags: newRoomTags
        };
        const res = await fetch(`${API_BASE}/api/chat/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Create room failed', res.status, txt);
          // keep dialog open and show console error
          return;
        }
        const data = await res.json();
        const created = data?.data || data;
        const room: Room = {
          id: created._id || created.id,
          name: created.name,
          description: created.description || '',
          memberCount: created.memberCount || created.participants?.length || 1,
          isPrivate: created.roomSettings?.isPrivate || created.isPrivate || false,
          isPremium: created.type === 'premium' || created.category === 'premium',
          lastMessage: created.lastMessage?.message || undefined,
          unreadCount: 0
        };
        setRooms(prev => [room, ...prev]);
        setSelectedRoom(room);
        // reset inputs
        setNewRoomName("");
        setNewRoomDescription("");
        setNewRoomIcon("💬");
        setNewRoomTags([]);
        setTagInput("");
        setIsPrivateRoom(false);
        setCreateDialogOpen(false);
      } catch (err) { 
        console.error('create room error', err);
      } finally {
        setIsCreatingRoom(false);
      }
    })();
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setNewRoomTags(prev => Array.from(new Set([...prev, t])));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setNewRoomTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && newRoomTags.length) {
      // remove last
      setNewRoomTags(prev => prev.slice(0, prev.length - 1));
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter((room) => room.id !== roomId));
      if (selectedRoom?.id === roomId) {
      setSelectedRoom(rooms[0]);
    }
  };

  const handleRespondJoinRequest = async (requestIndex: number, approve: boolean) => {
    if (!selectedRoom) return;
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/join-requests/${requestIndex}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ approve })
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error('Respond join request failed', res.status, txt);
        return;
      }
      // remove from local list
      setJoinRequests(prev => prev.filter((_, idx) => idx !== requestIndex));
      // if approved, update rooms list to mark participant
      if (approve) {
        setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, isParticipant: true, memberCount: (r.memberCount || 0) + 1 } : r));
        setSelectedRoom(prev => prev ? { ...prev, isParticipant: true } : prev);
      }
    } catch (err) {
      console.error('handleRespondJoinRequest error', err);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper: decode jwt payload to extract user id
  const decodeJwt = (token?: string | null) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      return JSON.parse(atob(b));
    } catch (e) {
      return null;
    }
  };

  // Fetch user's rooms (chat list)
  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

  // Use public rooms endpoint so newly created public rooms are visible to all users
  const res = await fetch(`${API_BASE}/api/chat/rooms`, { headers });
      if (!res.ok) {
        console.error('Failed to fetch rooms', res.status);
        setRooms([]);
        return;
      }
      const data = await res.json();
      const list = data?.data || data || [];
      const mapped: Room[] = list.map((r: any) => ({
        id: r._id || r.id,
        name: r.name,
        description: r.description,
        memberCount: r.memberCount || r.participants?.length || 0,
        isPrivate: r.roomSettings?.isPrivate || r.roomSettings?.isPrivate === undefined ? !!r.roomSettings?.isPrivate : false,
        isParticipant: !!(r.userStatus && r.userStatus.isParticipant),
        isPremium: r.type === 'premium' || r.category === 'premium',
        lastMessage: r.lastMessage?.message || r.lastMessage?.text || undefined,
        unreadCount: r.unreadCount || 0
      }));
      setRooms(mapped);
      if (!selectedRoom && mapped.length > 0) setSelectedRoom(mapped[0]);
    } catch (err) {
      console.error('fetchRooms error', err);
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
      const token = localStorage.getItem('authToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, { headers });
      if (!res.ok) {
        console.error('Failed to fetch messages for', roomId, res.status);
        setMessages([]);
        return;
      }
      const data = await res.json();
      const list = data?.data || data || [];
      const mapped = (list as any[]).map(m => ({
        id: m._id || m.id,
        user: m.sender?.username || m.sender?.name || 'Kullanıcı',
        content: m.message || m.content,
        timestamp: m.timestamp || m.createdAt,
        isPremium: m.sender?.isPremium || false
      }));
      setMessages(mapped);
      // join room via socket
      if (socketRef.current) socketRef.current.emit('joinRoom', roomId);
    } catch (err) {
      console.error('fetchMessages error', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // initialize socket and rooms on mount
  useEffect(() => {
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
    const token = localStorage.getItem('authToken');
    const payload = decodeJwt(token);
    const userId = payload?._id || payload?.id || payload?.sub || payload?.userId;

    // connect socket
    const socket = io(API_BASE, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.debug('socket connected', socket.id);
      // authenticate (server listens for this event)
      socket.emit('authenticate', { userId });
    });

    // load user's rooms after socket is ready
    fetchRooms();

    socket.on('newMessage', (payload: any) => {
      const msg = payload?.message || payload;
      const roomId = payload?.roomId || msg?.chatRoom || msg?.chatRoom?._id;
      if (!roomId) return;
      setMessages(prev => {
        // only append if current room matches
        if (!selectedRoom || selectedRoom.id !== String(roomId)) return prev;
        return [...prev, {
          id: msg._id || msg.id || String(Date.now()),
          user: msg.sender?.username || msg.sender?.name || 'Kullanıcı',
          content: msg.message || msg.content,
          timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          isPremium: msg.sender?.isPremium || false
        }];
      });
    });

    socket.on('messageDeleted', (p: any) => {
      const { messageId, roomId } = p || {};
      if (!selectedRoom || selectedRoom.id !== String(roomId)) return;
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on('messageEdited', (p: any) => {
      const msg = p?.message || p;
      const roomId = p?.roomId || msg?.chatRoom;
      if (!selectedRoom || selectedRoom.id !== String(roomId)) return;
      setMessages(prev => prev.map(m => m.id === (msg._id || msg.id) ? ({
        id: msg._id || msg.id,
        user: msg.sender?.username || msg.sender?.name || m.user,
        content: msg.message || msg.content,
        timestamp: msg.editedAt || msg.updatedAt || m.timestamp,
        isPremium: msg.sender?.isPremium || m.isPremium
      }) : m));
    });

    socket.on('userTyping', (p: any) => {
      const { userId, roomId, isTyping } = p || {};
      if (!selectedRoom || selectedRoom.id !== String(roomId)) return;
      setTypingUsers(prev => ({ ...prev, [userId]: !!isTyping }));
    });

    // When a new public room is created by someone, add it to the list
    socket.on('roomCreated', (roomData: any) => {
      try {
        const r = roomData || {};
        const mapped: Room = {
          id: r._id || r.id,
          name: r.name,
          description: r.description || '',
          memberCount: r.memberCount || r.participants?.length || 0,
          isPrivate: r.roomSettings?.isPrivate || r.isPrivate || false,
          isPremium: r.type === 'premium' || r.category === 'premium',
          lastMessage: r.lastMessage?.message || undefined,
          unreadCount: r.unreadCount || 0
        };
        setRooms(prev => {
          // avoid duplicates
          if (prev.some(p => p.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
      } catch (e) {
        // ignore
      }
    });

    // cleanup
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) { /* ignore */ }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // when selectedRoom changes, fetch its messages and join via socket
  useEffect(() => {
    if (!selectedRoom) return;
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
    const token = localStorage.getItem('authToken');

    const ensureJoinedAndFetch = async () => {
      try {
        // If not participant, try to join first
        if (!selectedRoom.isParticipant) {
          const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          if (res.ok) {
            const data = await res.json();
            const updated = data?.data || data;
            // update rooms list
            setRooms(prev => prev.map(r => r.id === (updated._id || updated.id) ? { ...r, isParticipant: true } : r));
            setSelectedRoom(prev => prev ? { ...prev, isParticipant: true } : prev);
          } else {
            // If join returned 202 (pending) or forbidden, just notify user
            if (res.status === 202) {
              // pending approval
              console.info('Join request pending');
            } else {
              console.warn('Failed to join room', res.status);
            }
            // if cannot join, let fetchMessages handle errors
          }
        }

        // leave other rooms then join via socket
        if (socketRef.current) {
          socketRef.current.emit('joinRoom', selectedRoom!.id);
        }
        await fetchMessages(selectedRoom!.id);
      } catch (err) {
        console.error('ensureJoinedAndFetch error', err);
      }
    };

    ensureJoinedAndFetch();
  }, [selectedRoom]);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

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
                    onClick={() => {
                      // if user is not participant and room is public, show confirm
                      if (!room.isParticipant && !room.isPrivate) {
                        // hide current selected room so messages are not visible while confirmation is open
                        // clear messages and leave via socket if currently joined
                        if (socketRef.current && selectedRoom) {
                          try { socketRef.current.emit('leaveRoom', selectedRoom.id); } catch (e) { /* ignore */ }
                        }
                        setMessages([]);
                        setSelectedRoom(null);
                        setPendingJoinRoom(room);
                        setJoinConfirmOpen(true);
                        return;
                      }
                      setSelectedRoom(room);
                    }}
                className={`w-full text-left p-4 mb-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id
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
        {selectedRoom ? (
          <>
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
                  className="bg-white border-neutral-300 rounded-full hover:bg-neutral-100"
                  onClick={async () => {
                    if (!selectedRoom) return;
                    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
                    const token = localStorage.getItem('authToken');
                    const payload = decodeJwt(token);
                    const myUserId = payload?._id || payload?.id || payload?.sub || payload?.userId;
                    try {
                      // fetch room details
                      const rres = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}`, {
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                      });
                      if (!rres.ok) {
                        console.warn('Cannot check admin status', rres.status);
                        return;
                      }
                      const rdata = await rres.json();
                      const roomDetail = rdata?.data || rdata;

                      // robust check: is admin flag OR createdBy OR admins array contains me
                      const isAdminFlag = !!roomDetail?.userStatus?.isAdmin;
                      const isOwner = String(roomDetail?.createdBy?._id || roomDetail?.createdBy) === String(myUserId);
                      const isInAdmins = Array.isArray(roomDetail?.admins) && roomDetail.admins.some((a: any) => String(a._id || a) === String(myUserId));
                      const isAdmin = isAdminFlag || isOwner || isInAdmins;
                      if (!isAdmin) {
                        alert('Bu işlemi yapmak için yetkiniz yok');
                        return;
                      }

                      // fetch join requests
                      const jres = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/join-requests`, {
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                      });
                      if (!jres.ok) {
                        console.error('Failed to fetch join requests', jres.status);
                        return;
                      }
                      const jdata = await jres.json();
                      setJoinRequests(jdata?.data || []);
                      setJoinRequestsModalOpen(true);
                    } catch (err) {
                      console.error('open join requests error', err);
                    }
                  }}
                >
                  <UserPlus size={16} className="mr-2" />
                  Katılma İstekleri
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
                      <span className="text-sm text-neutral-500">{new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-neutral-700">{message.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Lütfen bir oda seçin</div>
        )}
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
                  defaultValue={selectedRoom?.name || ''}
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
                      room.id === selectedRoom?.id 
                        ? { ...room, isPrivate: !room.isPrivate }
                        : room
                    );
                    setRooms(updatedRooms);
                    setSelectedRoom(prev => prev ? { ...prev, isPrivate: !prev.isPrivate } : prev);
                  }}
                  className={
                    selectedRoom?.isPrivate
                      ? "bg-black text-black hover:bg-neutral-800 rounded-full"
                      : "bg-black text-black border-neutral-300 hover:bg-neutral-100 rounded-full"
                  }
                >
                  {selectedRoom?.isPrivate ? "Açık" : "Kapalı"}
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
              
              <div>
                <label htmlFor="room-icon" className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
                <div className="flex items-center gap-2">
                  <Input
                    id="room-icon"
                    placeholder="Örn: 💬"
                    value={newRoomIcon}
                    onChange={(e) => setNewRoomIcon(e.target.value)}
                    className="w-20 text-lg text-center"
                  />
                  <div className="text-sm text-neutral-500">Küçük bir emoji girin veya bırakın</div>
                </div>
              </div>

              <div>
                <label htmlFor="room-tags" className="block text-sm font-medium text-gray-700 mb-2">Etiketler (Enter ile ekle)</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="room-tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="etiket ekle..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                  />
                  <Button size="sm" onClick={() => addTag(tagInput)}>Ekle</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newRoomTags.map(tag => (
                    <div key={tag} className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded-full text-sm">
                      <span>#{tag}</span>
                      <button onClick={() => removeTag(tag)} className="text-neutral-500 hover:text-neutral-700">×</button>
                    </div>
                  ))}
                </div>
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
                disabled={isCreatingRoom}
                className="flex-1 px-4 py-2 bg-black text-black border border-black rounded-lg hover:bg-gray-500 transition-colors"
              >
                {isCreatingRoom ? 'Oluşturuluyor...' : 'Oluştur'}
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

      {/* Katılma İstekleri Modalı (sadece adminler için) */}
      {joinRequestsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Katılma İstekleri</h3>
              <button 
                onClick={() => setJoinRequestsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto">
              {joinRequests.length === 0 && (
                <div className="text-sm text-neutral-500">Bekleyen istek yok.</div>
              )}
              {joinRequests.map((reqItem: any, idx: number) => (
                <div key={idx} className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{reqItem.user?.username || reqItem.user?.name || 'Kullanıcı'}</div>
                    <div className="text-sm text-neutral-500">İstek zamanı: {new Date(reqItem.requestedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRespondJoinRequest(idx, true)} className="bg-green-600 text-white">Kabul</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRespondJoinRequest(idx, false)}>Reddet</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Public join confirmation modal */}
      {joinConfirmOpen && pendingJoinRoom && (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
    <div className="bg-white rounded-lg p-6 w-80 max-w-full shadow-2xl border border-gray-200 relative z-10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Odaya Katıl</h3>
        <p className="text-sm text-neutral-600">"{pendingJoinRoom.name}" odasına katılmak istiyor musunuz?</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => { setJoinConfirmOpen(false); setPendingJoinRoom(null); }}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-neutral-700 hover:bg-gray-50"
        >
          Hayır
        </button>
        <button
          onClick={() => { setJoinConfirmOpen(false); setSelectedRoom(pendingJoinRoom); setPendingJoinRoom(null); }}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Evet
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}