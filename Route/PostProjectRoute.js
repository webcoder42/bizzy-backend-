import express from "express";
import { requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  createJobPost,
  deleteJobPost,
  getAllJobPosts,
  getApplicantDetails,
  getApplicantsForMyProjects,
  getApplicantsForProject,
  getJobPostById,
  getLatestJobPosts,
  getMyJobPosts,
  getProjectDetailsWithVerification,
  searchJobPosts,
  updateApplicationStatus,
  updateJobPost,
  getAllProjectsWithApplicantsAdmin,
  deleteProjectAndApplicantsAdmin,
} from "../Controller.js/PostProjectController.js";
import { deleteApplicantProposalAdmin } from "../Controller.js/ProjectApplyController.js";
import { getProjectsByClient } from "../Controller.js/ClientProjectsController.js";

const router = express.Router();

// Create a new job post (protected route)
router.post("/create", requireSignIn, createJobPost);

// Get all job posts (public route)
router.get("/all", getAllJobPosts);

// Get job posts by logged-in user (protected route)
router.get("/my-jobs", requireSignIn, getMyJobPosts);

// Get latest job posts (public route)
router.get("/latest-jobs", getLatestJobPosts);

// Get single job post by ID (public route)
router.get("/:id", getJobPostById);

// Update job post (protected route - owner only)
router.put("/update/:id", requireSignIn, updateJobPost);

// Delete job post (protected route - owner only)
router.delete("/delete/:id", requireSignIn, deleteJobPost);

router.get(
  "/project-detail/:id",
  requireSignIn,
  getProjectDetailsWithVerification
);

// Search job posts with filters (public route)
router.get("/search/all", searchJobPosts);

router.get("/my-project-applicants", requireSignIn, getApplicantsForMyProjects);

// Get applicants for a specific project (new route)
router.get("/applicants/:projectId", requireSignIn, getApplicantsForProject);
router.put(
  "/update-application/:applicationId",
  requireSignIn,
  updateApplicationStatus
);

router.get("/applicant/:id", requireSignIn, getApplicantDetails);

router.get("/client-projects/:clientId", getProjectsByClient);

// ADMIN: Get all projects with applicants
router.get("/admin/all-projects", getAllProjectsWithApplicantsAdmin);

// ADMIN: Delete a project and all its applicants
router.delete("/admin/project/:id", deleteProjectAndApplicantsAdmin);

// ADMIN: Delete a specific applicant's proposal from a project
router.delete("/admin/project/:projectId/applicant/:applicantId", deleteApplicantProposalAdmin);

export default router;
