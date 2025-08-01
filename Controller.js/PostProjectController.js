import PostProjectModel from "../Model/PostProjectModel.js";
import UserModel from "../Model/UserModel.js";
import ProjectApplyModel from "../Model/ProjectApplyModel.js";
import nodemailer from "nodemailer";
import SubmitProjectModel from "../Model/SubmitProjectModel.js";
import dotenv from "dotenv";
import SiteSettings from "../Model/SiteSettingsModel.js";
// === Nodemailer Transporter ===
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === Email Send Function ===
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: 'BiZy Freelancing <bizy83724@gmail.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
};

export const createJobPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const { 
      title, 
      description, 
      budget, 
      duration, 
      category, 
      skillsRequired,
      projectRequirements,
      clientExperience,
      problemsFaced,
      expectedOutcome
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !budget ||
      !duration ||
      !category ||
      !skillsRequired ||
      !projectRequirements ||
      !clientExperience ||
      !problemsFaced ||
      !expectedOutcome
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const requestedBudget = Number(budget);

    // Check if user has enough balance
    if (user.totalEarnings < requestedBudget) {
      return res.status(400).json({
        success: false,
        message: "You don't have enough balance to create this job post",
      });
    }

    // Fetch dynamic postProjectTax from SiteSettings
    let postProjectTax = 10; // fallback default
    const settings = await SiteSettings.findOne();
    if (settings && typeof settings.postProjectTax === 'number') {
      postProjectTax = settings.postProjectTax;
    }

    // Calculate service charge (dynamic postProjectTax of requestedBudget)
    const serviceCharge = (requestedBudget * postProjectTax) / 100;
    const finalBudgetForJob = requestedBudget - serviceCharge;

    // Create and save job post
    const newJobPost = new PostProjectModel({
      client: req.user.id,
      title,
      description,
      budget: finalBudgetForJob,
      duration,
      category,
      skillsRequired: Array.isArray(skillsRequired)
        ? skillsRequired
        : [skillsRequired],
      projectRequirements,
      clientExperience,
      problemsFaced,
      expectedOutcome,
      status: "open",
    });

    const savedJobPost = await newJobPost.save();

    // Deduct full requested budget from user's totalEarnings
    user.totalEarnings -= requestedBudget;
    user.totalSpend += requestedBudget;
    await user.save();

    // Populate client details for real-time update
    const populatedJob = await PostProjectModel.findById(
      savedJobPost._id
    ).populate("client", "username email");

    res.status(201).json({
      success: true,
      message: "Job post created successfully",
      data: populatedJob,
      taxPercent: postProjectTax,
      serviceCharge,
      finalBudgetForJob,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyJobPosts = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const jobs = await PostProjectModel.find({ client: req.user.id })
      .populate("client", "username email")
      .sort({ createdAt: -1 });

    // Get applicants count for each job
    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job) => {
        const applicantsCount = await ProjectApplyModel.countDocuments({
          project: job._id,
        });
        return {
          ...job.toObject(),
          applicantsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Your job posts retrieved successfully",
      data: jobsWithApplicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJobPostById = async (req, res) => {
  try {
    const job = await PostProjectModel.findById(req.params.id).populate(
      "client",
      "username email"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job post retrieved successfully",
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateJobPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const job = await PostProjectModel.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if the logged-in user is the owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only update your own job posts",
      });
    }

    const {
      title,
      description,
      budget,
      duration,
      category,
      skillsRequired,
      status,
    } = req.body;

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Budget Update Logic
    if (budget) {
      const newBudget = Number(budget);
      const oldBudget = Number(job.budget);

      if (newBudget > oldBudget) {
        const extraBudgetNeeded = newBudget - oldBudget;

        if (user.totalEarnings < extraBudgetNeeded) {
          return res.status(400).json({
            success: false,
            message: "You don't have enough balance to increase the budget",
          });
        }

        user.totalEarnings -= extraBudgetNeeded;
        user.totalSpend += extraBudgetNeeded;
        await user.save();
      }

      job.budget = newBudget;
    }

    // Status Update Logic
    if (status && status === "cancelled" && job.status !== "cancelled") {
      const refundAmount = (job.budget * 90) / 100; // 90% of budget
      user.totalEarnings += refundAmount;
      await user.save();
    }

    // Update other fields
    if (title) job.title = title;
    if (description) job.description = description;
    if (duration) job.duration = duration;
    if (category) job.category = category;
    if (skillsRequired) {
      job.skillsRequired = Array.isArray(skillsRequired)
        ? skillsRequired
        : [skillsRequired];
    }
    if (status) job.status = status;

    const updatedJob = await job.save();

    // Populate client details for real-time update
    const populatedJob = await PostProjectModel.findById(
      updatedJob._id
    ).populate("client", "username email");

    res.status(200).json({
      success: true,
      message: "Job post updated successfully",
      data: populatedJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteJobPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const job = await PostProjectModel.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if the logged-in user is the owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only delete your own job posts",
      });
    }

    // Refund 90% if job is not completed
    if (job.status !== "completed") {
      const user = await UserModel.findById(req.user.id);
      if (user) {
        const refundAmount = (job.budget * 90) / 100;
        user.totalEarnings += refundAmount;
        await user.save();
      }
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllJobPosts = async (req, res) => {
  try {
    const jobs = await PostProjectModel.find()
      .populate("client", "username email totalSpend")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All job posts retrieved successfully",
      TotalJob: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchJobPosts = async (req, res) => {
  try {
    const { query, category, minBudget, maxBudget } = req.query;

    let searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { skillsRequired: { $in: [new RegExp(query, "i")] } },
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (minBudget || maxBudget) {
      searchQuery.budget = {};
      if (minBudget) searchQuery.budget.$gte = Number(minBudget);
      if (maxBudget) searchQuery.budget.$lte = Number(maxBudget);
    }

    const jobs = await PostProjectModel.find(searchQuery)
      .populate("client", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Job posts retrieved successfully",
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectDetailsWithVerification = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await PostProjectModel.findById(projectId)
      .populate(
        "client",
        "username email createdAt totalSpend totalEarnings isVerified"
      )
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const client = await UserModel.findById(project.client._id)
      .select("username email createdAt totalSpend totalEarnings isVerified")
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Project creator not found",
      });
    }

    const verificationDetails = {
      isVerified: client.isVerified,
      joinDate: client.createdAt,
      totalProjectsCreated: await PostProjectModel.countDocuments({
        client: client._id,
      }),
      totalSpend: client.totalSpend,
      totalEarnings: client.totalEarnings,
    };

    const responseData = {
      project: {
        ...project,
        client: undefined,
      },
      clientInfo: {
        id: client._id,
        username: client.username,
        email: client.email,
        ...verificationDetails,
      },
    };

    res.status(200).json({
      success: true,
      message: "Project details retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getApplicantsForMyProjects = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const myProjects = await PostProjectModel.find({ client: req.user.id });
    const projectIds = myProjects.map((project) => project._id);

    const applications = await ProjectApplyModel.find({
      project: { $in: projectIds },
    })
      .populate("project", "title description budget")
      .populate(
        "user",
        "username email totalEarnings profileImage completedProjects rating"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Applicants retrieved for your posted projects",
      totalApplications: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// controllers/ProjectApplyController.js

export const getApplicantsForProject = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projectId = req.params.projectId;

    // Verify project exists and belongs to the requesting user
    const project = await PostProjectModel.findOne({
      _id: projectId,
      client: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Get all applicants with user details and populate IsPlanActive
    const applicants = await ProjectApplyModel.find({ project: projectId })
      .populate({
        path: "user",
        select:
          "username email profileImage completedProjects rating plan maxProjectPerDay socialLinks",
      })
      .populate({
        path: "IsPlanActive",
        select: "name status maxProjectPerDay description",
        match: { status: "approved" },
      })
      .lean();

    // Sort applicants based on multiple criteria
    const sortedApplicants = applicants.sort((a, b) => {
      // First, prioritize users with approved plans
      const aHasPlan = a.IsPlanActive && a.IsPlanActive.status === "approved";
      const bHasPlan = b.IsPlanActive && b.IsPlanActive.status === "approved";

      if (aHasPlan && !bHasPlan) return -1;
      if (!aHasPlan && bHasPlan) return 1;

      // If both have plans or both don't have plans, sort by maxProjectPerDay
      if (aHasPlan && bHasPlan) {
        // 1. If maxProjectPerDay is greater than 0, prioritize users with available project capacity
        const aMaxProjects = a.IsPlanActive.maxProjectPerDay;
        const bMaxProjects = b.IsPlanActive.maxProjectPerDay;

        if (aMaxProjects > 0 && bMaxProjects <= 0) return -1;
        if (aMaxProjects <= 0 && bMaxProjects > 0) return 1;

        // 2. If both have available project capacity, prioritize based on completed projects
        if (a.user.completedProjects > b.user.completedProjects) return -1;
        if (a.user.completedProjects < b.user.completedProjects) return 1;

        // 3. Finally, compare by rating
        if (a.user.rating > b.user.rating) return -1;
        if (a.user.rating < b.user.rating) return 1;
      }

      // 4. If both have no approved plan, fallback to application time
      return new Date(a.appliedAt) - new Date(b.appliedAt);
    });

    // Add full URL to CV files and profile images
    const applicantsWithFullUrls = sortedApplicants.map((applicant) => ({
      ...applicant,
      cvFile: applicant.cvFile
        ? `${process.env.BASE_URL || "http://localhost:8080"}${
            applicant.cvFile
          }`
        : null,
      user: {
        ...applicant.user,
        profileImage: applicant.user.profileImage
          ? `${process.env.BASE_URL || "http://localhost:8080"}${
              applicant.user.profileImage
            }`
          : null,
      },
    }));

    res.status(200).json({
      success: true,
      message: "Applicants retrieved successfully",
      data: applicantsWithFullUrls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve applicants",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const applicationId = req.params.applicationId;

    if (!["pending", "hired", "rejected", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const application = await ProjectApplyModel.findById(applicationId)
      .populate("user", "username email")
      .populate("project", "title client slug");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const previousStatus = application.status;
    application.status = status;
    if (feedback) application.feedback = feedback;
    await application.save();

    const projectLink = `localhost:3000/BiZy/user/dashboard/client/projectdetail/${application.project.id}`;

    if (status === "hired") {
      await PostProjectModel.findByIdAndUpdate(
        application.project._id,
        { status: "In-progress" },
        { new: true }
      );

      if (previousStatus !== "hired") {
        try {
          await transporter.sendMail({
            from: `BiZy Freelancing <${process.env.EMAIL_USER}>`,
            to: application.user.email,
            subject: `🎉 You're Hired for "${application.project.title}"!`,
            html: `
              <p>Hi ${application.user.username},</p>
              <p>Congratulations! You've been <strong>hired</strong> for the project "<strong>${
                application.project.title
              }</strong>".</p>
              <p>You can now begin working. Click below to view the project details:</p>
              <a href="${projectLink}" style="color:blue;">View Project</a>
              <p><strong>Feedback:</strong> ${
                feedback || "No feedback provided."
              }</p>
              <p>Best of luck!<br/>Team BiZy Freelancing</p>
            `,
          });
        } catch (emailError) {
          // Optionally log email error here
        }
      }
    }

    if (status === "completed") {
      await PostProjectModel.findByIdAndUpdate(
        application.project._id,
        { status: "Completed" },
        { new: true }
      );
    }

    if (status === "rejected") {
      const hiredExists = await ProjectApplyModel.findOne({
        project: application.project._id,
        status: "hired",
      });

      if (!hiredExists) {
        await PostProjectModel.findByIdAndUpdate(
          application.project._id,
          { status: "Open" },
          { new: true }
        );
      }

      if (previousStatus !== "rejected") {
        try {
          await transporter.sendMail({
            from: `BiZy Freelancing <${process.env.EMAIL_USER}>`,
            to: application.user.email,
            subject: `Update on Your Application for "${application.project.title}"`,
            html: `
              <p>Hi ${application.user.username},</p>
              <p>Thank you for applying to "<strong>${
                application.project.title
              }</strong>".</p>
              <p>Unfortunately, your application has been <strong>rejected</strong> this time.</p>
              <p>Click below to view the project details:</p>
              <a href="${projectLink}" style="color:blue;">View Project</a>
              <p><strong>Feedback:</strong> ${
                feedback || "No feedback provided."
              }</p>
              <p>We encourage you to apply for other opportunities on BiZy Freelancing.</p>
              <p>Best regards,<br/>Team BiZy Freelancing</p>
            `,
          });
        } catch (emailError) {
          // Optionally log email error here
        }
      }
    }

    const populatedApplication = await ProjectApplyModel.findById(
      application._id
    )
      .populate("user", "username email profileImage")
      .populate("project", "title");

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: populatedApplication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ... (keep all your other existing controller methods below)
// controllers/JobController.js

export const getApplicantDetails = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await UserModel.findById(applicantId).select(
      "-password" // Optional: hide password or sensitive data
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Applicant details fetched successfully",
      data: applicant,
    });
  } catch (error) {
    console.error("Error fetching applicant details:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get My Jobs
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await PostProjectModel.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Get submission status for each job
    const jobsWithSubmissions = await Promise.all(
      jobs.map(async (job) => {
        const submission = await SubmitProjectModel.findOne({
          project: job._id,
        });
        return {
          ...job,
          hasSubmission: !!submission,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: jobsWithSubmissions,
    });
  } catch (error) {
    console.error("❌ Get My Jobs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while getting jobs",
      error: error.message,
    });
  }
};

export const getLatestJobPosts = async (req, res) => {
  try {
    // Optional query param for how many latest jobs to fetch, default is 5
    const limit = parseInt(req.query.limit) || 5;

    // Validate limit is a positive number
    if (isNaN(limit)) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a valid number",
      });
    }

    const latestJobs = await PostProjectModel.find()
      .sort({ createdAt: -1 }) // Sort descending by createdAt
      .limit(limit) // Limit the number of documents
      .populate("client", "username email profileImage") // Added profileImage
      .lean(); // Convert to plain JavaScript objects

    res.status(200).json({
      success: true,
      message: "Latest job posts retrieved successfully",
      total: latestJobs.length,
      data: latestJobs,
    });
  } catch (error) {
    console.error("Error fetching latest job posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest job posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ADMIN: Get all projects with applicants
export const getAllProjectsWithApplicantsAdmin = async (req, res) => {
  try {
    const projects = await PostProjectModel.find()
      .populate("client", "username email")
      .sort({ createdAt: -1 })
      .lean();

    const projectsWithApplicants = await Promise.all(
      projects.map(async (project) => {
        const applicants = await ProjectApplyModel.find({ project: project._id })
          .populate("user", "username email")
          .lean();
        return {
          ...project,
          applicants,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "All projects with applicants fetched successfully",
      data: projectsWithApplicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: Delete a project and all its applicants
export const deleteProjectAndApplicantsAdmin = async (req, res) => {
  try {
    const projectId = req.params.id;
    // Fetch project and client
    const project = await PostProjectModel.findById(projectId).populate("client", "email username profileImage");
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const client = project.client;
    // Fetch all applicants
    const applicants = await ProjectApplyModel.find({ project: projectId }).populate("user", "email username");

    // Email to project owner (client)
    const clientEmailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:32px 24px;box-shadow:0 2px 12px #0001;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src='https://i.ibb.co/6bQ7QwM/logo512.png' alt='BiZy Logo' style='width:80px;height:80px;border-radius:16px;margin-bottom:8px;' />
          <h2 style="color:#5a6bff;">Project Deleted by Admin</h2>
        </div>
        <p>Dear <b>${client.username || "User"}</b>,</p>
        <p>Your project <b>"${project.title}"</b> has been <span style="color:#ff4d4f;font-weight:bold;">deleted</span> by the BiZy admin team.</p>
        <p><b>Reason:</b> Your project was found to be against our policy or contained inappropriate wording.</p>
        <ul style="color:#ff4d4f;font-weight:bold;">
          <li>Your project has been removed from the platform.</li>
          <li>Your payment for this project is lost.</li>
          <li>This is a warning. Repeated violations may result in account suspension.</li>
        </ul>
        <p style="color:#ff4d4f;font-weight:bold;">Please avoid posting such projects or using inappropriate wording in the future.</p>
        <p>For any questions, contact support.</p>
        <br/>
        <p style="color:#5a6bff;font-weight:bold;">BiZy Team</p>
      </div>
    `;
    await sendEmail(client.email, `Your Project "${project.title}" Has Been Deleted`, clientEmailHtml);

    // Email to all applicants
    for (const app of applicants) {
      const applicant = app.user;
      const applicantEmailHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:32px 24px;box-shadow:0 2px 12px #0001;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src='https://i.ibb.co/6bQ7QwM/logo512.png' alt='BiZy Logo' style='width:80px;height:80px;border-radius:16px;margin-bottom:8px;' />
            <h2 style="color:#5a6bff;">Application Deleted</h2>
          </div>
          <p>Dear <b>${applicant.username || "User"}</b>,</p>
          <p>Your application for the project <b>"${project.title}"</b> has been <span style="color:#ff4d4f;font-weight:bold;">deleted</span> by the BiZy admin team.</p>
          <p><b>Reason:</b> The project was removed due to policy violation or inappropriate wording. Your application is also removed.</p>
          <ul style="color:#ff4d4f;font-weight:bold;">
            <li>This is a warning. Repeated inappropriate behavior may result in account suspension.</li>
          </ul>
          <p style="color:#ff4d4f;font-weight:bold;">Please avoid using inappropriate wording in your applications.</p>
          <br/>
          <p style="color:#5a6bff;font-weight:bold;">BiZy Team</p>
        </div>
      `;
      await sendEmail(applicant.email, `Your Application for "${project.title}" Has Been Deleted`, applicantEmailHtml);
    }

    // Delete all applicants and the project
    await ProjectApplyModel.deleteMany({ project: projectId });
    await PostProjectModel.findByIdAndDelete(projectId);
    res.status(200).json({
      success: true,
      message: "Project and all its applicants deleted successfully, notifications sent.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get recommended applicants for a project
export const getRecommendedApplicants = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    // Get project details
    const project = await PostProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get all applicants for this project
    const applicants = await ProjectApplyModel.find({ project: projectId })
      .populate('user', 'Fullname username email skills portfolio completedProjects rating bio UserType')
      .populate('IsPlanActive');

    if (!applicants || applicants.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No applicants found"
      });
    }

    // Calculate recommendation scores for each applicant
    const scoredApplicants = applicants.map(applicant => {
      let score = 0;
      const user = applicant.user;
      const projectSkills = project.skillsRequired || [];
      const userSkills = user.skills || [];

      // 1. Skills Matching (40% weight)
      const matchingSkills = projectSkills.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      const skillsMatchPercentage = (matchingSkills.length / projectSkills.length) * 100;
      score += (skillsMatchPercentage * 0.4);

      // 2. Experience Level (20% weight)
      const completedProjects = user.completedProjects || 0;
      let experienceScore = 0;
      if (completedProjects >= 50) experienceScore = 100;
      else if (completedProjects >= 20) experienceScore = 80;
      else if (completedProjects >= 10) experienceScore = 60;
      else if (completedProjects >= 5) experienceScore = 40;
      else if (completedProjects >= 1) experienceScore = 20;
      score += (experienceScore * 0.2);

      // 3. Rating (15% weight)
      const rating = user.rating || 0;
      score += (rating * 0.15);

      // 4. Portfolio Relevance (15% weight)
      const portfolio = user.portfolio || [];
      let portfolioScore = 0;
      if (portfolio.length > 0) {
        // Check if portfolio has projects related to project category
        const relevantProjects = portfolio.filter(item => {
          const description = (item.description || '').toLowerCase();
          const title = (item.title || '').toLowerCase();
          const category = project.category.toLowerCase();
          
          return description.includes(category) || 
                 title.includes(category) ||
                 projectSkills.some(skill => 
                   description.includes(skill.toLowerCase()) ||
                   title.includes(skill.toLowerCase())
                 );
        });
        portfolioScore = (relevantProjects.length / portfolio.length) * 100;
      }
      score += (portfolioScore * 0.15);

      // 5. Premium Membership (10% weight)
      const isPremium = applicant.IsPlanActive?.status === "approved";
      score += (isPremium ? 100 : 0) * 0.1;

      // 6. Bio Relevance (5% weight)
      const bio = user.bio || '';
      let bioScore = 0;
      if (bio.length > 0) {
        const bioLower = bio.toLowerCase();
        const relevantTerms = projectSkills.filter(skill => 
          bioLower.includes(skill.toLowerCase())
        );
        bioScore = (relevantTerms.length / projectSkills.length) * 100;
      }
      score += (bioScore * 0.05);

      // 7. Application Quality (5% weight)
      const coverLetter = applicant.description || '';
      let applicationScore = 0;
      if (coverLetter.length > 50) applicationScore = 100;
      else if (coverLetter.length > 20) applicationScore = 60;
      else if (coverLetter.length > 0) applicationScore = 30;
      score += (applicationScore * 0.05);

      return {
        ...applicant.toObject(),
        recommendationScore: Math.round(score),
        matchingSkills,
        skillsMatchPercentage: Math.round(skillsMatchPercentage),
        experienceLevel: completedProjects,
        portfolioRelevance: Math.round(portfolioScore),
        isPremium,
        applicationQuality: Math.round(applicationScore)
      };
    });

    // Sort by recommendation score (highest first)
    const recommendedApplicants = scoredApplicants
      .filter(applicant => applicant.recommendationScore > 30) // Only show applicants with decent match
      .sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.status(200).json({
      success: true,
      data: recommendedApplicants,
      message: `Found ${recommendedApplicants.length} recommended applicants`
    });

  } catch (error) {
    console.error("Get recommended applicants error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
