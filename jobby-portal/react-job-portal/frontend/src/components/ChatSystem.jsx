// components/ChatSystem.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatSystem = ({
  currentUserId,
  otherUserId,
  jobId,
  showChat,
  onClose,
  otherUserName,
}) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log("ChatSystem props:", {
      currentUserId,
      otherUserId,
      jobId,
      showChat,
      otherUserName,
    });
  }, [currentUserId, otherUserId, jobId, showChat, otherUserName]);

  // --- Get or Create Conversation ---
  const getOrCreateConversation = async () => {
    if (!otherUserId) {
      console.warn("No otherUserId provided for conversation");
      return;
    }

    try {
      setLoading(true);
      console.log("Getting/Creating conversation with user:", otherUserId);

      const response = await axios.post(
        `http://localhost:5000/api/chat/conversation`,
        { receiverId: otherUserId },
        { withCredentials: true }
      );

      console.log("Conversation data:", response.data);
      setConversationId(response.data._id);
      return response.data._id;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Messages ---
  const fetchMessages = async (convId) => {
    if (!convId) {
      console.warn("No conversation ID provided");
      return;
    }

    try {
      console.log("Fetching messages for conversation:", convId);

      const response = await axios.get(
        `http://localhost:5000/api/chat/messages/${convId}`,
        {
          withCredentials: true,
        }
      );

      console.log("Fetched messages:", response.data);

      const messagesArray = response.data.data || response.data;

      if (!Array.isArray(messagesArray)) {
        console.error("Messages data is not an array:", messagesArray);
        return;
      }

      // --- Transform messages safely ---
      const transformedMessages = messagesArray.map((msg) => ({
        _id: msg._id,
        senderId: msg.sender?._id || msg.sender,
        receiverId: msg.receiver?._id || msg.receiver,
        content: msg.content || "", // Now we consistently use 'content' field
        timestamp: msg.createdAt || msg.timestamp,
        read: msg.read,
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // --- Send Message ---
  const sendMessage = async (e) => {
    e.preventDefault();

    console.log("sendMessage triggered", {
      newMessage,
      currentUserId,
      otherUserId,
      conversationId,
    });

    if (!newMessage.trim()) {
      console.warn("Cannot send empty message");
      return;
    }

    if (!currentUserId) {
      console.error("Missing currentUserId - user not authenticated");
      alert("Authentication error: Please refresh the page and try again");
      return;
    }

    if (!otherUserId) {
      console.error("Missing otherUserId - no recipient selected");
      alert("No recipient selected for the message");
      return;
    }

    try {
      setSending(true);

      let convId = conversationId;
      if (!convId) {
        convId = await getOrCreateConversation();
      }

      if (!convId) {
        throw new Error("Failed to create or get conversation");
      }

      const messageData = {
        conversationId: convId,
        receiverId: otherUserId,
        content: newMessage.trim(), // ✅ Sending 'content' field
      };

      console.log("Sending message:", messageData);

      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        messageData,
        {
          withCredentials: true,
        }
      );

      console.log("Message sent successfully:", response.data);

      const newMsg = {
        _id: response.data._id,
        senderId: currentUserId,
        receiverId: otherUserId,
        content: newMessage.trim(), // ✅ Using 'content' consistently
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");

      if (convId) {
        await markAsRead(convId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Failed to send message: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setSending(false);
    }
  };

  // --- Mark Conversation as Read ---
  const markAsRead = async (convId) => {
    if (!convId) return;

    try {
      await axios.post(
        `http://localhost:5000/api/chat/conversations/${convId}/mark-read`,
        {},
        { withCredentials: true }
      );
      console.log("Conversation marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // --- Auto-scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Initialize chat ---
  useEffect(() => {
    const initializeChat = async () => {
      if (showChat && otherUserId && currentUserId) {
        try {
          const convId = await getOrCreateConversation();
          if (convId) {
            await fetchMessages(convId);
            await markAsRead(convId);
          }
        } catch (error) {
          console.error("Error initializing chat:", error);
        }
      }
    };

    initializeChat();
  }, [otherUserId, showChat, currentUserId]);

  // --- Close chat cleanup ---
  useEffect(() => {
    if (!showChat) {
      setMessages([]);
      setConversationId(null);
    }
  }, [showChat]);

  if (!showChat) return null;

  if (!currentUserId) {
    return (
      <div className="chat-system-overlay">
        <div className="chat-system-modal">
          <div className="chat-header">
            <h3>Authentication Error</h3>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>
          <div className="messages-container">
            <div className="error-message">
              Please log in to use the chat feature.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!otherUserId) {
    return (
      <div className="chat-system-overlay">
        <div className="chat-system-modal">
          <div className="chat-header">
            <h3>Chat Error</h3>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>
          <div className="messages-container">
            <div className="error-message">No recipient selected for chat.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-system-overlay">
      <div className="chat-system-modal">
        <div className="chat-header">
          <h3>Chat with {otherUserName || "User"}</h3>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id || message.timestamp}
                className={`message ${
                  message.senderId === currentUserId ? "sent" : "received"
                }`}
              >
                <div className="message-content" style={{ color: "black" }}>
                  {message.content || "[empty message]"}{" "}
                  {/* ✅ Displaying 'content' field */}
                </div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {message.read && message.senderId === currentUserId && (
                  <div className="message-status">✓ Read</div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
          />
          <button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSystem;
