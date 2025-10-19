// server.js
import app from "./app.js";
import cloudinary from "cloudinary";
import { Server } from "socket.io";
import { createServer } from "http";
import { initChatSocket } from "./sockets/chatSocket.js";

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
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize chat socket
initChatSocket(io);

// Start server
server.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
