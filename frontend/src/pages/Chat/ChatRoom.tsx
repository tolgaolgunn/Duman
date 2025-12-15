import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Send, Plus, Crown, Users, Settings, Lock, Globe, UserPlus, LogOut, Loader2, X, Paperclip, Smile, MessageSquare, Search, Sparkles, MoreVertical } from "lucide-react";
import { io, Socket } from "socket.io-client";
import Swal from "sweetalert2";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Room {
	id: string;
	name: string;
	icon?: string;
	description?: string;
	memberCount: number;
	isPrivate?: boolean;
	isParticipant?: boolean;
	isPremium?: boolean;
	lastMessage?: string;
	unreadCount?: number;
	tags?: string[];
	roomSettings?: {
		isPrivate: boolean;
	};
	userStatus?: {
		isParticipant: boolean;
		isAdmin: boolean;
	};
	type?: string;
	category?: string;
	participants?: any[];
	admins?: any[];
	createdBy?: any;
}

interface Message {
	id: string;
	user: string;
	userId?: string;
	content: string;
	timestamp: string;
	isPremium: boolean;
	isEdited?: boolean;
	editedAt?: string;
	messageType?: string;
}

interface RoomMember {
	id: string;
	username: string;
	isAdmin: boolean;
	isPremium: boolean;
}

