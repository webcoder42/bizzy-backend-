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
} from "../Controller.js/PostProjectController.js";
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

export default router;
