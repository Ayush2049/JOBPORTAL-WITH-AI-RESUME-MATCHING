// controllers/chatController.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

/**
 * Create or return an existing conversation between two users (optionally for a job)
 * participants: array of two userIds
 * jobId: optional
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const senderId = req.user._id.toString(); // logged-in user
    const { receiverId, job } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    const participants = [senderId, receiverId];

    // Check if conversation already exists
    let convo = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      job: job || undefined,
    });

    // If not, create new
    if (!convo) {
      convo = new Conversation({
        participants,
        job: job || undefined,
        unreadCounts: { [senderId]: 0, [receiverId]: 0 },
      });
      await convo.save();
    }

    return res.status(200).json(convo);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Send a message: create message, update conversation.lastMessage + unreadCounts
 */
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id.toString();
    // ✅ FIXED: Destructure 'content' instead of 'text'
    const { conversationId, receiverId, content, attachments, job } = req.body;

    if (!receiverId && !conversationId) {
      return res.status(400).json({ message: "receiverId or conversationId required" });
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    } else {
      const participants = [senderId, receiverId].map(id => mongoose.Types.ObjectId(id));
      conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
        job: job || undefined,
      });
      if (!conversation) {
        conversation = new Conversation({
          participants,
          job: job || undefined,
          unreadCounts: { [senderId]: 0, [receiverId]: 0 },
        });
        await conversation.save();
      }
    }

    // Create message with required receiver field
    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,  // ✅ Now this will work because we destructured 'content'
      attachments: attachments || [],
    });
    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.unreadCounts[receiverId] = (conversation.unreadCounts?.[receiverId] || 0) + 1;
    await conversation.save();

    // Populate sender for response
    const populatedMessage = await Message.findById(message._id).populate("sender", "name email");

    // Emit via Socket.IO if exists
    if (req.app?.get("io")) {
      const io = req.app.get("io");
      io.to(receiverId).emit("newMessage", populatedMessage);
      io.to(senderId).emit("messageSent", populatedMessage);
    }

    return res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("sendMessage error", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get user conversations with last message + unread counts
 */
export const listConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const skip = (page - 1) * limit;

    const convos = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("lastMessage")
      .populate("participants", "name email");

    const result = convos.map((c) => {
      const unread = c.unreadCounts?.get
        ? c.unreadCounts.get(userId) || 0
        : c.unreadCounts?.[userId] || 0;
      return { ...c.toObject(), unread };
    });

    return res.json({ data: result, page, limit });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get messages in a conversation (paginated)
 */
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "50");
    const skip = (page - 1) * limit;

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    if (!convo.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email");

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    if (convo.unreadCounts?.set) {
      convo.unreadCounts.set(userId, 0);
    } else {
      convo.unreadCounts[userId] = 0;
    }
    await convo.save();

    return res.json({ data: messages.reverse(), page, limit });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationRead = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    if (!convo.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    if (convo.unreadCounts?.set) {
      convo.unreadCounts.set(userId, 0);
    } else {
      convo.unreadCounts[userId] = 0;
    }
    await convo.save();

    return res.json({ message: "Marked read" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get total unread messages for logged-in user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const convos = await Conversation.find({ participants: userId }, "unreadCounts");
    let total = 0;
    convos.forEach((c) => {
      const val = c.unreadCounts?.get
        ? c.unreadCounts.get(userId) || 0
        : c.unreadCounts?.[userId] || 0;
      total += Number(val || 0);
    });
    return res.json({ unread: total });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};