export function ChatRoom() {
	const location = useLocation();
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
	const [inviteUsername, setInviteUsername] = useState("");
	const [inviteDescription, setInviteDescription] = useState("");
	const [isInviting, setIsInviting] = useState(false);
	const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
	const [joinRequests, setJoinRequests] = useState<any[]>([]);
	const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);
	const [pendingJoinRoom, setPendingJoinRoom] = useState<Room | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingMessageContent, setEditingMessageContent] = useState("");
	const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 78uYENİ STATE'LER
	const [showMembersModal, setShowMembersModal] = useState(false);
	const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
	const [isUserPremium, setIsUserPremium] = useState(false);
	const [isLoadingMembers, setIsLoadingMembers] = useState(false);
	const [isSummarizing, setIsSummarizing] = useState(false);
	const [notifications, setNotifications] = useState<any[]>(() => {
		try {
			const raw = localStorage.getItem('chatNotifications');
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	});
	const [showNotifications, setShowNotifications] = useState(false);

	const socketRef = useRef<Socket | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// --- Yardımcı Fonksiyonlar ---
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
			setNewRoomTags(prev => prev.slice(0, prev.length - 1));
		}
	};

	const handleDeleteRoom = (roomId: string) => {
		setRooms(rooms.filter((room) => room.id !== roomId));
		if (selectedRoom?.id === roomId) {
			// İlk odayı seçin veya null yapın
			setSelectedRoom(rooms.length > 1 ? rooms.filter(r => r.id !== roomId)[0] : null);
		}
	};

	// --- API/Socket Fonksiyonları ---
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
			isPremium: isUserPremium,
			messageType: 'text'
		};
		setMessages(prev => [...prev, optimistic]);
		setNewMessage('');


		// Endpoint: /api/chat/messages (roomId body içinde gönderilir)
		fetch(`${API_BASE}/api/chat/rooms/${selectedRoom!.id}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			body: JSON.stringify({
				message: optimistic.content,
				roomId: selectedRoom!.id,
				messageType: 'text'
			})
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
			setMessages(prev => {
				const realId = payload._id || payload.id;
				if (prev.some(m => m.id === realId)) {
					return prev.filter(m => m.id !== optimistic.id);
				}
				return prev.map(m => m.id === optimistic.id ? ({
					id: realId,
					user: payload.sender?.username || payload.sender?.name || 'Sen',
					userId: payload.sender?._id || payload.sender?.id,
					content: payload.message || payload.content || optimistic.content,
					timestamp: payload.timestamp || payload.createdAt || new Date().toISOString(),
					isPremium: payload.sender?.isPremium || true,
					isEdited: payload.isEdited || false,
					editedAt: payload.editedAt
				}) : m);
			});
		}).catch((err) => {
			console.error('Send message error', err);
			setMessages(prev => prev.filter(m => m.id !== optimistic.id));
		});
	};

	// Mesaj Silme
	const handleDeleteMessage = async (messageId: string) => {
		const result = await Swal.fire({
			title: 'Mesajı sil?',
			text: 'Bu işlem geri alınamaz.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Evet, sil',
			cancelButtonText: 'İptal'
		});

		if (!result.isConfirmed) return;

		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');

		try {
			const res = await fetch(`${API_BASE}/api/chat/messages/${messageId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				}
			});

			if (!res.ok) throw new Error('Mesaj silinemedi');

			setMessages(prev => prev.filter(m => m.id !== messageId));
			setMessageMenuOpen(null);
			Swal.fire('Silindi!', 'Mesaj başarıyla silindi.', 'success');
		} catch (error) {
			console.error('Delete message error:', error);
			Swal.fire('Hata', 'Mesaj silinirken bir hata oluştu.', 'error');
		}
	};

	// Mesaj Düzenleme Kaydet
	const handleEditMessage = async () => {
		if (!editingMessageId || !editingMessageContent.trim()) return;

		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');

		try {
			const res = await fetch(`${API_BASE}/api/chat/messages/${editingMessageId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({ message: editingMessageContent.trim() })
			});

			if (!res.ok) throw new Error('Mesaj düzenlenemedi');

			const data = await res.json();
			const updated = data?.data || data;

			setMessages(prev => prev.map(m => m.id === editingMessageId ? ({
				...m,
				content: updated.message || editingMessageContent.trim(),
				isEdited: true,
				editedAt: updated.editedAt || new Date().toISOString()
			}) : m));

			setEditingMessageId(null);
			setEditingMessageContent('');
			setMessageMenuOpen(null);
			Swal.fire('Güncellendi!', 'Mesaj başarıyla düzenlendi.', 'success');
		} catch (error) {
			console.error('Edit message error:', error);
			Swal.fire('Hata', 'Mesaj düzenlenirken bir hata oluştu.', 'error');
		}
	};

	const startEditMessage = (messageId: string, currentContent: string) => {
		setEditingMessageId(messageId);
		setEditingMessageContent(currentContent);
		setMessageMenuOpen(null);
	};

	const handleCreateRoom = () => {
		if (!newRoomName.trim()) return;
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
					return;
				}
				const data = await res.json();
				const created = data?.data || data;
				const room: Room = {
					id: created._id || created.id,
					name: created.name,
					icon: created.icon || created.icon || '💬',
					description: created.description || '',
					memberCount: created.memberCount || created.participants?.length || 1,
					isPrivate: created.roomSettings?.isPrivate || created.isPrivate || false,
					isPremium: created.type === 'premium' || created.category === 'premium',
					lastMessage: created.lastMessage?.message || undefined,
					unreadCount: 0
				};
				setRooms(prev => [room, ...prev]);
				setSelectedRoom(room);
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

	// Update room on server (Güncelleme işlemi)
	const updateRoomOnServer = async () => {
		if (!selectedRoom) return;
		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');
		try {
			const body: any = {
				name: newRoomName.trim() || selectedRoom.name,
				description: newRoomDescription.trim(),
				icon: newRoomIcon || selectedRoom.icon,
				tags: newRoomTags,
				roomSettings: { isPrivate: !!isPrivateRoom }
			};

			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const txt = await res.text();
				console.error('Update room failed', res.status, txt);
				alert('Oda güncellenemedi');
				return;
			}

			const data = await res.json().catch(() => null);
			const updated = data?.data || data || {};

			// Update local state
			setRooms(prev => prev.map(r => r.id === selectedRoom.id ? ({
				...r,
				name: updated.name || body.name,
				description: updated.description || body.description,
				icon: updated.icon || body.icon,
				isPrivate: updated.roomSettings?.isPrivate ?? body.roomSettings.isPrivate,
			}) : r));

			setSelectedRoom(prev => prev ? ({
				...prev,
				name: updated.name || body.name,
				description: updated.description || body.description,
				icon: updated.icon || body.icon,
				isPrivate: updated.roomSettings?.isPrivate ?? body.roomSettings.isPrivate,
			}) : prev);

			setSettingsDialogOpen(false);
		} catch (err) {
			console.error('updateRoomOnServer error', err);
			alert('Sunucu hatası, tekrar deneyin');
		}
	};

	// Delete room on server (Silme işlemi)
	const deleteRoomOnServer = async () => {
		if (!selectedRoom) return;
		if (!confirm('Bu odayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');
		try {
			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
			});
			if (!res.ok) {
				const txt = await res.text();
				console.error('Delete room failed', res.status, txt);
				alert('Oda silinemedi');
				return;
			}
			// update UI
			handleDeleteRoom(selectedRoom.id);
			setSettingsDialogOpen(false);
		} catch (err) {
			console.error('deleteRoomOnServer error', err);
			alert('Sunucu hatası, tekrar deneyin');
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
			setJoinRequests(prev => prev.filter((_, idx) => idx !== requestIndex));
			if (approve) {
				setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, isParticipant: true, memberCount: (r.memberCount || 0) + 1 } : r));
				setSelectedRoom(prev => prev ? { ...prev, isParticipant: true } : prev);
			}
		} catch (err) {
			console.error('handleRespondJoinRequest error', err);
		}
	};

	const fetchJoinRequests = async (roomId: string) => {
		try {
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');
			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(roomId)}/join-requests`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setJoinRequests(data.data || data || []);
			}
		} catch (e) {
			console.error('fetchJoinRequests error', e);
		}
	};

	const handleLeaveRoom = async () => {
		if (!selectedRoom) return;

		const result = await Swal.fire({
			title: 'Ayrılmak istediğinize emin misiniz?',
			text: "Bu odadan ayrılırsanız, tekrar katılmak için davet edilmeniz gerekebilir.",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Evet, ayrıl',
			cancelButtonText: 'İptal'
		});

		if (!result.isConfirmed) return;

		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');

		try {
			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/leave`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
			});

			if (res.ok) {
				// Remove from local list and clear selection
				setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
				setSelectedRoom(null);
				setMessages([]);
				Swal.fire(
					'Ayrıldınız!',
					'Odadan başarıyla ayrıldınız.',
					'success'
				);
			} else {
				const txt = await res.text();
				console.error('Leave room failed', res.status, txt);
				Swal.fire({
					icon: 'error',
					title: 'Hata',
					text: 'Odadan ayrılınamadı.'
				});
			}
		} catch (err) {
			console.error('handleLeaveRoom error', err);
			Swal.fire({
				icon: 'error',
				title: 'Hata',
				text: 'Bir sorun oluştu, lütfen tekrar deneyin.'
			});
		}
	};

	const handleSummarize = async () => {
		if (!selectedRoom) return;

		setIsSummarizing(true);
		try {
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');

			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/summary`, {
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				}
			});

			if (!res.ok) {
				throw new Error('Özet alınamadı');
			}

			const data = await res.json();

			if (data.success) {
				if (!data.summary) {
					Swal.fire({
						title: 'Bilgi',
						text: 'Özetlenecek yeni mesaj bulunamadı.',
						icon: 'info'
					});
				} else {
					Swal.fire({
						title: '🚀 Sohbet Özeti',
						html: `<div style="text-align: left; white-space: pre-wrap; max-height: 60vh; overflow-y: auto;">${data.summary}</div>`,
						confirmButtonText: 'Teşekkürler',
						width: '600px'
					});
				}
			}
		} catch (error) {
			console.error('Summarize error:', error);
			Swal.fire({
				title: 'Hata',
				text: 'Özet oluşturulurken bir hata oluştu.',
				icon: 'error'
			});
		} finally {
			setIsSummarizing(false);
		}
	};

	const fetchMembers = async (roomId: string) => {
		setIsLoadingMembers(true);
		setRoomMembers([]); // Yüklenirken eski listeyi temizle
		try {
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');
			const headers: any = { 'Content-Type': 'application/json' };
			if (token) headers.Authorization = `Bearer ${token}`;

			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(roomId)}/members`, { headers });
			if (!res.ok) {
				console.error('Failed to fetch members for', roomId, res.status);
				return;
			}
			const data = await res.json();
			const list = data?.data || data || [];

			const mapped: RoomMember[] = (list as any[]).map(m => ({
				id: m._id || m.id,
				username: m.username || m.name || 'Bilinmeyen Kullanıcı',
				isAdmin: m.isAdmin || false, // Varsayılan olarak isAdmin bayrağı alınır
				isPremium: m.isPremium || false // Varsayılan olarak isPremium bayrağı alınır
			}));
			setRoomMembers(mapped);
		} catch (err) {
			console.error('fetchMembers error', err);
			setRoomMembers([]);
		} finally {
			setIsLoadingMembers(false);
		}
	};

	const fetchRooms = async () => {
		setIsLoadingRooms(true);
		try {
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');
			const headers: any = { 'Content-Type': 'application/json' };
			if (token) headers.Authorization = `Bearer ${token}`;

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
				icon: r.icon || '💬',
				name: r.name,
				description: r.description,
				memberCount: r.memberCount || r.participants?.length || 0,
				isPrivate: r.roomSettings?.isPrivate || r.roomSettings?.isPrivate === undefined ? !!r.roomSettings?.isPrivate : false,
				isParticipant: !!(r.userStatus && r.userStatus.isParticipant),
				isPremium: r.type === 'premium' || r.category === 'premium',
				lastMessage: r.lastMessage?.message || r.lastMessage?.text || undefined,
				unreadCount: r.unreadCount || 0,
				tags: r.tags || [],
				userStatus: r.userStatus,
			}));
			setRooms(mapped);

			// Check for selectedRoomId in location state (from notification redirect)
			const pendingRoomId = location.state?.selectedRoomId;
			if (pendingRoomId) {
				const target = mapped.find(r => r.id === pendingRoomId);
				if (target) {
					setSelectedRoom(target);
					// clear state to prevent re-selection on re-renders
					window.history.replaceState({}, document.title);
				}
			}
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
				userId: m.sender?._id || m.sender?.id,
				content: m.message || m.content,
				timestamp: m.timestamp || m.createdAt,
				isPremium: m.sender?.isPremium || false,
				isEdited: m.isEdited || false,
				editedAt: m.editedAt,
				messageType: m.messageType || undefined
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

	// Özetleme: belirli bir oda için (soldaki liste üzerinden)
	const summarizeRoom = async (roomId: string) => {
		setIsSummarizing(true);
		try {
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');

			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(roomId)}/summary`, {
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				}
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || 'Özet alınamadı');
			}

			const data = await res.json();

			if (data.success) {
				if (!data.summary) {
					Swal.fire({ title: 'Bilgi', text: 'Özetlenecek yeni mesaj bulunamadı.', icon: 'info' });
				} else {
					Swal.fire({
						title: '🚀 Sohbet Özeti',
						html: `<div style="text-align: left; white-space: pre-wrap; max-height: 60vh; overflow-y: auto;">${data.summary}</div>`,
						confirmButtonText: 'Teşekkürler',
						width: '600px'
					});
				}
			}
		} catch (error: any) {
			console.error('Summarize error:', error);
			Swal.fire({
				title: 'Hata',
				text: error.message || 'Özet oluşturulurken bir hata oluştu.',
				icon: 'error'
			});
		} finally {
			setIsSummarizing(false);
		}
	};

	const onEmojiClick = (emojiData: EmojiClickData) => {
		setNewMessage(prev => prev + emojiData.emoji);
		setShowEmojiPicker(false);
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !selectedRoom) return;

		if (file.size > 10 * 1024 * 1024) {
			alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
			return;
		}

		setIsUploading(true);
		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch(`${API_BASE}/api/chat/upload`, {
				method: 'POST',
				headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
				body: formData
			});

			if (!res.ok) {
				const txt = await res.text().catch(() => '');
				throw new Error(txt || 'Upload failed');
			}

			const data = await res.json();
			if (!data?.url) {
				throw new Error('Upload response missing url');
			}
			const imageUrl = data.thumbnailUrl || data.url;

			// Optimistic image message while persisting via REST
			const optimistic: Message = {
				id: `upload-${Date.now()}`,
				user: 'Sen',
				userId: currentUserId || undefined,
				content: imageUrl,
				timestamp: new Date().toISOString(),
				isPremium: isUserPremium,
				messageType: 'image'
			};
			setMessages(prev => [...prev, optimistic]);

			const sendRes = await fetch(`${API_BASE}/api/chat/rooms/${selectedRoom.id}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({
					message: imageUrl,
					roomId: selectedRoom.id,
					messageType: 'image'
				})
			});

			if (!sendRes.ok) {
				const txt = await sendRes.text().catch(() => '');
				setMessages(prev => prev.filter(m => m.id !== optimistic.id));
				throw new Error(txt || 'Mesaj gönderilemedi');
			}

			const sendData = await sendRes.json().catch(() => ({}));
			const payload = sendData?.data || sendData;

			setMessages(prev => prev.map(m => m.id === optimistic.id ? ({
				id: payload._id || payload.id || optimistic.id,
				user: payload.sender?.username || payload.sender?.name || 'Sen',
				userId: payload.sender?._id || payload.sender?.id || optimistic.userId,
				content: payload.message || payload.content || optimistic.content,
				timestamp: payload.timestamp || payload.createdAt || new Date().toISOString(),
				isPremium: payload.sender?.isPremium ?? optimistic.isPremium,
				messageType: payload.messageType || 'image'
			}) : m));
		} catch (error) {
			console.error('File upload error:', error);
			alert('Dosya yüklenemedi');
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	// --- UseEffects ---
	useEffect(() => {
		const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
		const token = localStorage.getItem('authToken');
		const payload = decodeJwt(token);
		const userId = payload?._id || payload?.id || payload?.sub || payload?.userId;
		setIsUserPremium(!!payload?.isPremium);

		// connect socket
		const socket = io(API_BASE, { transports: ['websocket'] });
		socketRef.current = socket;

		socket.on('connect', () => {
			socket.emit('authenticate', { userId });
		});

		// Store current user id for permission checks
		setCurrentUserId(userId ? String(userId) : null);

		fetchRooms();

		// Socket olay dinleyicileri (newMessage, messageDeleted, vb.) burada kalır...
		socket.on('newMessage', (payload: any) => {
			const msg = payload?.message || payload;
			const roomId = payload?.roomId || msg?.chatRoom || msg?.chatRoom?._id;
			if (!roomId) return;
			setMessages(prev => {
				if (!selectedRoom || selectedRoom.id !== String(roomId)) return prev;
				const msgId = msg._id || msg.id || String(Date.now());
				// Prevent duplicates
				if (prev.some(m => m.id === msgId)) return prev;
				return [...prev, {
					id: msgId,
					user: msg.sender?.username || msg.sender?.name || 'Kullanıcı',
					content: msg.message || msg.content,
					timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
					isPremium: msg.sender?.isPremium || false,
					messageType: msg.messageType || 'text'
				}];
			});
		});

		// Invite socket
		socket.on('invitedToRoom', (p: any) => {
			try {
				const payload = p || {};
				const notif = {
					id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
					roomId: payload.roomId,
					inviter: payload.inviter,
					message: payload.message || null,
					createdAt: new Date().toISOString(),
					read: false
				};
				setNotifications(prev => {
					const next = [notif, ...(prev || [])];
					try { localStorage.setItem('chatNotifications', JSON.stringify(next)); } catch (e) { }
					return next;
				});
			} catch (e) { console.warn('invitedToRoom handler error', e); }
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

		socket.on('roomCreated', (roomData: any) => {
			try {
				const r = roomData || {};
				const mapped: Room = {
					id: r._id || r.id,
					icon: r.icon || '💬',
					name: r.name,
					description: r.description || '',
					memberCount: r.memberCount || r.participants?.length || 0,
					isPrivate: r.roomSettings?.isPrivate || r.isPrivate || false,
					isPremium: r.type === 'premium' || r.category === 'premium',
					lastMessage: r.lastMessage?.message || undefined,
					unreadCount: r.unreadCount || 0
				};
				setRooms(prev => {
					if (prev.some(p => p.id === mapped.id)) return prev;
					return [mapped, ...prev];
				});
			} catch (e) { /* ignore */ }
		});
		// cleanup
		return () => {
			try {
				if (socketRef.current) {
					socketRef.current.off('newMessage');
					socketRef.current.off('messageDeleted');
					socketRef.current.off('messageEdited');
					socketRef.current.off('userTyping');
					socketRef.current.off('roomCreated');
					socketRef.current.off('invitedToRoom');
					socketRef.current.disconnect();
					socketRef.current = null;
				}
			} catch (e) { /* ignore */ }
		};
	}, []);

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
						setRooms(prev => prev.map(r => r.id === (updated._id || updated.id) ? { ...r, isParticipant: true } : r));
						setSelectedRoom(prev => prev ? { ...prev, isParticipant: true } : prev);
					} else {
						if (res.status === 202) {
							console.info('Join request pending');
						} else {
							console.warn('Failed to join room', res.status);
						}
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

	// Ayarlar Modalı açıldığında state'leri doldur
	useEffect(() => {
		if (settingsDialogOpen && selectedRoom) {
			setNewRoomName(selectedRoom.name || '');
			setNewRoomDescription(selectedRoom.description || '');
			setNewRoomIcon(selectedRoom.icon || '💬');
			setNewRoomTags(selectedRoom.tags || []); // Room interface'indeki tags'i kullan
			setIsPrivateRoom(!!selectedRoom.isPrivate);
		}
	}, [settingsDialogOpen, selectedRoom]);

	// Persist notifications to localStorage when changed
	useEffect(() => {
		try { localStorage.setItem('chatNotifications', JSON.stringify(notifications)); } catch (e) { }
	}, [notifications]);

	const unreadCount = notifications.filter(n => !n.read).length;

	const handleNotificationClick = async (n: any) => {
		try {
			// Mark as read
			setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));

			// If room exists in local rooms, select it
			const found = rooms.find(r => String(r.id) === String(n.roomId));
			if (found) {
				setSelectedRoom(found);
				setShowNotifications(false);
				return;
			}

			// Otherwise fetch room details and add to list
			const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
			const token = localStorage.getItem('authToken');
			const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(n.roomId)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
			if (!res.ok) { console.warn('Failed to fetch room for notification', res.status); setShowNotifications(false); return; }
			const data = await res.json().catch(() => null);
			const roomData = data?.data || data;
			const mapped: Room = {
				id: roomData._id || roomData.id,
				icon: roomData.icon || '💬',
				name: roomData.name,
				description: roomData.description || '',
				memberCount: roomData.memberCount || roomData.participants?.length || 0,
				isPrivate: roomData.roomSettings?.isPrivate || false,
				isParticipant: !!(roomData.userStatus && roomData.userStatus.isParticipant),
				isPremium: roomData.type === 'premium' || roomData.category === 'premium',
				lastMessage: roomData.lastMessage?.message || undefined,
				unreadCount: roomData.unreadCount || 0,
				tags: roomData.tags || []
			};
			setRooms(prev => [mapped, ...prev.filter(r => r.id !== mapped.id)]);
			setSelectedRoom(mapped);
			setShowNotifications(false);
		} catch (e) {
			console.error('handleNotificationClick error', e);
		}
	};




	// auto-scroll to bottom when messages change
	useEffect(() => {
		if (!messagesEndRef.current) return;
		messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [messages]);

	const filteredRooms = rooms.filter((room) =>
		room.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="flex h-screen bg-white text-black" style={{ height: '100vh', backgroundColor: 'white' }}>
			{/* Sol Panel - Oda Listesi */}
			<div className="w-64 h-full bg-white border-r border-neutral-200 flex flex-col flex-shrink-0">
				{/* Header */}
				<div className="p-3 border-b border-neutral-200 bg-white">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<Crown className="text-yellow-500" size={18} />
							<h1 className="text-lg font-bold">Premium Odalar</h1>
						</div>
						<Button
							size="sm"
							variant="outline"
							className="bg-white border-neutral-300 rounded-full hover:bg-neutral-100 h-8 w-8 p-0 flex items-center justify-center"
							onClick={() => {
								setNewRoomName("");
								setNewRoomDescription("");
								setNewRoomIcon("💬");
								setNewRoomTags([]);
								setIsPrivateRoom(false);
								setCreateDialogOpen(true);
							}}
						>
							<Plus size={16} />
						</Button>
					</div>

					{/* Arama */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
						<Input
							placeholder="Oda ara..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 bg-neutral-50 border-neutral-200 rounded-lg focus:border-neutral-400 focus:ring-0"
						/>
					</div>
				</div>

				{/* Oda Listesi */}
				<div className="flex-1 overflow-y-auto">
					{isLoadingRooms ? (
						<div className="p-4 text-center text-neutral-500 flex items-center justify-center gap-2">
							<Loader2 size={16} className="animate-spin" /> Yükleniyor...
						</div>
					) : filteredRooms.length === 0 ? (
						<div className="p-8 text-center text-neutral-500">
							<p>Oda bulunamadı.</p>
							<Button variant="link" onClick={() => setCreateDialogOpen(true)} className="mt-2 text-blue-600">
								Yeni Oda Oluştur
							</Button>
						</div>
					) : (
						filteredRooms.map((room) => (
							<div
								key={room.id}
								className={`w-full p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${selectedRoom?.id === room.id ? 'bg-neutral-100' : ''}`}
							>
								<div className="flex justify-between items-start mb-1">
									<button
										className="flex items-center gap-2 font-medium truncate"
										onClick={() => setSelectedRoom(room)}
										title="Odayı aç"
									>
										<span>{room.icon}</span>
										<span className="truncate">{room.name}</span>
										{room.isPrivate && <Lock size={12} className="text-neutral-400" />}
									</button>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
											title="Sohbeti özetle"
											onClick={() => summarizeRoom(room.id)}
										>
											<Sparkles size={16} />
										</Button>
									</div>
								</div>
								<p className="text-sm text-neutral-500 mb-2 line-clamp-1">{room.description}</p>
								<div className="flex items-center justify-between mt-2">
									{room.lastMessage && (
										<p className="text-xs text-neutral-400 truncate max-w-[120px]">{room.lastMessage}</p>
									)}
									<div className="flex items-center gap-2 text-xs text-neutral-500 ml-auto">
										<Users size={12} />
										<span>{room.memberCount}</span>
										{(room.unreadCount || 0) > 0 && (
											<Badge className="bg-red-500 text-white ml-2 h-5 min-w-[20px] flex items-center justify-center px-1">
												{room.unreadCount}
											</Badge>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Sağ Panel - Chat Alanı */}
			<div className="flex-1 flex flex-col bg-neutral-50 h-full overflow-hidden min-w-0">
				{!selectedRoom ? (
					<div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
						<div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
							<MessageSquare size={48} className="text-neutral-300" />
						</div>
						<p className="text-lg">Bir oda seçin ve sohbete başlayın</p>
					</div>
				) : (
					<>
						{/* Chat Header */}
						<div className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-xl">
									{selectedRoom.icon}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h2 className="font-bold text-gray-900">{selectedRoom.name}</h2>
										{selectedRoom.isPrivate && <Lock size={14} className="text-neutral-400" />}
									</div>
									<div className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => { fetchMembers(selectedRoom.id); setShowMembersModal(true); }}>
										<Users size={12} />
										<span>{selectedRoom.memberCount} üye</span>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* Özetle Butonu - Sadece Premium Üyeler ve Katılımcılar */}
								{selectedRoom.isParticipant && isUserPremium && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleSummarize}
										disabled={isSummarizing}
										title="Sohbeti Özetle (Premium)"
										className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
									>
										{isSummarizing ? (
											<Loader2 size={20} className="animate-spin" />
										) : (
											<Sparkles size={20} />
										)}
									</Button>
								)}

								{/* Katıl Butonu (Eğer katılımcı değilse) */}
								{!selectedRoom.isParticipant && (
									<Button
										size="sm"
										onClick={() => { setPendingJoinRoom(selectedRoom); setJoinConfirmOpen(true); }}
										className="bg-black text-white hover:bg-gray-800"
									>
										Katıl
									</Button>
								)}

								{/* Davet Et */}
								{selectedRoom.isParticipant && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowInviteModal(true)}
										title="Davet Et"
									>
										<UserPlus size={20} className="text-neutral-600" />
									</Button>
								)}

								{/* Ayarlar */}
								{selectedRoom.isParticipant && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSettingsDialogOpen(true)}
										title="Oda Ayarları"
									>
										<Settings size={20} className="text-neutral-600" />
									</Button>
								)}

								{/* Katılma İstekleri (Admin) */}
								{selectedRoom.userStatus?.isAdmin && selectedRoom.isPrivate && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											fetchJoinRequests(selectedRoom.id);
											setJoinRequestsModalOpen(true);
										}}
										title="Katılma İstekleri"
									>
										<UserPlus size={20} className="text-neutral-600" />
										{joinRequests.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
									</Button>
								)}

								{/* Ayrıl */}
								{selectedRoom.isParticipant && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleLeaveRoom}
										title="Odadan Ayrıl"
										className="text-red-500 hover:text-red-700 hover:bg-red-50"
									>
										<LogOut size={20} />
									</Button>
								)}
							</div>
						</div>

						{/* Mesajlar */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
							{isLoadingMessages ? (
								<div className="flex justify-center p-4">
									<Loader2 className="animate-spin text-neutral-400" />
								</div>
							) : messages.length === 0 ? (
								<div className="text-center text-neutral-400 mt-10">
									<p>Henüz mesaj yok. İlk mesajı sen yaz!</p>
								</div>
							) : (
								messages.map((msg, idx) => {
									const isMe = (msg.userId && currentUserId ? String(msg.userId) === String(currentUserId) : (msg.user === 'Sen' || msg.user === 'You'));

									return (
										<div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} mb-3`}>
											<div className={`flex items-center gap-1 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
												<span className="text-xs font-semibold text-neutral-700">
													{msg.user}
												</span>
												{msg.isPremium && <Crown size={12} className="text-yellow-500" />}
											</div>
											<div
												className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-md relative group border flex flex-col ${isMe
													? 'bg-gradient-to-br from-blue-600 to-blue-700 text-black rounded-tr-sm border-blue-700'
													: 'bg-white text-gray-900 rounded-tl-sm border-neutral-300'
													}`}
												style={{ minHeight: '60px' }}
											>
												{/* Üç Nokta Menüsü (sadece kendi mesajım için) */}
												{isMe && (
													<button
														onClick={() => setMessageMenuOpen(prev => prev === msg.id ? null : msg.id)}
														className={`absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 focus:outline-none`}
														title="Seçenekler"
													>
														<MoreVertical size={16} className={isMe ? 'text-blue-100' : 'text-neutral-500'} />
													</button>
												)}

												{/* Menü İçeriği */}
												{isMe && messageMenuOpen === msg.id && (
													<div className={`absolute right-2 top-8 z-20 bg-white text-black shadow-lg rounded-md border border-neutral-200 w-32`}
														onMouseLeave={() => setMessageMenuOpen(null)}
													>
														<button
															className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
															onClick={() => startEditMessage(msg.id, msg.content)}
														>
															Düzenle
														</button>
														<button
															className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
															onClick={() => handleDeleteMessage(msg.id)}
														>
															Sil
														</button>
													</div>
												)}

												{/* Metin veya Düzenleme Textarea */}
												{editingMessageId === msg.id ? (
													<textarea
														className="w-full resize-none rounded-md border px-2 py-1 text-sm text-black bg-white flex-1"
														value={editingMessageContent}
														onChange={(e) => setEditingMessageContent(e.target.value)}
														style={{ minHeight: '100px', minWidth: '830px' }}
													/>
												) : (
													msg.messageType === 'image' || (msg.content && (msg.content.startsWith('http') && (msg.content.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || msg.content.includes('/uploads/chat/')))) ? (
														<div className="relative">
															<img
																src={msg.content}
																alt="Shared image"
																className="max-w-full max-h-96 object-scale-down"
																onClick={() => window.open(msg.content, '_blank')}
															/>
														</div>
													) : (
														<p className={`whitespace-pre-wrap break-words ${isMe ? 'text-black' : 'text-gray-900'}`}>{msg.content}</p>
													)
												)}
												<span className={`text-[10px] absolute bottom-2 right-3 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
													{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</span>
												{msg.isEdited && (
													<span className={`text-[10px] absolute bottom-2 left-3 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>(düzenlendi)</span>
												)}
												{editingMessageId === msg.id && (
													<div className="flex gap-2 justify-end mt-auto pt-2">
														<Button size="sm" variant="outline" onClick={() => { setEditingMessageId(null); setEditingMessageContent(''); }}>İptal</Button>
														<Button size="sm" onClick={handleEditMessage} className="bg-black border-black 
														border
														text-black
														 hover:bg-gray-800">Kaydet</Button>
													</div>
												)}
											</div>
										</div>
									);
								})
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Mesaj Yazma */}
						{selectedRoom.isParticipant ? (
							<div className="p-4 bg-white border-t border-neutral-200">
								<div className="flex items-end gap-2 bg-neutral-100 p-2 rounded-xl border border-transparent focus-within:border-neutral-300 focus-within:bg-white transition-all">
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleFileUpload}
										accept="image/*"
										className="hidden"
										style={{ display: 'none' }}
									/>
									<button
										className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploading}
									>
										{isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
									</button>
									<textarea
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault();
												handleSendMessage();
											}
										}}
										placeholder="Bir mesaj yazın..."
										className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-sm"
										style={{ minHeight: '40px' }}
									/>
									<div className="relative">
										<button
											className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
											onClick={() => setShowEmojiPicker(!showEmojiPicker)}
										>
											<Smile size={20} />
										</button>
										{showEmojiPicker && (
											<>
												<div
													className="fixed inset-0 z-40"
													onClick={() => setShowEmojiPicker(false)}
												/>
												<div className="fixed z-50 shadow-xl border rounded-xl" style={{
													bottom: '80px',
													right: '20px'
												}}>
													<EmojiPicker onEmojiClick={onEmojiClick} />
												</div>
											</>
										)}
									</div>
									<Button
										onClick={handleSendMessage}
										disabled={!newMessage.trim()}
										className={`rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all ${newMessage.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-neutral-200 text-neutral-400'
											}`}
									>
										<Send size={18} className={newMessage.trim() ? 'ml-0.5' : ''} />
									</Button>
								</div>
							</div>
						) : (
							<div className="p-4 bg-white border-t border-neutral-200 text-center">
								<p className="text-neutral-500 mb-2">Bu odaya mesaj göndermek için katılmalısınız.</p>
								<Button onClick={() => { setPendingJoinRoom(selectedRoom); setJoinConfirmOpen(true); }} className="bg-black text-white">
									Odaya Katıl
								</Button>
							</div>
						)}
					</>
				)}


				{/* Davet Modalı */}
				{
					showInviteModal && (
						<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
							<div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10 flex flex-col max-h-[90vh]">
								<div className="flex items-center justify-between mb-4 flex-shrink-0">
									<h3 className="text-lg font-semibold text-gray-900">Kullanıcı Davet Et</h3>
									<button
										onClick={() => setShowInviteModal(false)}
										className="text-gray-400 hover:text-gray-600"
									>
										<X size={20} />
									</button>
								</div>

								<div className="space-y-4 overflow-y-auto flex-1 p-1">
									<div>
										<label htmlFor="invite-username" className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
										<Input
											id="invite-username"
											placeholder="Kullanıcı adını girin..."
											className="bg-white border-neutral-300 rounded-lg"
											value={inviteUsername}
											onChange={(e) => setInviteUsername(e.target.value)}
										/>
									</div>

									<div>
										<label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-2">
											Davet Mesajı
										</label>
										<textarea
											id="invite-message"
											placeholder="İsterseniz bir not ekleyin..."
											value={inviteDescription}
											onChange={(e) => setInviteDescription(e.target.value)}
											maxLength={200}
											rows={3}
											className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
										/>
									</div>
								</div>

								<div className="flex gap-3 mt-6">
									<Button
										onClick={() => setShowInviteModal(false)}
										className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
									>
										İptal
									</Button>
									<Button
										onClick={async () => {
											if (!selectedRoom) return;
											if (!inviteUsername?.trim()) {
												alert('Lütfen bir kullanıcı adı girin');
												return;
											}
											setIsInviting(true);
											try {
												const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
												const token = localStorage.getItem('authToken');
												const res = await fetch(`${API_BASE}/api/chat/rooms/${encodeURIComponent(selectedRoom.id)}/invite`, {
													method: 'POST',
													headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
													body: JSON.stringify({ users: [inviteUsername.trim()], message: inviteDescription.trim() })
												});
												if (!res.ok) throw new Error('Invite failed');

												fetchMembers(selectedRoom.id);
												setInviteUsername('');
												setInviteDescription('');
												setShowInviteModal(false);
												alert('Davet gönderildi');
											} catch (err) {
												console.error('Invite error', err);
												alert('Davet gönderilemedi');
											} finally {
												setIsInviting(false);
											}
										}}
										disabled={isInviting}
										className="px-3 py-1 text-xs border border-black text-black hover:bg-black hover:text-white rounded-md"
									>
										{isInviting ? 'Gönderiliyor...' : 'Davet Gönder'}
									</Button>
								</div>
							</div>
						</div>
					)
				}

				{/* Oda Oluşturma Modalı */}
				{
					createDialogOpen && (
						<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
							<div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold text-gray-900">Yeni Oda Oluştur</h3>
									<button onClick={() => setCreateDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
										<X size={20} />
									</button>
								</div>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Oda Adı</label>
										<Input placeholder="Oda adını girin" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="bg-white border-neutral-300 rounded-lg" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
										<textarea placeholder="Oda açıklaması" value={newRoomDescription} onChange={(e) => setNewRoomDescription(e.target.value)} className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm" rows={3} />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
										<Input placeholder="💬" value={newRoomIcon} onChange={(e) => setNewRoomIcon(e.target.value)} className="w-16 text-lg text-center" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
										<div className="flex gap-2 items-center">
											<Input placeholder="Etiket ekle..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="w-full" />
											<Button size="sm" onClick={() => addTag(tagInput)}>Ekle</Button>
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											{newRoomTags.map(tag => (
												<div key={tag} className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full text-xs">
													<span>#{tag}</span>
													<button onClick={() => removeTag(tag)} className="text-neutral-500 hover:text-neutral-700 ml-1">×</button>
												</div>
											))}
										</div>
									</div>
									<div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
										<div className="flex items-center gap-2">
											<Lock size={16} className="text-neutral-600" />
											<span className="text-sm font-medium">Özel Oda</span>
										</div>
										<button onClick={() => setIsPrivateRoom(!isPrivateRoom)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivateRoom ? 'bg-black' : 'bg-gray-200'}`}>
											<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivateRoom ? 'translate-x-6' : 'translate-x-1'}`} />
										</button>
									</div>
								</div>
								<div className="flex gap-3 mt-6">
									<Button onClick={() => setCreateDialogOpen(false)} variant="outline" className="flex-1">İptal</Button>
									<Button onClick={handleCreateRoom} disabled={isCreatingRoom} className="flex-1 bg-black text-white hover:bg-gray-800">{isCreatingRoom ? 'Oluşturuluyor...' : 'Oluştur'}</Button>
								</div>
							</div>
						</div>
					)
				}

				{/* Oda Ayarları Modalı */}
				{
					settingsDialogOpen && selectedRoom && (
						<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
							<div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold text-gray-900">Oda Ayarları</h3>
									<button onClick={() => setSettingsDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
										<X size={20} />
									</button>
								</div>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Oda Adı</label>
										<Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="bg-white border-neutral-300 rounded-lg" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
										<textarea value={newRoomDescription} onChange={(e) => setNewRoomDescription(e.target.value)} className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm" rows={3} />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
										<Input value={newRoomIcon} onChange={(e) => setNewRoomIcon(e.target.value)} className="w-16 text-lg text-center" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
										<div className="flex gap-2 items-center">
											<Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="w-full" />
											<Button size="sm" onClick={() => addTag(tagInput)}>Ekle</Button>
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											{newRoomTags.map(tag => (
												<div key={tag} className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full text-xs">
													<span>#{tag}</span>
													<button onClick={() => removeTag(tag)} className="text-neutral-500 hover:text-neutral-700 ml-1">×</button>
												</div>
											))}
										</div>
									</div>
									<div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
										<div className="flex items-center gap-2">
											<Lock size={16} className="text-neutral-600" />
											<span className="text-sm font-medium">Özel Oda</span>
										</div>
										<button onClick={() => setIsPrivateRoom(!isPrivateRoom)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivateRoom ? 'bg-black' : 'bg-gray-200'}`}>
											<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivateRoom ? 'translate-x-6' : 'translate-x-1'}`} />
										</button>
									</div>
								</div>
								<div className="flex gap-3 mt-6">
									<Button onClick={() => setSettingsDialogOpen(false)} variant="outline" className="flex-1">İptal</Button>
									<Button onClick={updateRoomOnServer} disabled={isCreatingRoom} className="flex-1 bg-black text-white hover:bg-gray-800">Güncelle</Button>
								</div>
							</div>
						</div>
					)
				}

				{/* Katılma İstekleri Modalı */}
				{
					joinRequestsModalOpen && (
						<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
							<div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold text-gray-900">Katılma İstekleri</h3>
									<button
										onClick={() => setJoinRequestsModalOpen(false)}
										className="text-gray-400 hover:text-gray-600"
									>
										<X size={20} />
									</button>
								</div>

								<div className="space-y-3 max-h-72 overflow-y-auto">
									{joinRequests.length === 0 ? (
										<div className="text-center text-neutral-500 py-4">Bekleyen istek yok.</div>
									) : (
										joinRequests.map((reqItem: any, idx: number) => (
											<div key={idx} className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between bg-neutral-50">
												<div>
													<div className="font-medium text-sm">{reqItem.user?.username || 'Kullanıcı'}</div>
													<div className="text-xs text-neutral-500">{new Date(reqItem.requestedAt).toLocaleDateString()}</div>
												</div>
												<div className="flex gap-2">
													<Button size="sm" onClick={() => handleRespondJoinRequest(idx, true)} className="bg-green-600 text-white hover:bg-green-700 h-8 px-3">Kabul</Button>
													<Button size="sm" variant="outline" onClick={() => handleRespondJoinRequest(idx, false)} className="h-8 px-3">Reddet</Button>
												</div>
											</div>
										))
									)}
								</div>
								<div className="mt-4 flex justify-end">
									<Button onClick={() => setJoinRequestsModalOpen(false)} variant="outline">Kapat</Button>
								</div>
							</div>
						</div>
					)
				}

				{/* Katılma Onayı Modalı */}
				{
					joinConfirmOpen && pendingJoinRoom && (
						<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
							<div className="bg-white rounded-lg p-6 w-80 max-w-full shadow-2xl border border-gray-200 relative z-10">
								<div className="mb-4">
									<h3 className="text-lg font-semibold mb-2">Odaya Katıl</h3>
									<p className="text-sm text-neutral-600">
										<span className="font-bold">{pendingJoinRoom.name}</span> odasına katılmak istiyor musunuz?
									</p>
								</div>
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => { setJoinConfirmOpen(false); setPendingJoinRoom(null); }}
									>
										İptal
									</Button>
									<Button
										onClick={() => { setJoinConfirmOpen(false); setSelectedRoom(pendingJoinRoom); setPendingJoinRoom(null); }}
										className="bg-black text-white hover:bg-gray-800"
									>
										Katıl
									</Button>
								</div>
							</div>
						</div>
					)
				}

				{/* Üyeler Modalı */}
				{showMembersModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
						<div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl border border-gray-200 relative z-10">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-gray-900">Oda Üyeleri</h3>
								<button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
									<X size={20} />
								</button>
							</div>
							<div className="space-y-3 max-h-72 overflow-y-auto">
								{isLoadingMembers ? (
									<div className="flex justify-center py-4"><Loader2 className="animate-spin text-neutral-400" /></div>
								) : roomMembers.length === 0 ? (
									<div className="text-center text-neutral-500 py-4">Üye bulunamadı.</div>
								) : (
									roomMembers.map(member => (
										<div key={member.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-xs font-bold text-neutral-600">
													{member.username.substring(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-sm font-medium flex items-center gap-1">
														{member.username}
														{member.isPremium && <Crown size={12} className="text-yellow-500" />}
													</div>
													<div className="text-xs text-neutral-500">{member.isAdmin ? 'Yönetici' : 'Üye'}</div>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
