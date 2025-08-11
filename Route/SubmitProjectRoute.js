import express from "express";

import { requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  checkUserProjectSubmission,
  getSubmissionDetails,
  submitProject,
  updateSubmissionStatus,
  getProjectSubmissionForClient,
  getAllProjectSubmissionsForClient,
  checkUserApprovedSubmissions,
  checkUserInProgressSubmissions,
} from "../Controller.js/SubmitProjectController.js";

const router = express.Router();

// Project Submission Routes
router.post("/projects/:projectId", requireSignIn, submitProject);
router.get("/projects/:projectId", requireSignIn, getSubmissionDetails);

router.get(
  "/project-submission/:projectId",
  requireSignIn,
  checkUserProjectSubmission
);

router.put("/project-update/:id", requireSignIn, updateSubmissionStatus);

// New route for client to view project submission
router.get("/client/submission/:projectId", requireSignIn, getProjectSubmissionForClient);

// Route to get all submissions for a project (for client)
router.get("/project/:projectId", requireSignIn, getAllProjectSubmissionsForClient);

// Route to get all approved submissions for a user
router.get("/approved/:userId", checkUserApprovedSubmissions);

// Route to get all in-progress submissions for a user
router.get("/inprogress/:userId", checkUserInProgressSubmissions);

export default router;
