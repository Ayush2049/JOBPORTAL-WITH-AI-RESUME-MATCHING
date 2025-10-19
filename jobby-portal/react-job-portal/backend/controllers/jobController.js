import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";

// Get all active jobs
export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ expired: false });
  res.status(200).json({
    success: true,
    jobs,
  });
});

// Post a new job (only for employers)
export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  const {
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    skillSection // ← new field
  } = req.body;

  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400)
    );
  }

  // Validate skillSection
  if (!skillSection || !Array.isArray(skillSection) || skillSection.length === 0) {
    return next(new ErrorHandler("Please provide at least one skill.", 400));
  }

  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
    skillSection
  });

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

// Get jobs posted by current employer
export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

// Update a job (only for employers)
export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  // If updating skillSection, ensure at least one skill
  if (req.body.skillSection && req.body.skillSection.length === 0) {
    return next(new ErrorHandler("Please provide at least one skill.", 400));
  }

  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
    job,
  });
});

// Delete a job (only for employers)
export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

// Get a single job by ID
export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler("Invalid ID / CastError", 404));
  }
});

// ----------------------
// Get matched jobs
// ----------------------
export const getMatchedJobs = catchAsyncErrors(async (req, res, next) => {
  const { matchedSkills, minMatchScore = 0 } = req.query;

  let skillsArray = [];
  try {
    skillsArray = JSON.parse(decodeURIComponent(matchedSkills || '[]'));
    skillsArray = skillsArray.filter(skill =>
      skill && skill.trim().length > 1 && skill !== '.' &&
      !skill.includes('GitHub Link') && !skill.includes('+++')
    );
  } catch (error) {
    console.error('Error parsing skills:', error);
    skillsArray = [];
  }

  console.log('Parsed user skills:', skillsArray);

  const jobs = await Job.find({ expired: false });
  console.log(`Found ${jobs.length} active jobs`);

  // Filter jobs based on skillSection
  const matchedJobs = jobs.map(job => {
    const jobSkills = (job.skillSection || []).map(skillObj => skillObj.name); // extract skill names
    const matchScore = calculateJobMatch(skillsArray, jobSkills);

    return {
      ...job.toObject(),
      matchScore
    };
  })
    .filter(job => job.matchScore >= parseInt(minMatchScore))
    .sort((a, b) => b.matchScore - a.matchScore);

  console.log(`Returning ${matchedJobs.length} matched jobs`);

  res.status(200).json({
    success: true,
    jobs: matchedJobs,
    count: matchedJobs.length,
    userSkills: skillsArray
  });
});

// Helper function to calculate match score
const calculateJobMatch = (userSkills, jobSkills) => {
  if (!userSkills || !jobSkills || jobSkills.length === 0 || userSkills.length === 0) {
    return 0;
  }

  const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim());

  const matchedSkills = normalizedUserSkills.filter(userSkill =>
    normalizedJobSkills.some(jobSkill =>
      jobSkill.includes(userSkill) ||
      userSkill.includes(jobSkill) ||
      (userSkill === 'js' && jobSkill.includes('javascript')) ||
      (userSkill.includes('javascript') && jobSkill === 'js') ||
      (userSkill === 'css' && jobSkill.includes('css')) ||
      (userSkill === 'html' && jobSkill.includes('html'))
    )
  );

  const matchPercentage = Math.round((matchedSkills.length / jobSkills.length) * 100);

  return matchPercentage;
};
