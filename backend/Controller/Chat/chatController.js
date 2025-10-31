import { ChatRoom, Message } from '../../models/chatModel.js';
import User from '../../models/userModel.js';

export const createRoom = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      isPrivate = false, 
      requireApproval = false, 
      maxParticipants = 1000, 
      allowInvites = true, 
      icon = '💬',
      type = 'public',
      category = 'general',
      tags = []
    } = req.body;

    // Normalize user id from auth middleware (supports req.userId or req.user.userId)
    const creatorId = req.userId || req.user?.userId || req.user?.id;

    // Validasyon
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Oda adı zorunludur' 
      });
    }

    // Oda adı benzersiz mi kontrol et
    const existingRoom = await ChatRoom.findOne({ 
      name: name.trim() 
    });
    
    if (existingRoom) {
      return res.status(409).json({ 
        success: false,
        error: 'Bu oda adı zaten kullanılıyor' 
      });
    }

    // Oda oluştur
    const room = new ChatRoom({
      name: name.trim(),
      description: description?.trim() || '',
      type,
      category,
      icon,
      roomSettings: {
        isPrivate,
        requireApproval,
        maxParticipants: Math.min(maxParticipants, 5000), // Limit koy
        allowInvites
      },
      participants: [{
        user: creatorId,
        role: 'admin',
        joinedAt: new Date()
      }],
      admins: [creatorId],
      createdBy: creatorId
    });

    await room.save();

    // Emit new room to connected clients so others see it in real time
    try {
      const io = req.app.get('io');
      if (io) {
        // send minimal room info to clients
        const publicRoom = await ChatRoom.findById(room._id)
          .populate('participants.user', 'name username profilePicture')
          .lean();
        io.emit('roomCreated', publicRoom);
      }
    } catch (emitErr) {
      console.warn('Failed to emit roomCreated event', emitErr);
    }

    // Oluşturucuyu odaya otomatik ekle
    await room.populate('participants.user', 'name username profilePicture');
    // set createdBy if not set
    if (!room.createdBy) {
      room.createdBy = creatorId;
      await room.save();
    }

    // Sistem mesajı oluştur
    const systemMessage = new Message({
      sender: creatorId,
      chatRoom: room._id,
      message: `${req.user?.username || 'Sistem'} odayı oluşturdu`,
      messageType: 'system'
    });
    await systemMessage.save();

    // Eğer tags geldiyse kaydet
    if (Array.isArray(tags) && tags.length > 0) {
      room.tags = tags.map(t => String(t).trim()).filter(Boolean);
      await room.save();
    }

    // also emit if tags updated
    try {
      const io = req.app.get('io');
      if (io) {
        const publicRoom = await ChatRoom.findById(room._id)
          .populate('participants.user', 'name username profilePicture')
          .lean();
        io.emit('roomCreated', publicRoom);
      }
    } catch (emitErr) {
      /* ignore */
    }

    res.status(201).json({ 
      success: true,
      message: 'Oda başarıyla oluşturuldu', 
      data: room 
    });

  } catch (error) {
    console.error('Error creating room:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz veri formatı' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Oda oluşturulurken bir hata oluştu' 
    });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      type,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

  const userId = req.userId || req.user?.userId || req.user?.id;

    // Filtre oluştur
    let filter = { isActive: true };
    
    // Arama
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtreleme
    if (category) filter.category = category;
    if (type) filter.type = type;

    // Private odaları filtrele
    if (!req.user.isAdmin) {
      filter.$or = [
        { 'roomSettings.isPrivate': false },
        { 'participants.user': userId },
        { createdBy: userId }
      ];
    }

    // Sıralama
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const rooms = await ChatRoom.find(filter)
      .populate('participants.user', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username profilePicture'
        }
      })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Performans için

    // Kullanıcı durumunu ekle
    const roomsWithUserStatus = rooms.map(room => ({
      ...room,
      userStatus: {
        isParticipant: room.participants.some(p => p.user._id.toString() === userId),
        isAdmin: room.admins.includes(userId),
        canJoin: !room.roomSettings.isPrivate || room.roomSettings.allowInvites
      }
    }));

    const total = await ChatRoom.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: roomsWithUserStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ 
      success: false,
      error: 'Odalar alınırken bir hata oluştu' 
    });
  }
};


