import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  parsedData: {
    skills: [String],
    experience: Number,
    education: String,
    certifications: [String],
    languages: [String]
  },
  matchScore: {
    type: Number,
    default: 0
  },
  matchedSkills: [String],
  missingSkills: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Resume', resumeSchema);