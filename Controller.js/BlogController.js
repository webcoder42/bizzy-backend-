import BlogModel from "../Model/BlogModel.js";
import uploadImage from "../middleware/uploadimage.js";
import sanitize from "mongo-sanitize";

// 🟢 Get All Blogs (Public)
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogModel.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({ error: "Server error while fetching blogs." });
  }
};

// 🟢 Get Single Blog (Public)
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: "Invalid blog ID format." });
    }

    const blog = await BlogModel.findById(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Get blog error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid blog ID format." });
    }
    res.status(500).json({ error: "Server error while fetching blog." });
  }
};

// 🟢 Create Blog (Admin only)
export const createBlog = async (req, res) => {
  try {
    const {
      image, // Thumbnail image URL
    } = req.body;
    const title = sanitize(req.body.title);
    const tags = Array.isArray(req.body.tags) ? req.body.tags.map(tag => sanitize(tag)) : [];
    const layoutType = sanitize(req.body.layoutType);
    const content = Array.isArray(req.body.content) ? req.body.content.map(block => ({
      type: sanitize(block.type),
      value: sanitize(block.value)
    })) : [];

    // ✅ Validation (Enhanced)
    if (!title || title.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty." });
    }

    if (!content || !Array.isArray(content) || content.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one content block is required." });
    }

    // Validate each content block
    for (let i = 0; i < content.length; i++) {
      const block = content[i];
      if (!block.type || !block.value || block.value.trim().length === 0) {
        return res.status(400).json({
          error: `Content block ${
            i + 1
          } is invalid. Type and value are required.`,
        });
      }

      // Validate block type
      const validTypes = ["paragraph", "heading", "image", "quote"];
      if (!validTypes.includes(block.type)) {
        return res.status(400).json({
          error: `Invalid content block type: ${
            block.type
          }. Valid types are: ${validTypes.join(", ")}`,
        });
      }
    }

    // ✅ Check if blog with same title already exists
    const existing = await BlogModel.findOne({ title: title.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ error: "A blog with this title already exists." });
    }

    // ✅ Create New Blog
    const blog = new BlogModel({
      title: title.trim(),
      image: image || "",
      tags: tags.filter((tag) => tag.trim().length > 0),
      layoutType: layoutType || "standard",
      content: content.map((block) => ({
        type: block.type,
        value: block.value.trim(),
      })),
    });

    await blog.save();

    res.status(201).json({
      message: "Blog created successfully!",
      blog,
    });
  } catch (error) {
    console.error("Blog create error:", error);
    res.status(500).json({ error: "Server error while creating blog." });
  }
};

// 🟢 Update Blog (Admin only)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const image = req.body.image;
    const title = sanitize(req.body.title);
    const tags = Array.isArray(req.body.tags) ? req.body.tags.map(tag => sanitize(tag)) : [];
    const layoutType = sanitize(req.body.layoutType);
    const content = Array.isArray(req.body.content) ? req.body.content.map(block => ({
      type: sanitize(block.type),
      value: sanitize(block.value)
    })) : [];

    // Find blog first
    const blog = await BlogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }

    // ✅ Validation (Enhanced)
    if (!title || title.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty." });
    }

    if (!content || !Array.isArray(content) || content.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one content block is required." });
    }

    // Validate each content block
    for (let i = 0; i < content.length; i++) {
      const block = content[i];
      if (!block.type || !block.value || block.value.trim().length === 0) {
        return res.status(400).json({
          error: `Content block ${
            i + 1
          } is invalid. Type and value are required.`,
        });
      }

      // Validate block type
      const validTypes = ["paragraph", "heading", "image", "quote"];
      if (!validTypes.includes(block.type)) {
        return res.status(400).json({
          error: `Invalid content block type: ${
            block.type
          }. Valid types are: ${validTypes.join(", ")}`,
        });
      }
    }

    // Check if title already exists (excluding current blog)
    const existing = await BlogModel.findOne({
      title: title.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "A blog with this title already exists." });
    }

    // Update blog
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        image: image || "",
        tags: tags.filter((tag) => tag.trim().length > 0),
        layoutType: layoutType || "standard",
        content: content.map((block) => ({
          type: block.type,
          value: block.value.trim(),
        })),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Blog updated successfully!",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Blog update error:", error);
    res.status(500).json({ error: "Server error while updating blog." });
  }
};

// 🟢 Delete Blog (Admin only)
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await BlogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }

    await BlogModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "Blog deleted successfully!",
    });
  } catch (error) {
    console.error("Blog delete error:", error);
    res.status(500).json({ error: "Server error while deleting blog." });
  }
};

// 🟢 Upload Image (Admin only)
export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // Generate the URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/blog-images/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Server error while uploading image." });
  }
};