export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
  const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId)
      .populate('participants.user', 'name username profilePicture isOnline')
      .populate('admins', 'name username profilePicture')
      .populate('moderators', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username profilePicture'
        }
      });

    if (!room) {
      return res.status(404).json({ 
        success: false,
        error: 'Oda bulunamadı' 
      });
    }

    // Erişim kontrolü
    const isParticipant = room.participants.some(p => p.user._id.toString() === userId);
    const isPrivate = room.roomSettings.isPrivate;
    
    if (isPrivate && !isParticipant && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Bu odaya erişim izniniz yok' 
      });
    }

    const roomData = room.toObject();
    roomData.userStatus = {
      isParticipant,
      isAdmin: room.admins.includes(userId),
      isModerator: room.moderators.includes(userId),
      role: isParticipant ? room.participants.find(p => p.user._id.toString() === userId).role : null
    };

    res.status(200).json({
      success: true,
      data: roomData
    });

  } catch (error) {
    console.error('Error getting room:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz oda ID formatı' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Oda bilgileri alınırken bir hata oluştu' 
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;
  const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false,
        error: 'Oda bulunamadı' 
      });
    }

    // Yetki kontrolü - sadece adminler güncelleyebilir
    const isAdmin = room.admins.includes(userId);
    if (!isAdmin && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Bu işlem için yetkiniz yok' 
      });
    }

    // Güncellenebilir alanlar
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      icon: updates.icon,
      type: updates.type,
      category: updates.category
    };

    // RoomSettings güncellemesi
    if (updates.roomSettings) {
      Object.keys(updates.roomSettings).forEach(key => {
        if (room.roomSettings[key] !== undefined) {
          room.roomSettings[key] = updates.roomSettings[key];
        }
      });
    }

    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] !== undefined) {
        room[key] = allowedUpdates[key];
      }
    });

    room.updatedAt = new Date();
    await room.save();

    await room.populate('participants.user', 'name username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Oda başarıyla güncellendi',
      data: room
    });

  } catch (error) {
    console.error('Error updating room:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz güncelleme verisi' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Oda güncellenirken bir hata oluştu' 
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
  const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false,
        error: 'Oda bulunamadı' 
      });
    }

    // Yetki kontrolü - sadece admin veya oda sahibi silebilir
    const isAdmin = room.admins.includes(userId);
    const isOwner = room.createdBy.toString() === userId;
    
    if (!isAdmin && !isOwner && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Bu odayı silme yetkiniz yok' 
      });
    }

    // Soft delete - isActive false yap
    room.isActive = false;
    room.updatedAt = new Date();
    await room.save();

    // Alternatif: Gerçek silme
    // await ChatRoom.findByIdAndDelete(roomId);

    res.status(200).json({ 
      success: true,
      message: 'Oda başarıyla silindi' 
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ 
      success: false,
      error: 'Oda silinirken bir hata oluştu' 
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomId, message, messageType = 'text' } = req.body;
  const senderId = req.userId || req.user?.userId || req.user?.id;

    // Validasyon
    if (!roomId || !message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Oda ID ve mesaj zorunludur'
      });
    }

    // Oda var mı ve kullanıcı üye mi kontrol et
    const room = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': senderId,
      isActive: true
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Oda bulunamadı veya bu odada değilsiniz'
      });
    }

    // Yeni mesaj oluştur
    const newMessage = new Message({
      sender: senderId,
      chatRoom: roomId,
      message: message.trim(),
      messageType,
      isRead: [{
        user: senderId
      }]
    });

    await newMessage.save();

    // Mesajı populate et
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username profilePicture');

    // Socket.io ile gerçek zamanlı mesaj gönder
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('newMessage', {
        message: populatedMessage,
        roomId: roomId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Mesaj gönderildi',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz oda ID formatı'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Mesaj gönderilemedi'
    });
  }
};

