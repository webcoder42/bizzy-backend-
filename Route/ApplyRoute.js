// routes/projectApplyRoutes.js
import express from "express";
import { requireSignIn } from "../middleware/UserMiddleware.js";

import {
  applyToProject,
  checkHiredApplications,
  getApplicantsCountForProjects,
  getApplicantsDetailsByProject,
  getAppliedProjects,
  getProjectDetails,
  checkIfUserApplied,
} from "../Controller.js/ProjectApplyController.js";
import upload from "../middleware/Upload.js";

const router = express.Router();

// Check if user has already applied to a project
router.get("/check-application/:projectId", requireSignIn, checkIfUserApplied);

router.post(
  "/apply",
  requireSignIn,
  upload.single("cvFile"), // 'cvFile' should match the field name in your form
  applyToProject
);

router.get("/applied-projects", requireSignIn, getAppliedProjects);

router.get("/:id", requireSignIn, getProjectDetails);

// Check hired applications
router.get("/applications/hired", requireSignIn, checkHiredApplications);

router.get(
  "/projects/applicants-count",
  requireSignIn,
  getApplicantsCountForProjects
);
router.get(
  "/applicants-details/:projectId",
  requireSignIn,
  getApplicantsDetailsByProject
);

export default router;
