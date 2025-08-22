import express from 'express';
import {
  createProject,
  getAllProjects,
  getAllProjectsForAdmin,
  getProject,
  getUserProjects,
  getProjectForEdit,
  updateProject,
  deleteProject,
  deleteProjectByAdmin,
  toggleLike,
  toggleSave,
  getUserLikes,
  getUserSaves,
  addInquiry,
  getFeaturedProjects,
  getProjectsByCategory,
  getTrendingProjects,
  incrementView,
  getSellerRating,
  getProjectRating
} from '../Controller.js/ProjectSellController.js';
import { requireSignIn, isAdmin } from '../middleware/UserMiddleware.js';


const router = express.Router();

// Public routes
router.get('/projects', getAllProjects);
router.get('/projects/featured', getFeaturedProjects);
router.get('/projects/trending', getTrendingProjects);
router.get('/projects/category/:category', getProjectsByCategory);
router.get('/projects/:id', getProject);

// Protected routes (require authentication)
router.use(requireSignIn);

// Get project for editing (specific route with authentication)
router.get('/edit-projects/:id', getProjectForEdit);

// Create new project (Base64 images)
router.post('/projects', createProject);

// Get user's own projects
router.get('/my-projects', getUserProjects);

// Update project (Base64 images)
router.put('/projects/:id', updateProject);

// Delete project
router.delete('/projects/:id', deleteProject);

// Like/Unlike project
router.post('/projects/:id/like', toggleLike);

// Save/Unsave project
router.post('/projects/:id/save', toggleSave);

// Increment project view
router.post('/projects/:id/view', incrementView);

// Get user's liked projects
router.get('/user-likes', getUserLikes);

// Get user's saved projects
router.get('/user-saves', getUserSaves);

// Get seller's average rating
router.get('/seller-rating/:sellerId', getSellerRating);

// Get project's individual rating
router.get('/project-rating/:projectId', getProjectRating);



// Add inquiry to project
router.post('/projects/:id/inquiry', addInquiry);

// Admin routes
console.log('Registering ProjectSell admin routes...');
console.log('Admin projects route: /admin/projects');
console.log('Admin delete route: /admin/projects/:id');
router.get('/admin/projects', requireSignIn, isAdmin, getAllProjectsForAdmin);
router.delete('/admin/projects/:id', requireSignIn, isAdmin, deleteProjectByAdmin);

export default router;
