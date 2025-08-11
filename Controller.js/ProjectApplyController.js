import mongoose from "mongoose";
import PostProjectModel from "../Model/PostProjectModel.js";
import ProjectApplyModel from "../Model/ProjectApplyModel.js";
import UserModel from "../Model/UserModel.js";
import PlanPurchaseModel from "../Model/PlanPurchaseModel.js";
import sanitize from "mongo-sanitize";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
// === Nodemailer Transporter ===
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

// Apply to a project

export const applyToProject = async (req, res) => {
  try {
    // ✅ 1. Authentication check
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;
    const projectId = req.body.projectId;
    const description = sanitize(req.body.description);
    const skills = sanitize(req.body.skills);
    const cvFilePath = req.file ? `/uploads/cvs/${req.file.filename}` : null;

    // ✅ 2. Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // ✅ 3. Fetch project
    const project = await PostProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // ✅ 4. Check project status is "open"
    if (!project.status || project.status.toLowerCase() !== "open") {
      return res.status(400).json({
        success: false,
        message: `You can only apply to projects with status 'open'. Current status: '${
          project.status || "unknown"
        }'`,
      });
    }

    // ✅ 5. Check for duplicate application
    const alreadyApplied = await ProjectApplyModel.exists({
      user: userId,
      project: projectId,
    });
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You can only apply once per project",
        code: "DUPLICATE_APPLICATION",
      });
    }

    // ✅ 6. Find latest approved plan
    const latestApprovedPlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved",
    }).sort({ submittedAt: -1 });

    // ✅ 7. Create new application
    const newApplication = await ProjectApplyModel.create({
      user: userId,
      project: projectId,
      description: description || "",
      cvFile: cvFilePath,
      skills:
        skills
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [],
      applicationDate: new Date(),
      IsPlanActive: latestApprovedPlan ? latestApprovedPlan._id : null,
    });

    // ✅ 8. Respond with success
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        applicationId: newApplication._id,
        cvFile: cvFilePath ? `${process.env.BASE_URL || "http://localhost:8080"}${cvFilePath}` : null,
        appliedAt: newApplication.applicationDate,
      },
    });
  } catch (error) {
    if (
      error.message.includes("file type") ||
      error.message.includes("file size")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Application failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all applied projects
export const getAppliedProjects = async (req, res) => {
  try {
    // Check authentication
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find all project applications by the user
    const applications = await ProjectApplyModel.find({
      user: userId,
    }).populate({
      path: "project",
      match: { status: "open" }, // Only include projects that are still open
    });

    // Extract the populated projects and filter out nulls (non-open ones)
    const appliedProjects = applications
      .map((app) => app.project)
      .filter((project) => project !== null); // remove closed or deleted ones

    res.status(200).json({
      success: true,
      message: "Open applied projects retrieved successfully",
      data: appliedProjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applied projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get detailed project information with application status
export const getProjectDetails = async (req, res) => {
  try {
    // Check authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;
    const projectId = req.params.id;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // Find the project
    const project = await PostProjectModel.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Find client details with proper field names from your UserModel
    let client = {
      Fullname: "Unknown Client",
      email: "",
      profileImage: "",
      createdAt: "",
      username: "",
    };

    if (project.client && mongoose.Types.ObjectId.isValid(project.client)) {
      const clientData = await UserModel.findById(project.client)
        .select("Fullname email profileImage createdAt username")
        .lean();
      if (clientData) {
        client = clientData;
      }
    }

    // Find the user's application
    const application = await ProjectApplyModel.findOne({
      user: userId,
      project: projectId,
    }).lean();

    // Format dates properly
    const formatDate = (date) => {
      if (!date) return "N/A";
      try {
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        return "Invalid Date";
      }
    };

    // Prepare response data matching all your model fields
    const responseData = {
      id: project._id,
      title: project.title || "No title",
      description: project.description || "No description provided",
      budget: project.budget || 0,
      duration: project.duration || "Not specified",
      category: project.category || "Not specified",
      skillsRequired: project.skillsRequired || [],
      status: project.status || "unknown",
      createdAt: formatDate(project.createdAt),
      client: {
        id: client._id || "",
        name: client.Fullname || "Unknown Client",
        username: client.username || "",
        email: client.email || "",
        profileImage: client.profileImage || "",
        memberSince: formatDate(client.createdAt),
      },
      application: application
        ? {
            id: application._id,
            description: application.description || "No cover letter provided",
            cvFile: application.cvFile || "",
            skills: application.skills || [],
            status: application.status || "pending",
            applicationDate: formatDate(
              application.appliedAt || application.applicationDate
            ),
            updatedAt: formatDate(application.updatedAt),
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Project details retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch project details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Check if user has any hired applications
export const checkHiredApplications = async (req, res) => {
  try {
    // Authentication check
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;

    // Check for hired applications
    const hiredApplications = await ProjectApplyModel.find({
      user: userId,
      status: "hired",
    }).populate({
      path: "project",
      select: "title client status", // Only select necessary fields
    });

    if (hiredApplications.length > 0) {
      // Format the response data
      const hiredProjects = hiredApplications.map((app) => ({
        applicationId: app._id,
        projectId: app.project?._id,
        projectTitle: app.project?.title,
        clientId: app.project?.client,
        projectStatus: app.project?.status,
        applicationStatus: app.status,
        hiredDate: app.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        message: "User has hired applications",
        data: hiredProjects,
      });
    }

    // If no hired applications found
    res.status(200).json({
      success: true,
      message: "No hired applications found for this user",
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check hired applications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get count of applicants for each project
export const getApplicantsCountForProjects = async (req, res) => {
  try {
    const projects = await PostProjectModel.find().lean();

    const result = await Promise.all(
      projects.map(async (project) => {
        const count = await ProjectApplyModel.countDocuments({
          project: project._id,
        });
        return {
          projectId: project._id,
          title: project.title,
          applicantsCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Applicants count fetched for all projects",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants count",
      error: error.message,
    });
  }
};

// Get detailed list of applicants for each project
export const getApplicantsDetailsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const applications = await ProjectApplyModel.find({ project: projectId })
      .populate({
        path: "user",
        select:
          "Fullname email username profileImage completedProjects rating skills createdAt",
      })
      .lean();

    const applicants = applications.map((app) => ({
      _id: app._id,
      user: app.user,
      project: app.project,
      IsPlanActive: app.IsPlanActive,
      description: app.description,
      cvFile: app.cvFile ? `${process.env.BASE_URL || "http://localhost:8080"}${app.cvFile}` : null,
      skills: app.skills,
      status: app.status,
      appliedAt: app.applicationDate || app.appliedAt,
      updatedAt: app.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: "Applicants details fetched successfully",
      data: applicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants details",
      error: error.message,
    });
  }
};

// Check if user has already applied to a project
export const checkIfUserApplied = async (req, res) => {
  try {
    // Check authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;
    const projectId = req.params.projectId;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // Check if application exists
    const application = await ProjectApplyModel.findOne({
      user: userId,
      project: projectId,
    });

    res.status(200).json({
      success: true,
      hasApplied: !!application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check application status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ADMIN: Delete a specific applicant's proposal from a project
export const deleteApplicantProposalAdmin = async (req, res) => {
  try {
    const { projectId, applicantId } = req.params;
    // Fetch applicant and project
    const application = await ProjectApplyModel.findOne({ project: projectId, user: applicantId }).populate("user", "email username").populate("project", "title");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    const applicant = application.user;
    const project = application.project;
    // Email to applicant
    const applicantEmailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:32px 24px;box-shadow:0 2px 12px #0001;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src='https://i.ibb.co/6bQ7QwM/logo512.png' alt='BiZy Logo' style='width:80px;height:80px;border-radius:16px;margin-bottom:8px;' />
          <h2 style="color:#5a6bff;">Application Deleted</h2>
        </div>
        <p>Dear <b>${applicant.username || "User"}</b>,</p>
        <p>Your application for the project <b>"${project.title}"</b> has been <span style="color:#ff4d4f;font-weight:bold;">deleted</span> by the BiZy admin team.</p>
        <p><b>Reason:</b> Your application was found to contain inappropriate wording or violate our policy.</p>
        <ul style="color:#ff4d4f;font-weight:bold;">
          <li>This is a warning. Repeated inappropriate behavior may result in account suspension.</li>
        </ul>
        <p style="color:#ff4d4f;font-weight:bold;">Please avoid using inappropriate wording in your applications.</p>
        <br/>
        <p style="color:#5a6bff;font-weight:bold;">BiZy Team</p>
      </div>
    `;
    await sendEmail(applicant.email, `Your Application for "${project.title}" Has Been Deleted`, applicantEmailHtml);
    // Delete the application
    await ProjectApplyModel.findOneAndDelete({ project: projectId, user: applicantId });
    res.status(200).json({
      success: true,
      message: "Applicant's proposal deleted successfully, notification sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
