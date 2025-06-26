// authRoutes.js
import express from "express";
import {
  changeUserRole,
  checkUsernameAvailability,
  completeRegistration,
  deleteUserById,
  getAllUsers,
  getUserById,
  getUserCompleteDetails,
  getUserProfile,
  googleLogin,
  googleRegister,
  initiateLogin,
  resendLoginVerificationCode,
  sendRegistrationVerification,
  updatePassword,
  updateUserById,
  updateUserProfile,
  verifyLoginCode,
  verifyRegistrationEmail,
  getProfileCompletion,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "../Controller.js/UserController.js";
import { loginLimiter } from "./../middleware/rateLimiter.js";
import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";

const router = express.Router();

/* 
=============================================
REGISTRATION ROUTES
=============================================
*/

router.post("/register-send-verification", sendRegistrationVerification);
router.post("/register-verify-email", verifyRegistrationEmail);
router.post("/register-complete", completeRegistration);

/* 
=============================================
LOGIN ROUTES
=============================================
*/
router.post("/login-initiate", initiateLogin);
router.post("/login-verify-code", loginLimiter, verifyLoginCode);
router.post("/login-resend-code", resendLoginVerificationCode);

/* 
=============================================
GOOGLE AUTH ROUTE
=============================================
*/
router.post("/google/register", googleRegister);
router.post("/google/login", googleLogin);

/* 
=============================================
UTILITY ROUTES
=========================================s====
*/
router.get("/check-username", checkUsernameAvailability);

/* 
=============================================
PROTECTED ROUTES
=============================================
*/
// Protected user route
router.get("/auth-user", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// Protected admin route
router.get("/auth-admin", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});
/* 
=============================================
User Profile Route
=============================================
*/

router.get("/profile", requireSignIn, getUserProfile);
router.get("/profile-completion", requireSignIn, getProfileCompletion);
router.put("/profile", requireSignIn, updateUserProfile);
router.put("/password", requireSignIn, updatePassword);
router.put("/role", requireSignIn, changeUserRole);

// GET all users (admin only)
router.get("/get-all", requireSignIn, isAdmin, getAllUsers);

// GET single user
router.get("/get-single:id", requireSignIn, isAdmin, getUserById);

// UPDATE user
router.put("/update/:id", requireSignIn, isAdmin, updateUserById);

// DELETE user
router.delete("/delete/:id", requireSignIn, isAdmin, deleteUserById);

router.get("/user/details/:id", getUserCompleteDetails);

/* 
=============================================
FORGOT PASSWORD ROUTES
=============================================
*/
router.post("/forgot-password/request", requestPasswordReset);
router.get("/forgot-password/verify", verifyResetToken);
router.post("/forgot-password/reset", resetPassword);

export default router;