// Chat mesajlarını getir
export const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
  const userId = req.userId || req.user?.userId || req.user?.id;
    const { page = 1, limit = 50, before } = req.query;

    // Kullanıcının odaya erişimi var mı kontrol et
    const room = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': userId,
      isActive: true
    });

    if (!room) {
      return res.status(403).json({
        success: false,
        error: 'Bu odaya erişim izniniz yok'
      });
    }

    // Sorgu filtresi
    let filter = { chatRoom: roomId };
    
    // Belirli bir mesajdan öncekileri getir (infinite scroll için)
    if (before) {
      filter._id = { $lt: before };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name username profilePicture')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mesajları ters çevir (en eskiden en yeniye)
    const sortedMessages = messages.reverse();

    // Okunmamış mesajları okundu olarak işaretle (son 50 mesaj için)
    if (page == 1) {
      const unreadMessages = await Message.find({
        chatRoom: roomId,
        sender: { $ne: userId },
        'isRead.user': { $ne: userId }
      }).limit(50);

      for (let msg of unreadMessages) {
        if (!msg.isRead.some(read => read.user.toString() === userId)) {
          msg.isRead.push({ user: userId });
          await msg.save();
        }
      }
    }

    const total = await Message.countDocuments({ chatRoom: roomId });

    res.status(200).json({
      success: true,
      data: sortedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: (page * limit) < total
      }
    });

  } catch (error) {
    console.error('Mesajları getirme hatası:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz oda ID formatı'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Mesajlar alınamadı'
    });
  }
};

// Kullanıcının chat listesini getir (son mesajlarla birlikte)
export const getChatList = async (req, res) => {
  try {
  const userId = req.userId || req.user?.userId || req.user?.id;
    const { type = 'all' } = req.query;

    let roomFilter = {
      'participants.user': userId,
      isActive: true
    };

    // Oda tipine göre filtrele
    if (type !== 'all') {
      roomFilter.type = type;
    }

    // Kullanıcının odalarını getir
    const userRooms = await ChatRoom.find(roomFilter)
      .populate('participants.user', 'name username profilePicture isOnline')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username profilePicture'
        }
      })
      .sort({ updatedAt: -1 });

    // Her oda için okunmamış mesaj sayısını hesapla
    const roomsWithUnreadCount = await Promise.all(
      userRooms.map(async (room) => {
        const unreadCount = await Message.countDocuments({
          chatRoom: room._id,
          sender: { $ne: userId },
          'isRead.user': { $ne: userId }
        });

        const roomObj = room.toObject();
        roomObj.unreadCount = unreadCount;
        
        // Kullanıcının odadaki rolünü belirle
        const userParticipant = room.participants.find(
          p => p.user._id.toString() === userId
        );
        roomObj.userRole = userParticipant ? userParticipant.role : 'member';

        return roomObj;
      })
    );

    res.status(200).json({
      success: true,
      data: roomsWithUnreadCount
    });

  } catch (error) {
    console.error('Chat listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Chat listesi alınamadı'
    });
  }
};

// Mesajı sil
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
  const userId = req.userId || req.user?.userId || req.user?.id;

    const message = await Message.findById(messageId)
      .populate('chatRoom');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Mesaj bulunamadı'
      });
    }

    // Sadece mesaj sahibi veya admin silebilir
    const isMessageOwner = message.sender.toString() === userId;
    const isRoomAdmin = message.chatRoom.admins.includes(userId);

    if (!isMessageOwner && !isRoomAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Bu mesajı silme yetkiniz yok'
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Socket ile silme bildirimi gönder
    const io = req.app.get('io');
    if (io) {
      io.to(message.chatRoom._id.toString()).emit('messageDeleted', {
        messageId: messageId,
        roomId: message.chatRoom._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mesaj silindi'
    });

  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Mesaj silinemedi'
    });
  }
};

// Mesajı düzenle
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newMessage } = req.body;
  const userId = req.userId || req.user?.userId || req.user?.id;

    if (!newMessage || newMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mesaj içeriği zorunludur'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Mesaj bulunamadı'
      });
    }

    // Sadece mesaj sahibi düzenleyebilir
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Bu mesajı düzenleme yetkiniz yok'
      });
    }

    // Mesajı güncelle
    message.message = newMessage.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Populate edilmiş mesajı getir
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name username profilePicture');

    // Socket ile güncelleme bildirimi gönder
    const io = req.app.get('io');
    if (io) {
      io.to(message.chatRoom.toString()).emit('messageEdited', {
        message: updatedMessage,
        roomId: message.chatRoom
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mesaj güncellendi',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Mesaj düzenleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Mesaj güncellenemedi'
    });
  }
};

// Okunma durumunu güncelle
export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Okunmamış mesajları bul ve okundu olarak işaretle
    await Message.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: userId },
        'isRead.user': { $ne: userId }
      },
      {
        $push: { isRead: { user: userId } }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Mesajlar okundu olarak işaretlendi'
    });

  } catch (error) {
    console.error('Okunma durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Okunma durumu güncellenemedi'
    });
  }
};

