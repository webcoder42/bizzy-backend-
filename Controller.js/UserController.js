// authController.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import UserModel from "../Model/UserModel.js";
import sanitize from "mongo-sanitize";
import { v4 as uuidv4 } from "uuid";
/* 
=============================================
REGISTRATION-SPECIFIC UTILITIES AND STORAGE
=============================================
*/
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
// Helper functions

// Storage for registration verification data
const registrationVerificationStore = new Map();

// Generate registration verification code (6 digits)
const generateRegistrationVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send registration verification email
const sendRegistrationVerificationEmail = async (toEmail, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Verify your registration" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your registration verification code",
    html: `
      <div style="font-family:sans-serif;">
        <h2>Verify your email to complete registration</h2>
        <p>Use the following code to complete the process:</p>
        <h3 style="color:blue;">${code}</h3>
        <p>This code will expire in 15 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/* 
=============================================
LOGIN-SPECIFIC UTILITIES AND STORAGE
=============================================
*/

// Storage for login verification data
const loginVerificationStore = new Map();

// Generate login verification code (6 digits)
const generateLoginVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send login verification email
const sendLoginVerificationEmail = async (toEmail, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Verify your login" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your login verification code",
    html: `
      <div style="font-family:sans-serif;">
        <h2>Verify your email to complete login</h2>
        <p>Use the following code to complete the process:</p>
        <h3 style="color:blue;">${code}</h3>
        <p>This code will expire in 3 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/* 
=============================================
SHARED UTILITIES
=============================================
*/

// Helper function to generate a referral code
const generateReferralCode = () => {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
};

// Helper function to generate referral link
const generateReferralLink = (referralCode) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/register?referralCode=${referralCode}`;
};

// Hash password helper
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password helper
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/* 
=============================================
REGISTRATION CONTROLLERS
=============================================
*/

// Send registration verification code
export const sendRegistrationVerification = async (req, res) => {
  try {
    const {
      Fullname,
      username,
      email: rawEmail,
      password,
      country,
      phone,
      bio,
      role,
      UserType,
      referralCode,
    } = req.body;
    const email = sanitize(rawEmail);

    // Validation
    if (
      !Fullname ||
      !username ||
      !email ||
      !password ||
      !country ||
      !phone ||
      !role ||
      !UserType
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate UserType
    if (!["freelancer", "client"].includes(UserType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UserType (must be 'freelancer' or 'client')",
      });
    }

    // Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role (must be 'user' or 'admin')",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      });
    }

    // Only check for existing device if deviceId is provided and not empty
    if (req.body.deviceId) {
      const existingDevice = await UserModel.findOne({
        deviceId: req.body.deviceId,
      });
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          message: "A user is already registered from this device",
        });
      }
    }

    // Generate and store verification code
    const verificationCode = generateRegistrationVerificationCode();
    const hashedPassword = await hashPassword(password);

    registrationVerificationStore.set(email, {
      Fullname,
      username,
      email,
      password: hashedPassword,
      country,
      phone,
      bio: bio || "",
      role,
      UserType,
      referralCode,
      verificationCode,
      isVerified: false,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      deviceId: req.body.deviceId,
    });

    // Send verification email
    await sendRegistrationVerificationEmail(email, verificationCode);

    return res.status(200).json({
      success: true,
      message: "Registration verification code sent to your email",
    });
  } catch (error) {
    console.error("Registration verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Verify registration email
export const verifyRegistrationEmail = async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const code = req.body.code;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const userData = registrationVerificationStore.get(email);

    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification request",
      });
    }

    if (userData.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (userData.expiresAt < Date.now()) {
      registrationVerificationStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Mark as verified
    userData.isVerified = true;
    registrationVerificationStore.set(email, userData);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Registration verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Complete registration
export const completeRegistration = async (req, res) => {
  try {
    const email = sanitize(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userData = registrationVerificationStore.get(email);

    if (!userData || !userData.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // Double check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      registrationVerificationStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // Handle referral
    let referredByUser = null;
    if (userData.referralCode) {
      referredByUser = await UserModel.findOne({
        referralCode: userData.referralCode,
      });
    }

    // Create new user
    const referralCode = generateReferralCode();
    const newUser = new UserModel({
      Fullname: userData.Fullname,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      country: userData.country,
      phone: userData.phone,
      bio: userData.bio,
      role: userData.role,
      UserType: userData.UserType,
      isVerified: true,
      referralCode,
      referralLink: generateReferralLink(referralCode),
      referredBy: referredByUser?._id || null,
      profileImage: "",
      accountStatus: "active",
      deviceId: userData.deviceId,
    });

    await newUser.save();

    // Update referrer if exists
    if (referredByUser) {
      referredByUser.totalReferred += 1;
      await referredByUser.save();
    }

    // Clean up
    registrationVerificationStore.delete(email);

    // Generate JWT token
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, UserType: user.UserType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true, // JS access blocked
      secure: true, // only HTTPS
      sameSite: "Strict", // prevent CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare response
    const userResponse = {
      _id: newUser._id,
      Fullname: newUser.Fullname,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      UserType: newUser.UserType,
      profileImage: newUser.profileImage,
      isVerified: newUser.isVerified,
      referralCode: newUser.referralCode,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* 
=============================================
LOGIN CONTROLLERS
=============================================
*/

// Initiate login (send verification code)
export const initiateLogin = async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact support.`,
      });
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate and store login verification code
    const verificationCode = generateLoginVerificationCode();
    loginVerificationStore.set(user.email, {
      userId: user._id,
      verificationCode,
      expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes
      isVerified: false,
    });

    // Send verification email
    await sendLoginVerificationEmail(user.email, verificationCode);

    return res.status(200).json({
      success: true,
      message: "Login verification code sent to your email",
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Verify login code
export const verifyLoginCode = async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const code = req.body.code;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const loginData = loginVerificationStore.get(email);

    if (!loginData) {
      return res.status(400).json({
        success: false,
        message: "No login attempt found or session expired",
      });
    }

    if (loginData.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (loginData.expiresAt < Date.now()) {
      loginVerificationStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Get user
    const user = await UserModel.findById(loginData.userId);
    if (!user) {
      loginVerificationStore.delete(email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Mark as verified
    loginData.isVerified = true;
    loginVerificationStore.set(email, loginData);

    // Update last login and set user as online
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.availability = "online";
    await user.save();

    // Generate JWT token
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, UserType: user.UserType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true, // JS access blocked
      secure: true, // only HTTPS
      sameSite: "Strict", // prevent CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare response
    const userResponse = {
      _id: user._id,
      Fullname: user.Fullname,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      UserType: user.UserType,
      isVerified: user.isVerified,
    };

    // Clean up
    loginVerificationStore.delete(email);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Resend login verification code
export const resendLoginVerificationCode = async (req, res) => {
  try {
    const email = sanitize(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const loginData = loginVerificationStore.get(email);

    if (!loginData) {
      return res.status(400).json({
        success: false,
        message: "No login attempt found for this email",
      });
    }

    // Generate new code
    const newVerificationCode = generateLoginVerificationCode();
    loginVerificationStore.set(email, {
      ...loginData,
      verificationCode: newVerificationCode,
      expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes
    });

    // Send new verification email
    await sendLoginVerificationEmail(email, newVerificationCode);

    return res.status(200).json({
      success: true,
      message: "New login verification code sent to your email",
    });
  } catch (error) {
    console.error("Resend login verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* 
=============================================
GOOGLE AUTH CONTROLLERS
=============================================
*/

// Google Registration Controller
export const googleRegister = async (req, res) => {
  const {
    token,
    role = "user",
    UserType = "freelancer",
    referredBy,
    deviceId,
  } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Validate payload
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token payload",
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login instead.",
      });
    }
    if (deviceId) {
      const existingDevice = await UserModel.findOne({
        deviceId: deviceId,
      });
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          message: "A user is already registered from this device",
        });
      }
    }
    // Create new user
    const referralCode = generateReferralCode();
    const newUser = new UserModel({
      Fullname: name || email.split("@")[0],
      email,
      username: email.split("@")[0] + Math.floor(Math.random() * 1000),
      googleId,
      profileImage: picture || "",
      referralCode,
      referralLink: generateReferralLink(referralCode),
      referredBy: referredBy || null,
      role,
      UserType,
      isVerified: true,
      deviceId: deviceId,
    });

    await newUser.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: newUser._id, role: newUser.role, UserType: newUser.UserType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare response
    const userResponse = {
      _id: newUser._id,
      Fullname: newUser.Fullname,
      email: newUser.email,
      username: newUser.username,
      profileImage: newUser.profileImage,
      role: newUser.role,
      UserType: newUser.UserType,
      isVerified: newUser.isVerified,
    };

    return res.status(201).json({
      success: true,
      message: "Google registration successful",
      token: jwtToken,
      user: userResponse,
    });
  } catch (error) {
    console.error("Google registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Google registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Google Login Controller
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token payload",
      });
    }

    const { email } = payload;

    // Find user
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found. Please register first.",
      });
    }

    // Check if account was created with Google
    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message:
          "Account was not created with Google. Please use email/password login.",
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact support.`,
      });
    }

    // Update last login and set user as online
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.availability = "online";
    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, UserType: user.UserType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare response
    const userResponse = {
      _id: user._id,
      Fullname: user.Fullname,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      UserType: user.UserType,
      isVerified: user.isVerified,
    };

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Google login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* 
=============================================
UTILITY CONTROLLERS
=============================================
*/

// Check username availability
export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const existingUser = await UserModel.findOne({ username });

    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
    });
  } catch (error) {
    console.error("Username check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* 
=============================================
USER PROFILE CONTROLLERS
=============================================
*/

export const getUserProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated request (JWT token)
    const userId = req.user.id;

    // Find the user and exclude sensitive fields
    const user = await UserModel.findById(userId)
      .select("-password -googleId -loginHistory")
      .populate("referredBy", "username email profileImage");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare the response data
    const userData = {
      _id: user._id,
      Fullname: user.Fullname,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      UserType: user.UserType,
      bio: user.bio,
      skills: user.skills,
      location: user.location,
      socialLinks: user.socialLinks,
      portfolio: user.portfolio,
      phone: user.phone,
      accountStatus: user.accountStatus,
      rating: user.rating,
      reviewCount: user.reviewCount,
      completedProjects: user.completedProjects,
      totalEarnings: user.totalEarnings,
      totalSpend: user.totalSpend,
      availability: user.availability,
      responseTimeRating: user.responseTimeRating,
      referralCode: user.referralCode,
      referralLink: user.referralLink,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Debug log for portfolio
    if (updates.portfolio) {
      console.log('Received portfolio for update:', JSON.stringify(updates.portfolio, null, 2));
    }

    // Remove restricted fields
    delete updates.password;
    delete updates.role;
    delete updates.accountStatus;
    delete updates.referralCode;
    delete updates.referredBy;
    delete updates.googleId;

    // Ensure portfolio is an array
    if (updates.portfolio && !Array.isArray(updates.portfolio)) {
      updates.portfolio = [];
    }

    // Validate portfolio items
    if (updates.portfolio) {
      updates.portfolio = updates.portfolio.map((item) => ({
        title: item.title || "",
        description: item.description || "",
        link: item.link || "",
        image: item.image || "",
      }));
    }

    const user = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -googleId -loginHistory");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    const user = await UserModel.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Change user role (admin/user)
export const changeUserRole = async (req, res) => {
  try {
    const userId = req.user?.id; // null check added

    const { newRole } = req.body;

    // Validate new role
    if (!newRole || !["freelancer", "client"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid new role is required (only 'freelancer' or 'client' allowed)",
      });
    }

    // Get the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if role is actually changing
    if (user.UserType === newRole) {
      return res.status(400).json({
        success: false,
        message: "User already has this role",
      });
    }

    // Update the role
    user.UserType = newRole;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role changed successfully. Please login again.",
      requiresRelogin: true,
    });
  } catch (error) {
    console.error("Role change error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only admins can access all users",
      });
    }

    // Get query parameters for filtering/pagination
    const { page = 1, limit = 20, role, UserType, search } = req.query;

    // Build query object
    const query = {};

    if (role) query.role = role;
    if (UserType) query.UserType = UserType;

    if (search) {
      query.$or = [
        { Fullname: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const users = await UserModel.find(query)
      .select("-password -googleId -loginHistory")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Calculate total add fund for each user
    const usersWithAddFund = users.map(user => {
      let totalAddFund = 0;
      if (user.addFundLogs && user.addFundLogs.length > 0) {
        totalAddFund = user.addFundLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
      }
      // Convert to plain object and add totalAddFund
      const userObj = user.toObject();
      userObj.totalAddFund = totalAddFund;
      return userObj;
    });

    // Get total count for pagination info
    const count = await UserModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: usersWithAddFund,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user and exclude sensitive fields
    const user = await UserModel.findById(id)
      .select("-password -googleId -loginHistory")
      .populate("referredBy", "username email profileImage");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If not admin, only allow viewing your own profile
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view your own profile",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update user by ID
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove restricted fields
    delete updates.password;
    delete updates.role;
    delete updates.googleId;
    delete updates.referralCode;
    delete updates.referredBy;

    // Find user
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check permissions (admin or own profile)
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only update your own profile",
      });
    }

    // Special handling for admin-only fields
    if ("accountStatus" in updates && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only admins can update account status",
      });
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -googleId -loginHistory");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete user by ID
export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions (only admin or self)
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own account",
      });
    }

    // Find and delete user
    const user = await UserModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get complete user details by ID
export const getUserCompleteDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user and populate all necessary fields
    const user = await UserModel.findById(id)
      .select("-password -googleId") // Exclude sensitive fields
      .populate("referredBy", "username email profileImage")
      .populate("skills", "name level")
      .populate("portfolio", "title description link")
      .populate("socialLinks", "platform url")
      .populate("completedProjects", "title description amount rating");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare the complete user data response
    const userData = {
      _id: user._id,
      Fullname: user.Fullname,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      UserType: user.UserType,
      bio: user.bio,
      skills: user.skills,
      location: user.location,
      country: user.country,
      phone: user.phone,
      socialLinks: user.socialLinks,
      portfolio: user.portfolio,
      rating: user.rating,
      completedProjects: user.completedProjects,
      totalEarnings: user.totalEarnings,
      totalSpend: user.totalSpend,
      availability: user.availability,
      responseTimeRating: user.responseTimeRating,
      referralCode: user.referralCode,
      referralLink: user.referralLink,
      referredBy: user.referredBy,
      totalReferred: user.totalReferred,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      // Add any other fields you want to include
    };

    return res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Get user complete details error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user profile completion percentage
export const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Define fields to check and their weights
    const fieldsToCheck = {
      Fullname: 10,
      username: 10,
      email: 10,
      profileImage: 10,
      bio: 10,
      skills: 10,
      location: 20,

      socialLinks: 10,
      portfolio: 10,
    };

    let completionPercentage = 0;
    let missingFields = [];

    // Calculate completion percentage
    Object.entries(fieldsToCheck).forEach(([field, weight]) => {
      switch (field) {
        case "skills":
          if (user.skills && user.skills.length > 0) {
            completionPercentage += weight;
          } else {
            missingFields.push("Skills");
          }
          break;
        case "socialLinks":
          if (
            user.socialLinks &&
            Object.values(user.socialLinks).some((link) => link)
          ) {
            completionPercentage += weight;
          } else {
            missingFields.push("Social Links");
          }
          break;
        case "portfolio":
          if (user.portfolio && user.portfolio.length > 0) {
            completionPercentage += weight;
          } else {
            missingFields.push("Portfolio");
          }
          break;
        case "location":
          if (user.location && user.location.country) {
            completionPercentage += weight;
          } else {
            missingFields.push("Location");
          }
          break;
        case "phone":
          if (user.phone && user.phone.number) {
            completionPercentage += weight;
          } else {
            missingFields.push("Phone Number");
          }
          break;
        default:
          if (user[field] && user[field].toString().trim() !== "") {
            completionPercentage += weight;
          } else {
            missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
          }
      }
    });

    return res.status(200).json({
      success: true,
      completionPercentage,
      missingFields,
      message:
        completionPercentage === 100
          ? "Congratulations! Your profile is complete!"
          : `Your profile is ${completionPercentage}% complete. Fill in the missing fields to reach 100%`,
    });
  } catch (error) {
    console.error("Profile completion check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* 
=============================================
FORGOT PASSWORD CONTROLLERS
=============================================
*/

// 1. Request password reset (send email with link)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No user found with this email" });
    }
    // Generate token and expiry
    const resetToken = uuidv4();
    const resetExpires = Date.now() + 1000 * 60 * 15; // 15 min
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    // Send email
    const resetUrl = `${API_FRONTENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;
    // Use hardcoded credentials for testing
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "bizy83724@gmail.com",
        pass: "ddrd kpnn ptjb zxnt",
      },
    });
    const mailOptions = {
      from: '"Password Reset" <bizy83724@gmail.com>',
      to: email,
      subject: "Reset your password",
      html: `<div style="font-family:sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
        <a href="${resetUrl}" style="color:blue;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      </div>`,
    };
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 2. Verify reset token (for frontend to check before showing reset form)
export const verifyResetToken = async (req, res) => {
  try {
    const { email, token } = req.query;
    if (!email || !token) {
      return res
        .status(400)
        .json({ success: false, message: "Email and token are required" });
    }
    const user = await UserModel.findOne({ email, resetPasswordToken: token });
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }
    return res.status(200).json({ success: true, message: "Token valid" });
  } catch (error) {
    console.error("Verify reset token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 3. Reset password (set new password)
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, token, and new password are required",
      });
    }
    const user = await UserModel.findOne({ email, resetPasswordToken: token });
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user projects and details
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user details
    const user = await UserModel.findById(userId).select(
      "Fullname username email profileImage rating completedProjects totalEarnings totalSpend createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's projects (both completed and in-progress)
    const PostProjectModel = (await import("../Model/PostProjectModel.js"))
      .default;
    const ProjectApplyModel = (await import("../Model/ProjectApplyModel.js"))
      .default;

    // Get projects where user is the client
    const clientProjects = await PostProjectModel.find({
      client: userId,
      status: { $in: ["completed", "In-progress"] },
    })
      .select(
        "title description budget status createdAt category skillsRequired"
      )
      .lean();

    // Get projects where user is the freelancer (hired or completed)
    const freelancerApplications = await ProjectApplyModel.find({
      user: userId,
      status: { $in: ["hired", "completed"] },
    }).select("project rating feedback status");

    const freelancerProjectIds = freelancerApplications.map(
      (app) => app.project
    );

    // Map projectId to application for quick lookup
    const appMap = {};
    for (const app of freelancerApplications) {
      if (app.project) appMap[app.project.toString()] = app;
    }

    let freelancerProjects = await PostProjectModel.find({
      _id: { $in: freelancerProjectIds },
    })
      .select(
        "title description budget status createdAt category skillsRequired"
      )
      .lean();

    // Attach rating/feedback if project is completed and rating exists
    freelancerProjects = freelancerProjects.map((proj) => {
      const app = appMap[proj._id.toString()];
      if (
        proj.status === "completed" &&
        app &&
        (app.rating || app.feedback)
      ) {
        return {
          ...proj,
          freelancerRating: app.rating,
          freelancerFeedback: app.feedback,
        };
      }
      return proj;
    });

    // Combine and sort all projects
    const projects = [...clientProjects, ...freelancerProjects].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Add full URL to profile image if it exists
    if (user.profileImage && !user.profileImage.startsWith("http")) {
      user.profileImage = `${process.env.BASE_URL || "http://localhost:8080"}${
        user.profileImage
      }`;
    }

    res.status(200).json({
      success: true,
      message: "User projects retrieved successfully",
      data: {
        user,
        projects,
        totalProjects: projects.length,
        completedProjects: projects.filter((p) => p.status === "completed")
          .length,
        inProgressProjects: projects.filter((p) => p.status === "In-progress")
          .length,
      },
    });
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get total add fund amount (for admin dashboard)
export const getTotalAddFundAmount = async (req, res) => {
  try {
    // Only admin can access
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized: Only admins can access total add fund amount" });
    }
    // Aggregate sum of all addFundLogs.amount for all users
    const users = await UserModel.find({}, "addFundLogs");
    let totalAddFund = 0;
    users.forEach(user => {
      if (user.addFundLogs && user.addFundLogs.length > 0) {
        user.addFundLogs.forEach(log => {
          totalAddFund += log.amount || 0;
        });
      }
    });
    return res.status(200).json({ success: true, totalAddFund });
  } catch (error) {
    console.error("Error getting total add fund amount:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Get monthly add fund amounts for the current year (for admin dashboard)
export const getMonthlyAddFundAmounts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized: Only admins can access monthly add fund data" });
    }
    const year = new Date().getFullYear();
    // Unwind addFundLogs and group by month
    const result = await UserModel.aggregate([
      { $unwind: "$addFundLogs" },
      {
        $match: {
          "addFundLogs.date": {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$addFundLogs.date" },
          totalAmount: { $sum: "$addFundLogs.amount" }
        }
      }
    ]);
    // Format result as array of 12 months
    const monthly = Array(12).fill(0);
    result.forEach(r => {
      monthly[r._id - 1] = r.totalAmount;
    });
    return res.status(200).json({ success: true, monthly });
  } catch (error) {
    console.error("Error getting monthly add fund amounts:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Get user earning logs
export const getUserEarningLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await UserModel.findById(userId).select("EarningLogs totalEarnings");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Sort earning logs by date (newest first)
    const sortedEarningLogs = user.EarningLogs ? 
      user.EarningLogs.sort((a, b) => new Date(b.date) - new Date(a.date)) : 
      [];

    return res.status(200).json({
      success: true,
      message: "Earning logs retrieved successfully",
      data: {
        totalEarnings: user.totalEarnings || 0,
        earningLogs: sortedEarningLogs,
        totalLogs: sortedEarningLogs.length
      }
    });
  } catch (error) {
    console.error("Error getting user earning logs:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
