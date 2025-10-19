import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";
import nodemailer from "nodemailer";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(resume.mimetype)) {
    return next(
      new ErrorHandler("Invalid file type. Please upload a PNG, JPEG, or WEBP file.", 400)
    );
  }

  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloudinary Error:",
        cloudinaryResponse.error || "Unknown Cloudinary error"
      );
      return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
    }

    const { name, email, coverLetter, phone, address, jobId } = req.body;
    const applicantID = {
      user: req.user._id,
      role: "Job Seeker",
    };

    if (!jobId) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    const employerID = {
      user: jobDetails.postedBy,
      role: "Employer",
    };

    if (
      !name ||
      !email ||
      !coverLetter ||
      !phone ||
      !address ||
      !applicantID ||
      !employerID ||
      !resume
    ) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }

    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      resume: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
      status: "Pending" // Added default status
    });

    res.status(200).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  } catch (error) {
    // Handle Cloudinary specific errors
    if (error.message && error.message.includes("api_key")) {
      console.error("Cloudinary API key error:", error.message);
      return next(new ErrorHandler("File upload service configuration error", 500));
    }

    // Handle any other errors
    return next(error);
  }
});

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id });

    // Debug: Log what we're returning for employer
    console.log("Employer applications:", applications.map(app => ({
      id: app._id,
      name: app.name,
      status: app.status
    })));

    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });

    // Debug: Log what we're finding
    console.log("Raw applications from DB:", applications.map(app => ({
      id: app._id,
      name: app.name,
      status: app.status,
      hasStatus: app.status !== undefined
    })));

    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);

// Reusable mail function with better error handling
const sendMail = async (to, subject, text) => {
  // Check if SMTP credentials exist
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not configured. Skipping email.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({ // Fixed: createTransport (not createTransporter)
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Job Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error;
  }
};

export const updateApplicationStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Pending", "On Review", "Accepted", "Rejected"];
    if (!validStatuses.includes(status)) {
      return next(new ErrorHandler(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
    }

    console.log("Updating application:", id, "to status:", status);

    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }

    // Check authorization
    if (application.employerID.user.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Not authorized to update this application", 403));
    }

    console.log("Before update - application.status:", application.status);
    console.log("Before update - application.employerID:", application.employerID);

    // Update status at root level
    application.status = status;
    await application.save();

    console.log("After update - application.status:", application.status);

    // Send email notifications (with error handling)
    try {
      if (status === "Accepted") {
        await sendMail(
          application.email,
          "Application Update - Accepted",
          `Dear ${application.name},\n\nCongratulations! Your application has been accepted.\n\nBest Regards,\nJob Portal Team`
        );
      } else if (status === "Rejected") {
        await sendMail(
          application.email,
          "Application Update - Rejected",
          `Dear ${application.name},\n\nWe regret to inform you that your application was not selected.\n\nBest of luck for future opportunities.\n\nBest Regards,\nJob Portal Team`
        );
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the status update if email fails
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application,
    });
  }
);

// TEMPORARY FIX ENDPOINT - Remove after running once
export const fixStatusLocation = catchAsyncErrors(
  async (req, res, next) => {
    try {
      let fixedCount = 0;

      // First, find applications where status is in employerID
      const appsWithMisplacedStatus = await Application.find({
        "employerID.status": { $exists: true }
      });

      console.log(`Found ${appsWithMisplacedStatus.length} applications with misplaced status`);

      for (let app of appsWithMisplacedStatus) {
        if (app.employerID.status) {
          app.status = app.employerID.status;
          // Clean up the employerID object
          app.employerID = {
            user: app.employerID.user,
            role: app.employerID.role
          };
          await app.save();
          fixedCount++;
          console.log(`Fixed application ${app._id}: moved status "${app.status}" to root level`);
        }
      }

      // Second, add default "Pending" status to applications without any status
      const appsWithoutStatus = await Application.updateMany(
        { status: { $exists: false } },
        { $set: { status: "Pending" } }
      );

      console.log(`Added Pending status to ${appsWithoutStatus.modifiedCount} applications`);

      // Third, ensure all applications have a valid status
      const appsWithNullStatus = await Application.updateMany(
        { status: null },
        { $set: { status: "Pending" } }
      );

      console.log(`Fixed ${appsWithNullStatus.modifiedCount} applications with null status`);

      res.status(200).json({
        success: true,
        message: `Fixed ${fixedCount} applications with misplaced status, added Pending status to ${appsWithoutStatus.modifiedCount} applications, and fixed ${appsWithNullStatus.modifiedCount} null statuses`,
        details: {
          misplacedStatusFixed: fixedCount,
          pendingStatusAdded: appsWithoutStatus.modifiedCount,
          nullStatusFixed: appsWithNullStatus.modifiedCount
        }
      });
    } catch (error) {
      console.error("Error fixing status:", error);
      return next(new ErrorHandler("Failed to fix status", 500));
    }
  }
);

// FORCE FIX ENDPOINT - Use this if the other fix doesn't work
export const forceFixAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    try {
      console.log("Starting force fix of all applications...");

      // Get all applications
      const allApplications = await Application.find({});
      console.log(`Found ${allApplications.length} total applications`);

      let fixedCount = 0;

      for (let app of allApplications) {
        console.log(`Processing application ${app._id}:`);
        console.log(`  Current status: ${app.status}`);
        console.log(`  EmployerID: ${JSON.stringify(app.employerID)}`);

        let needsUpdate = false;

        // If status is undefined, null, or doesn't exist
        if (!app.status) {
          app.status = "Pending";
          needsUpdate = true;
          console.log(`  Set status to Pending`);
        }

        // If status is in employerID, move it
        if (app.employerID && app.employerID.status) {
          app.status = app.employerID.status;
          app.employerID = {
            user: app.employerID.user,
            role: app.employerID.role
          };
          needsUpdate = true;
          console.log(`  Moved status from employerID to root: ${app.status}`);
        }

        if (needsUpdate) {
          await app.save();
          fixedCount++;
          console.log(`  ✅ Fixed application ${app._id}`);
        } else {
          console.log(`  ✅ Application ${app._id} already has correct status: ${app.status}`);
        }
      }

      console.log(`Force fix completed. Fixed ${fixedCount} applications.`);

      res.status(200).json({
        success: true,
        message: `Force fixed ${fixedCount} out of ${allApplications.length} applications`,
        totalApplications: allApplications.length,
        fixedCount: fixedCount
      });
    } catch (error) {
      console.error("Error in force fix:", error);
      return next(new ErrorHandler("Failed to force fix applications", 500));
    }
  }
);