// Kullanıcının odaya katılmasını sağlar
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ success: false, error: 'Oda bulunamadı' });
    }

    // Eğer zaten üye ise
    const already = room.participants.some(p => p.user.toString() === String(userId));
    if (already) {
      return res.status(200).json({ success: true, message: 'Zaten odaya üyeksiniz', data: room });
    }

    // Eğer oda private ve requireApproval true ise, create a join request instead of auto-joining
    if (room.roomSettings?.isPrivate && room.roomSettings?.requireApproval) {
      // Check if there's an existing pending request
      const existingReq = room.joinRequests?.find(r => String(r.user) === String(userId) && r.status === 'pending');
      if (existingReq) {
        return res.status(202).json({ success: true, message: 'Katılma isteğiniz beklemede', data: existingReq });
      }
      room.joinRequests = room.joinRequests || [];
      room.joinRequests.push({ user: userId, status: 'pending', requestedAt: new Date() });
      await room.save();

      // Notify room admins via socket about the join request
      try {
        const io = req.app.get('io');
        if (io) {
          // emit to admins --- server-side socket listeners can decide who to notify; emit public event
          io.emit('joinRequest', { roomId: room._id, userId });
        }
      } catch (err) {
        console.warn('join request emit failed', err);
      }

      return res.status(202).json({ success: true, message: 'Katılma isteği gönderildi', data: { roomId: room._id } });
    }

    // Otherwise, allow immediate join
    room.participants.push({ user: userId, role: 'member', joinedAt: new Date() });
    room.updatedAt = new Date();
    await room.save();

    // Populate for response
    const populated = await ChatRoom.findById(room._id)
      .populate('participants.user', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .lean();

    // Emit socket event to room and public list
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(roomId).emit('userJoined', { roomId, userId });
        io.emit('roomUpdated', populated);
      }
    } catch (err) {
      // ignore
    }

    res.status(200).json({ success: true, message: 'Odaya katıldınız', data: populated });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ success: false, error: 'Odaya katılma başarısız' });
  }
};

// Approve or deny a join request (admins only)
export const respondJoinRequest = async (req, res) => {
  try {
    const { roomId, requestIndex } = req.params; // we'll use index for simplicity
    const { approve } = req.body;
    const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ success: false, error: 'Oda bulunamadı' });

    // Only admins can approve
    if (!room.admins.map(a => String(a)).includes(String(userId)) && String(room.createdBy) !== String(userId) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yetkiniz yok' });
    }

    const idx = parseInt(requestIndex, 10);
    if (isNaN(idx) || !room.joinRequests || !room.joinRequests[idx]) {
      return res.status(400).json({ success: false, error: 'Geçersiz istek' });
    }

    const reqItem = room.joinRequests[idx];
    if (approve) {
      // add participant
      room.participants.push({ user: reqItem.user, role: 'member', joinedAt: new Date() });
      reqItem.status = 'approved';
    } else {
      reqItem.status = 'denied';
    }
    await room.save();

    // Emit updates
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(roomId).emit('roomUpdated', await ChatRoom.findById(roomId).lean());
        io.emit('joinRequestResponse', { roomId, requestIndex: idx, approved: !!approve, user: reqItem.user });
      }
    } catch (err) { /* ignore */ }

    res.status(200).json({ success: true, message: approve ? 'Kullanıcı kabul edildi' : 'Kullanıcı reddedildi' });
  } catch (error) {
    console.error('respondJoinRequest error', error);
    res.status(500).json({ success: false, error: 'İstek işlenemedi' });
  }
};

// Get pending join requests for a room (admins only)
export const getJoinRequests = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId || req.user?.userId || req.user?.id;

    const room = await ChatRoom.findById(roomId).populate('joinRequests.user', 'name username profilePicture');
    if (!room) return res.status(404).json({ success: false, error: 'Oda bulunamadı' });

    // Only admins or owner can view
    if (!room.admins.map(a => String(a)).includes(String(userId)) && String(room.createdBy) !== String(userId) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yetkiniz yok' });
    }

    const pending = (room.joinRequests || []).map((r, idx) => ({ index: idx, user: r.user, status: r.status, requestedAt: r.requestedAt }));

    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    console.error('getJoinRequests error', error);
    res.status(500).json({ success: false, error: 'İstek alınamadı' });
  }
};