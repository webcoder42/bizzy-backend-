import SubmitProjectModel from "../Model/SubmitProjectModel.js";
import PostProjectModel from "../Model/PostProjectModel.js";
import UserModel from "../Model/UserModel.js";
import nodemailer from "nodemailer";
import sanitize from "mongo-sanitize";

// === Nodemailer Transporter ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bizy83724@gmail.com",
    pass: "ddrd kpnn ptjb zxnt",
  },
});

// === Email Send Function ===
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: '"Project Platform" <bizy83724@gmail.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
};

// 1. Submit or Update Project
export const submitProject = async (req, res) => {
  const githubLink = sanitize(req.body.githubLink);
  const liveSiteUrl = sanitize(req.body.liveSiteUrl);
  const description = sanitize(req.body.description);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const projectId = req.params.projectId;

  // Check if at least one link is provided
  if (!githubLink && !liveSiteUrl) {
    return res.status(400).json({
      success: false,
      error: "At least one link (GitHub or Live Site) is required",
    });
  }

  if (!description) {
    return res.status(400).json({
      success: false,
      error: "Description is required",
    });
  }

  // Validate GitHub URL if provided
  if (githubLink) {
    const githubUrlRegex = /^https?:\/\/github\.com\/[^/]+\/[^/]+$/;
    if (!githubUrlRegex.test(githubLink)) {
      return res.status(400).json({
        success: false,
        error: "Invalid GitHub URL",
      });
    }
  }

  // Validate Live Site URL if provided
  if (liveSiteUrl) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(liveSiteUrl)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Live Site URL",
      });
    }
  }

  try {
    // Find project and populate the owner details
    const project = await PostProjectModel.findById(projectId).populate(
      "client",
      "name email"
    );
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Get submitter details
    const submitter = await UserModel.findById(userId, "name email");

    // Determine submission type
    let submissionType = "github_link";
    if (githubLink && liveSiteUrl) {
      submissionType = "both";
    } else if (liveSiteUrl && !githubLink) {
      submissionType = "live_site";
    }

    // Create/update submission
    const submission = await SubmitProjectModel.findOneAndUpdate(
      { user: userId, project: projectId },
      {
        submissionType,
        githubLink,
        liveSiteUrl,
        description,
        status: "submitted",
        submittedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // Prepare email content
    let linksSection = "";
    if (githubLink && liveSiteUrl) {
      linksSection = `
        <p><strong>GitHub Link:</strong> <a href="${githubLink}">${githubLink}</a></p>
        <p><strong>Live Site URL:</strong> <a href="${liveSiteUrl}">${liveSiteUrl}</a></p>
      `;
    } else if (githubLink) {
      linksSection = `<p><strong>GitHub Link:</strong> <a href="${githubLink}">${githubLink}</a></p>`;
    } else {
      linksSection = `<p><strong>Live Site URL:</strong> <a href="${liveSiteUrl}">${liveSiteUrl}</a></p>`;
    }

    // 1. Email to Project Owner (Client)
    const ownerEmailContent = `
      <h2>New Project Submission</h2>
      <p>Hello</p>
      <p>You have received a new submission for your project <strong>${project.title}</strong>.</p>
      <p><strong>Submitted by:</strong> ${submitter.name} (${submitter.email})</p>
      ${linksSection}
      <p><strong>Description:</strong> ${description}</p>
      <p>Please review the submission at your earliest convenience.</p>
      <p>Best regards,<br/>Your Project Team</p>
    `;

    await sendEmail(
      project.client.email,
      `New Submission for Project: ${project.title}`,
      ownerEmailContent
    );

    // 2. Email to Submitter (Freelancer)
    const submitterEmailContent = `
      <h2>Your Project Submission Received</h2>
      <p>Hello ${submitter.name},</p>
      <p>Your submission for project <strong>${project.title}</strong> has been successfully received.</p>
      <p><strong>Submission Details:</strong></p>
      <ul>
        ${githubLink ? `<li><strong>GitHub Link:</strong> <a href="${githubLink}">${githubLink}</a></li>` : ''}
        ${liveSiteUrl ? `<li><strong>Live Site URL:</strong> <a href="${liveSiteUrl}">${liveSiteUrl}</a></li>` : ''}
        <li><strong>Description:</strong> ${description}</li>
        <li><strong>Submitted At:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>The project owner has been notified and will review your submission shortly.</p>
      <p>Thank you for your work!<br/>The Project Team</p>
    `;

    await sendEmail(
      submitter.email,
      `Submission Confirmation: ${project.title}`,
      submitterEmailContent
    );

    return res.status(200).json({
      success: true,
      message: "Project submitted successfully and notifications sent",
      submission,
    });
  } catch (err) {
    console.error("❌ Submission Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to submit project",
    });
  }
};

