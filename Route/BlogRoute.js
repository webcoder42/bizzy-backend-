import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
} from "../Controller.js/BlogController.js";
import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";
import uploadImage from "../middleware/uploadimage.js";

const router = express.Router();

// Public routes
router.get("/all", getAllBlogs);
router.get("/get/:id", getBlogById);

// Admin only routes
router.post("/create", requireSignIn, isAdmin, createBlog);
router.put("/update/:id", requireSignIn, isAdmin, updateBlog);
router.delete("/delete/:id", requireSignIn, isAdmin, deleteBlog);
router.post(
  "/upload-image",
  requireSignIn,
  isAdmin,
  uploadImage.single("image"),
  uploadBlogImage
);

export default router;
