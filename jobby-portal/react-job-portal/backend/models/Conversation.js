// models/Conversation.js
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: Types.ObjectId,
        ref: "User", // change to your user model name if different
        required: true,
      },
    ],
    job: {
      type: Types.ObjectId,
      ref: "Job", // optional: link conversation to job posting
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCounts: {
      // map of userId -> number of unread messages for that user
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 }); // helpful index


export const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;