// 2. Get Submission Details
export const getSubmissionDetails = async (req, res) => {
  try {
    const submission = await SubmitProjectModel.findOne({
      project: req.params.projectId,
      user: req.user.id,
    })
      .sort({ submittedAt: -1 })
      .populate("user", "name email")
      .populate("project", "title description");

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
        solution: "Submit your work for this project first",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error("❌ Fetch Submission Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch submission",
    });
  }
};

export const checkUserProjectSubmission = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    console.log("📌 Checking if any submission exists for project:");
    console.log("➡️ Project ID:", projectId);

    const submission = await SubmitProjectModel.findOne({
      project: projectId,
    })
      .sort({ submittedAt: -1 })
      .populate("user", "username name email rating completedProjects")
      .populate("project", "title description");

    if (!submission) {
      console.log("🚫 No submission found for this project.");
      return res.status(404).json({
        success: false,
        message: "No submission found for this project.",
      });
    }

    console.log("✅ Submission found:", submission._id);
    return res.status(200).json({
      success: true,
      message: "Submission found for this project.",
      submission,
    });
  } catch (err) {
    console.error("❌ Error checking submission:", err);
    return res.status(500).json({
      success: false,
      error: "Server error while checking project submission.",
    });
  }
};

// === Main Controller Function ===
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { status, rating, comment, experience } = req.body;
    const projectId = req.params.id;

    const submission = await SubmitProjectModel.findOne({ project: projectId })
      .populate("project")
      .populate("user");

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    const user = submission.user;
    const project = submission.project;

    // === REJECTED FLOW ===
    if (status === "rejected") {
      submission.status = "rejected";
      await submission.save();

      const rejectionHtml = `
        <h2>Project Submission Rejected</h2>
        <p>Hi ${user.name},</p>
        <p>Unfortunately, your submission for <strong>${project.title}</strong> has been <b>rejected</b>.</p>
        <p>Please review the requirements and try again.</p>
        <p>Thanks,<br/><strong>Project Platform Team</strong></p>
      `;

      await sendEmail(user.email, "Project Submission Rejected", rejectionHtml);

      return res.status(200).json({
        success: true,
        message: "Submission rejected and email sent",
        updatedSubmission: submission,
      });
    }

    // === APPROVED FLOW ===
    if (status === "approved") {
      if (!rating || !experience) {
        return res.status(400).json({
          success: false,
          message: "Rating and experience are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Rating must be between 1 and 5" });
      }

      if (!["positive", "neutral", "negative"].includes(experience)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid experience value" });
      }

      const session = await SubmitProjectModel.startSession();
      session.startTransaction();

      try {
        submission.review = {
          rating,
          comment: comment || "",
          experience,
          createdAt: new Date(),
        };
        submission.status = "approved";
        await submission.save({ session });

        project.status = "completed";
        await project.save({ session });

        const submittingUser = await UserModel.findById(user._id).session(
          session
        );
        if (submittingUser) {
          const newRating =
            (submittingUser.rating * submittingUser.completedProjects +
              rating) /
            (submittingUser.completedProjects + 1);

          submittingUser.rating = parseFloat(newRating.toFixed(2));
          submittingUser.completedProjects += 1;

          if (project.budget) {
            submittingUser.totalEarnings += project.budget;
            
            // Add earning log for project completion
            submittingUser.EarningLogs = submittingUser.EarningLogs || [];
            submittingUser.EarningLogs.push({
              amount: project.budget,
              date: new Date(),
            });
          }

          await submittingUser.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        const approvalHtml = `
          <h2>🎉 Congratulations! Your Project is Approved</h2>
          <p>Hi ${user.name},</p>
          <p>Your submission for <strong>${
            project.title
          }</strong> has been <b>approved</b>.</p>
          <p><strong>Project ID:</strong> ${project._id}</p>
          <p><strong>Budget:</strong> $${project.budget}</p>
          <p><strong>Your Rating:</strong> ${rating}/5</p>
          <p><strong>Review:</strong> ${comment || "No additional comments"}</p>
          <p><strong>Experience:</strong> ${experience}</p>
          <p>Your earnings have been added to your account.</p>
          <p>Keep up the great work!<br/><strong> BiZy Team</strong></p>
        `;

        await sendEmail(
          user.email,
          "Project Approved & Payment Received",
          approvalHtml
        );

        return res.status(200).json({
          success: true,
          message: "Submission approved and email sent",
          updatedSubmission: submission,
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }

    // === INVALID STATUS ===
    return res
      .status(400)
      .json({ success: false, message: "Invalid status update" });
  } catch (error) {
    console.error("❌ Error updating submission status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const checkUserApprovedSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find all approved submissions for this user
    const approvedSubmissions = await SubmitProjectModel.find({
      user: userId,
      status: "approved",
    })
      .populate({
        path: "project",
        select: "title description budget", // Include any project fields you need
        model: PostProjectModel,
      })
      .populate({
        path: "user",
        select: "name email", // Include any user fields you need
        model: UserModel,
      })
      .sort({ submittedAt: -1 }); // Sort by most recent first

    if (approvedSubmissions.length === 0) {
      return res.status(200).json({
        success: true,
        hasApprovedSubmissions: false,
        message: "User has no approved project submissions",
        approvedSubmissions: [],
      });
    }

    return res.status(200).json({
      success: true,
      hasApprovedSubmissions: true,
      message: "User has approved project submissions",
      count: approvedSubmissions.length,
      approvedSubmissions,
    });
  } catch (err) {
    console.error("❌ Error checking approved submissions:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to check approved submissions",
      details: err.message,
    });
  }
};

export const checkUserInProgressSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Find all in-progress (submitted) submissions for this user
    const inProgressSubmissions = await SubmitProjectModel.find({
      user: userId,
      status: "submitted",
    })
      .populate({
        path: "project",
        select: "title description budget",
        model: PostProjectModel,
      })
      .populate({
        path: "user",
        select: "name email",
        model: UserModel,
      })
      .sort({ submittedAt: -1 });
    return res.status(200).json({
      success: true,
      message: "User in-progress project submissions",
      count: inProgressSubmissions.length,
      inProgressSubmissions,
    });
  } catch (err) {
    console.error("❌ Error checking in-progress submissions:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to check in-progress submissions",
      details: err.message,
    });
  }
};

// Get Project Submission Details for Client
export const getProjectSubmissionForClient = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const clientId = req.user.id;

    // Find the project and verify it belongs to the client
    const project = await PostProjectModel.findOne({
      _id: projectId,
      client: clientId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to view it",
      });
    }

    // Find the submission for this project
    const submission = await SubmitProjectModel.findOne({ project: projectId })
      .populate("user", "username email rating completedProjects")
      .populate("project", "title description budget status");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "No submission found for this project",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error("❌ Error fetching project submission:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch project submission",
    });
  }
};

// Get All Submissions for a Project (for Client)
export const getAllProjectSubmissionsForClient = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const clientId = req.user.id;

    // Find the project and verify it belongs to the client
    const project = await PostProjectModel.findOne({
      _id: projectId,
      client: clientId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to view it",
      });
    }

    // Find all submissions for this project
    const submissions = await SubmitProjectModel.find({ project: projectId })
      .populate("user", "username email rating completedProjects")
      .populate("project", "title description budget status")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (err) {
    console.error("❌ Error fetching project submissions:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch project submissions",
    });
  }
};
