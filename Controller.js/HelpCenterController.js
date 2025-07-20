import HelpCenterModel from "../Model/HelpCenterModel.js";

import nodemailer from "nodemailer";
import UserModel from "../Model/UserModel.js";
import sanitize from "mongo-sanitize";

// Submit new complaint
export const submitComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const issueType = sanitize(req.body.issueType);
    const description = sanitize(req.body.description);
    const image = req.body.image || null; // Accept base64 string directly

    // Validation
    if (!issueType || !description) {
      return res
        .status(400)
        .json({ message: "Issue type & description are required." });
    }

    // ✅ Check if user already submitted a complaint within last 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const existingComplaint = await HelpCenterModel.findOne({
      user: userId,
      createdAt: { $gte: oneMonthAgo },
    });

    if (existingComplaint) {
      return res.status(400).json({
        message:
          "You have already submitted a complaint within the last 30 days. Please wait before submitting another one.",
      });
    }

    // ✅ Create complaint
    const newComplaint = await HelpCenterModel.create({
      user: userId,
      issueType,
      description,
      image, // Store base64 string
    });

    // ✅ Fetch user
    const user = await UserModel.findById(userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: "User email not found." });
    }

    // ✅ Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Your Complaint has been Received - Ticket ${newComplaint.ticketNumber}`,
      html: `
        <h3>Dear ${user.username || "User"},</h3>
        <p>Thank you for contacting our support.</p>
        <p>Your complaint has been received and assigned Ticket Number: <strong>${
          newComplaint.ticketNumber
        }</strong></p>
        <p><strong>Issue Type:</strong> ${newComplaint.issueType}</p>
        <p>We will review your complaint and respond to you as soon as possible.</p>
        <br/>
        <p>Best Regards,<br/>Support Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Complaint submitted successfully. Email sent.",
      ticket: newComplaint,
    });
  } catch (error) {
    console.error("Submit Complaint Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Add this to your HelpCenterController.js

// Get user's complaints
export const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const complaints = await HelpCenterModel.find({ user: userId }).sort({
      createdAt: -1,
    }); // Newest first

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error("Get Complaints Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
// Get all complaints for admin
export const getAllComplaints = async (req, res) => {
  try {
    // Get all complaints with user details
    const complaints = await HelpCenterModel.find()
      .populate("user", "username email") // populate user info
      .sort({ createdAt: -1 }); // newest first

    // Count pending complaints
    const pendingCount = await HelpCenterModel.countDocuments({
      status: "pending",
    });

    return res.status(200).json({
      total: complaints.length,
      pending: pendingCount,
      complaints,
    });
  } catch (error) {
    console.error("Admin Get All Complaints Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Update complaint status by Admin
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["pending", "in progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    // Find and update complaint
    const updatedComplaint = await HelpCenterModel.findByIdAndUpdate(
      complaintId,
      { status },
      { new: true }
    ).populate("user", "username email");

    if (!updatedComplaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    return res.status(200).json({
      message: "Complaint status updated successfully.",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Update Complaint Status Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
