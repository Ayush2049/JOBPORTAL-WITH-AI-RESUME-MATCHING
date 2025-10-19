// models/Message.js
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const MessageSchema = new Schema(
  {
    conversation: {
      type: Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, trim: true }, // ← Changed from 'text' to 'content'
    attachments: [
      {
        url: String,
        filename: String,
        mime: String,
      },
    ],
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model("Message", MessageSchema);
export default Message;