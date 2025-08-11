import SubmitProjectModel from "../Model/SubmitProjectModel.js";
import PostProjectModel from "../Model/PostProjectModel.js";
import UserModel from "../Model/UserModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "bizy83724@gmail.com",
    pass: process.env.EMAIL_PASS || "ddrd kpnn ptjb zxnt",
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: '"BiZy Freelancing" <bizy83724@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
};

const checkAndProcessSubmissions = async () => {
  try {
    const currentDate = new Date();
    
    const pendingSubmissions = await SubmitProjectModel.find({
      status: "submitted"
    }).populate("project").populate("user");

    for (const submission of pendingSubmissions) {
      const submissionDate = new Date(submission.submittedAt);
      const daysSinceSubmission = Math.floor((currentDate - submissionDate) / (1000 * 60 * 60 * 24));
      
      const project = submission.project;
      const freelancer = submission.user;
      
      if (!project || !freelancer) continue;

      const projectOwner = await UserModel.findById(project.client);
      if (!projectOwner) continue;

      if (daysSinceSubmission >= 3 && daysSinceSubmission < 10) {
        await sendReminderEmail(projectOwner, freelancer, project, submission);
      } else if (daysSinceSubmission >= 10) {
        await autoCompleteProject(submission, project, freelancer, projectOwner);
      }
    }
  } catch (error) {
    console.error("❌ Error in auto completion check:", error);
  }
};

const sendReminderEmail = async (projectOwner, freelancer, project, submission) => {
  const reminderHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">🔔 Project Review Reminder</h2>
      <p>Hello ${projectOwner.name},</p>
      <p>This is a friendly reminder that you have a pending project submission that requires your attention.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Project Details:</h3>
        <p><strong>Project Title:</strong> ${project.title}</p>
        <p><strong>Freelancer:</strong> ${freelancer.name}</p>
        <p><strong>Submitted On:</strong> ${new Date(submission.submittedAt).toLocaleDateString()}</p>
        <p><strong>Days Since Submission:</strong> ${Math.floor((new Date() - new Date(submission.submittedAt)) / (1000 * 60 * 60 * 24))} days</p>
      </div>
      
      <p>Please review the submitted work and provide feedback within the next 7 days. If no response is received within 10 days of submission, the project will be automatically completed.</p>
      
      <p>You can review the submission by logging into your BiZy account.</p>
      
      <p>Best regards,<br/><strong>BiZy Freelancing Team</strong></p>
    </div>
  `;

  await sendEmail(
    projectOwner.email,
    `Reminder: Review Pending for Project "${project.title}"`,
    reminderHtml
  );
};

const autoCompleteProject = async (submission, project, freelancer, projectOwner) => {
  try {
    const session = await SubmitProjectModel.startSession();
    session.startTransaction();

    try {
      submission.status = "approved";
      submission.review = {
        rating: 5,
        comment: "Project automatically completed due to no response from client within 10 days.",
        experience: "positive",
        createdAt: new Date(),
      };
      await submission.save({ session });

      project.status = "completed";
      await project.save({ session });

      const submittingUser = await UserModel.findById(freelancer._id).session(session);
      if (submittingUser) {
        const newRating = (submittingUser.rating * submittingUser.completedProjects + 5) / (submittingUser.completedProjects + 1);
        submittingUser.rating = parseFloat(newRating.toFixed(2));
        submittingUser.completedProjects += 1;
        
        if (project.budget) {
          submittingUser.totalEarnings += project.budget;
          
          // Add earning log for auto-completed project
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

      const autoCompletionHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Project Automatically Completed</h2>
          <p>Hello ${freelancer.name},</p>
          <p>Your project <strong>"${project.title}"</strong> has been automatically completed due to no response from the client within 10 days of submission.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #155724;">Project Details:</h3>
            <p><strong>Project Title:</strong> ${project.title}</p>
            <p><strong>Budget:</strong> $${project.budget}</p>
            <p><strong>Status:</strong> Automatically Approved</p>
            <p><strong>Rating:</strong> 5/5 (Auto-assigned)</p>
            <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Your earnings have been added to your account. This automatic completion ensures fair treatment for freelancers when clients are unresponsive.</p>
          
          <p>Keep up the great work!<br/><strong>BiZy Freelancing Team</strong></p>
        </div>
      `;

      await sendEmail(
        freelancer.email,
        `Project Automatically Completed: ${project.title}`,
        autoCompletionHtml
      );

      const clientNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">⚠️ Project Auto-Completed</h2>
          <p>Hello ${projectOwner.name},</p>
          <p>Your project <strong>"${project.title}"</strong> has been automatically completed due to no response from you within 10 days of the freelancer's submission.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Project Details:</h3>
            <p><strong>Project Title:</strong> ${project.title}</p>
            <p><strong>Freelancer:</strong> ${freelancer.name}</p>
            <p><strong>Budget:</strong> $${project.budget}</p>
            <p><strong>Status:</strong> Automatically Completed</p>
            <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>To avoid automatic completions in the future, please respond to project submissions within 10 days.</p>
          
          <p>Best regards,<br/><strong>BiZy Freelancing Team</strong></p>
        </div>
      `;

      await sendEmail(
        projectOwner.email,
        `Project Auto-Completed: ${project.title}`,
        clientNotificationHtml
      );

      console.log(`✅ Project ${project.title} automatically completed for freelancer ${freelancer.name}`);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("❌ Error in auto completion:", error);
  }
};

export { checkAndProcessSubmissions, sendReminderEmail, autoCompleteProject }; 