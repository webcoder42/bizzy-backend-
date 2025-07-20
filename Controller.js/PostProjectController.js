import PostProjectModel from "../Model/PostProjectModel.js";
import UserModel from "../Model/UserModel.js";
import ProjectApplyModel from "../Model/ProjectApplyModel.js";
import nodemailer from "nodemailer";
import SubmitProjectModel from "../Model/SubmitProjectModel.js";

export const createJobPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
    }

    const { title, description, budget, duration, category, skillsRequired } =
      req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !budget ||
      !duration ||
      !category ||
      !skillsRequired
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

    // Calculate service charge (10% of requestedBudget)
    const serviceCharge = (requestedBudget * 10) / 100;
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
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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

// Create transporter directly in the controller
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bizy83724@gmail.com",
    pass: "ddrd kpnn ptjb zxnt",
  },
});

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
    await ProjectApplyModel.deleteMany({ project: projectId });
    await PostProjectModel.findByIdAndDelete(projectId);
    res.status(200).json({
      success: true,
      message: "Project and all its applicants deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
