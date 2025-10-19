// sockets/chatSocket.js
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

// Extract user from token (sent during socket handshake)
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) return next(new Error("User not found"));

    socket.user = user; // attach user to socket
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};

export const initChatSocket = (io) => {
  io.use(authenticateSocket); // run auth on every connection

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.user._id})`);

    // Join a room for this user (so we can emit directly later)
    socket.join(socket.user._id.toString());

    // Handle sending a message
    socket.on("sendMessage", async ({ conversationId, receiverId, content }) => {
      try {
        let conversation = null;

        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else if (receiverId) {
          conversation = await Conversation.findOne({
            participants: { $all: [socket.user._id, receiverId] },
          });

          if (!conversation) {
            conversation = await Conversation.create({
              participants: [socket.user._id, receiverId],
            });
          }
        }

        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found" });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender: socket.user._id,
          content,
        });

        conversation.updatedAt = new Date();
        await conversation.save();

        // Broadcast to sender + receiver rooms
        io.to(socket.user._id.toString()).emit("newMessage", message);
        conversation.participants.forEach((p) => {
          if (p.toString() !== socket.user._id.toString()) {
            io.to(p.toString()).emit("newMessage", message);
          }
        });
      } catch (err) {
        console.error("sendMessage error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);
    });
  });
};
