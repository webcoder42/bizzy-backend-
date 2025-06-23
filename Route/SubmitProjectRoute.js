import express from "express";

import { requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  checkUserProjectSubmission,
  getSubmissionDetails,
  submitProject,
  updateSubmissionStatus,
  getProjectSubmissionForClient,
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

export default router;
