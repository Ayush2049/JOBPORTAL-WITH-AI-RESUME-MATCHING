// server.js
import app from "./app.js";
import cloudinary from "cloudinary";
import { Server } from "socket.io";
import { createServer } from "http";
import { initChatSocket } from "./sockets/chatSocket.js";

const PORT = process.env.PORT || 5000;

// ✅ ADD THIS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RESUME_PARSER_URL,
  "http://localhost:5173", // 👈 allow local frontend
];

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create HTTP server from Express app
const server = createServer(app);

// Attach socket.io to the server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Initialize chat socket
initChatSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
