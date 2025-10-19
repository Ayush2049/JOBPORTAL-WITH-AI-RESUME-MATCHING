import Resume from '../models/resumeSchema.js';
import Job from '../models/jobSchema.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
// Calculate match score between resume skills and job requirements
const calculateMatchScore = (resumeSkills, jobSkills) => {
  if (!resumeSkills || !jobSkills || jobSkills.length === 0) return 0;

  const matchedSkills = resumeSkills.filter(skill =>
    jobSkills.some(jobSkill =>
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  const score = (matchedSkills.length / jobSkills.length) * 100;
  return Math.min(Math.round(score), 100);
};

// Modified controller - works without authentication and uses mock job data
export const storeResumeAndMatch = catchAsyncError(async (req, res, next) => {
  const { userId, jobId, parsedData } = req.body;

  let job;
  let jobSkills = [];

  // Try to get real job, but if it fails, use mock data
  try {
    if (jobId && jobId !== "target-job") {
      job = await Job.findById(jobId);
    }
  } catch (error) {
    console.log("Job not found, using mock data");
  }

  // Use mock job data if no real job found
  if (!job) {
    jobSkills = [
      "JavaScript", "React", "Node.js", "MongoDB", "Express",
      "HTML", "CSS", "Git", "TypeScript", "Next.js",
      "Python", "Java", "SQL", "Docker", "AWS"
    ];
  } else {
    jobSkills = job.skillsRequired || [];
  }

  // Calculate match score
  const resumeSkills = parsedData.skills || [];
  const matchScore = calculateMatchScore(resumeSkills, jobSkills);

  const matchedSkills = resumeSkills.filter(skill =>
    jobSkills.some(jobSkill =>
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  const missingSkills = jobSkills.filter(jobSkill =>
    !resumeSkills.some(skill =>
      skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  // Optional: Save to database (comment out if you don't want to save)
  /*
  try {
    const resume = await Resume.create({
      userId,
      jobId,
      parsedData,
      matchScore,
      matchedSkills,
      missingSkills
    });
  } catch (error) {
    console.log("Database save failed, continuing without saving:", error.message);
  }
  */

  // Return the results
  res.status(200).json({
    success: true,
    matchScore,
    matchedSkills,
    missingSkills,
    message: "Skills matched successfully"
  });
});
// Get match results for a user and job
export const getMatchResults = catchAsyncError(async (req, res, next) => {
  const { userId, jobId } = req.params;

  const resume = await Resume.findOne({ userId, jobId })
    .populate('userId', 'name email')
    .populate('jobId', 'title company skillsRequired');

  if (!resume) {
    return next(new ErrorHandler('Resume data not found', 404));
  }

  res.status(200).json({
    success: true,
    resume
  });
});

// Get all matches for a user
export const getUserMatches = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;

  const resumes = await Resume.find({ userId })
    .populate('jobId', 'title company location salary skillsRequired')
    .sort({ matchScore: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resumes.length,
    resumes
  });
});

// Get all matches for a job
export const getJobMatches = catchAsyncError(async (req, res, next) => {
  const { jobId } = req.params;

  const resumes = await Resume.find({ jobId })
    .populate('userId', 'name email phone')
    .sort({ matchScore: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resumes.length,
    resumes
  });
});