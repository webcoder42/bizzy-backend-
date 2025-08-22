import ProjectSell from '../Model/ProjectSellModel.js';
import User from '../Model/UserModel.js';

// Create new project
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      price,
      duration,
      features,
      requirements,
      status,
      links,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and price are required'
      });
    }

    // Process base64 images from request body
    const images = [];
    
    if (req.body.images && Array.isArray(req.body.images)) {
      req.body.images.forEach(imageData => {
        if (imageData.base64 && imageData.name && imageData.size && imageData.type) {
          // Check file size (max 5MB for base64)
          if (imageData.size > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: `Image ${imageData.name} is too large. Maximum size is 5MB.`
            });
          }
          
          images.push({
            originalName: imageData.name,
            base64Data: imageData.base64,
            size: imageData.size,
            mimetype: imageData.type
          });
        }
      });
    }

    // Parse arrays if they're strings
    const parsedFeatures = typeof features === 'string' ? 
      features.split(',').map(feature => feature.trim()) : features || [];
    
    const parsedTags = typeof tags === 'string' ? 
      tags.split(',').map(tag => tag.trim().toLowerCase()) : tags || [];

    // Parse links if it's a string
    const parsedLinks = typeof links === 'string' ? JSON.parse(links) : links || {};

    // Create project
    const project = new ProjectSell({
      title,
      description,
      category,
      subCategory,
      price: parseFloat(price),
      duration,
      features: parsedFeatures,
      requirements,
      status: status || 'draft',
      links: parsedLinks,
      tags: parsedTags,
      images,
      seller: req.user._id || req.user.id
    });

    const savedProject = await project.save();
    
    // Populate seller information
    await savedProject.populate('seller', 'username email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: savedProject
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Get all projects (with pagination and filters)
const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'published'
    } = req.query;

    // Build filter object
    const filter = { status, isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const projects = await ProjectSell.find(filter)
      .populate('seller', 'username profilePicture rating')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await ProjectSell.countDocuments(filter);

    // Add view counts and user interaction status
    const userId = req.user?._id || req.user?.id;
    const projectsWithStats = projects.map(project => {
      const projectData = project.toObject();
      
      // Ensure arrays exist for safe operations
      const views = Array.isArray(project.views) ? project.views : [];
      const likes = Array.isArray(project.likes) ? project.likes : [];
      const saves = Array.isArray(project.saves) ? project.saves : [];
      
      projectData.viewCount = views.length;
      projectData.isLiked = userId ? likes.some(like => like.user.toString() === userId.toString()) : false;
      projectData.isSaved = userId ? saves.some(save => save.user.toString() === userId.toString()) : false;
      projectData.likesCount = likes.length;
      projectData.savesCount = saves.length;
      return projectData;
    });

    res.status(200).json({
      success: true,
      projects: projectsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project by ID or slug
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let project = await ProjectSell.findById(id)
      .populate('seller', 'username email profilePicture rating')
      .populate('inquiries.user', 'username profilePicture');
    
    if (!project) {
      project = await ProjectSell.findOne({ slug: id })
        .populate('seller', 'username email profilePicture rating')
        .populate('inquiries.user', 'username profilePicture');
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Force fix the data structure first
    let needsUpdate = false;
    
    // Fix views field
    if (!Array.isArray(project.views)) {
      project.views = [];
      project.markModified('views');
      needsUpdate = true;
    }
    
    // Fix likes field
    if (!Array.isArray(project.likes)) {
      project.likes = [];
      project.markModified('likes');
      needsUpdate = true;
    }
    
    // Fix saves field
    if (!Array.isArray(project.saves)) {
      project.saves = [];
      project.markModified('saves');
      needsUpdate = true;
    }

    // If we had to fix the data structure, save it first
    if (needsUpdate) {
      try {
        await project.save();
        console.log('Fixed data structure for project:', project._id);
      } catch (fixError) {
        console.log('Failed to fix data structure:', fixError.message);
        // Continue anyway, we'll try to handle it in the main operation
      }
    }

    // Increment view count (async, don't wait)
    const userId = req.user?._id || req.user?.id;
    if (userId) {
      project.incrementView(userId).catch(err => console.log('Error incrementing view:', err));
    }

    // Add view count and user interaction status
    const projectData = project.toObject();
    projectData.viewCount = project.getViewCount();
    projectData.isLiked = userId ? project.likes.some(like => like.user.toString() === userId.toString()) : false;
    projectData.isSaved = userId ? project.saves.some(save => save.user.toString() === userId.toString()) : false;
    projectData.likesCount = project.likes.length;
    projectData.savesCount = project.saves.length;

    res.status(200).json({
      success: true,
      project: projectData
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Get user's projects
const getUserProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    const filter = { seller: req.user._id || req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const projects = await ProjectSell.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ProjectSell.countDocuments(filter);

    res.status(200).json({
      success: true,
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProjects: total
      }
    });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user projects',
      error: error.message
    });
  }
};

// Get single project for editing
const getProjectForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const project = await ProjectSell.findOne({ 
      _id: id, 
      seller: userId 
    }).populate('seller', 'username email profilePicture');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not authorized to edit this project'
      });
    }

    res.status(200).json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Error fetching project for edit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get update data from request body
    const updateData = req.body || {};
    
    // Debug logging
    console.log('Update request body:', req.body);
    console.log('Update data keys:', Object.keys(updateData));
    console.log('Request headers:', req.headers);

    // Find project and check ownership
    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.seller.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this project'
      });
    }

    // Process arrays with proper null checks
    if (updateData.features) {
      if (Array.isArray(updateData.features)) {
        updateData.features = updateData.features.filter(Boolean);
      } else if (typeof updateData.features === 'string') {
        updateData.features = updateData.features.split(',').map(feature => feature.trim()).filter(Boolean);
      } else {
        updateData.features = [];
      }
    } else {
      updateData.features = project.features || [];
    }
    
    if (updateData.tags) {
      if (Array.isArray(updateData.tags)) {
        updateData.tags = updateData.tags.map(tag => tag.toLowerCase()).filter(Boolean);
      } else if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
      } else {
        updateData.tags = [];
      }
    } else {
      updateData.tags = project.tags || [];
    }

    // Handle base64 images with null checks
    if (req.body.images && Array.isArray(req.body.images)) {
      const newImages = req.body.images.map(imageData => {
        if (imageData && imageData.base64 && imageData.name && imageData.size && imageData.type) {
          return {
            originalName: imageData.name,
            base64Data: imageData.base64,
            size: imageData.size,
            mimetype: imageData.type
          };
        }
        return null;
      }).filter(img => img !== null);
      
      updateData.images = newImages;
    } else {
      updateData.images = project.images || [];
    }

    // Ensure other required fields have fallback values
    if (!updateData.title) updateData.title = project.title;
    if (!updateData.description) updateData.description = project.description;
    if (!updateData.category) updateData.category = project.category;
    if (!updateData.price) updateData.price = project.price;
    if (!updateData.duration) updateData.duration = project.duration;
    if (!updateData.status) updateData.status = project.status;
    if (!updateData.requirements) updateData.requirements = project.requirements || '';
    if (!updateData.subCategory) updateData.subCategory = project.subCategory || '';
    
    // Ensure arrays exist even if not provided
    if (!updateData.features) updateData.features = project.features || [];
    if (!updateData.tags) updateData.tags = project.tags || [];

    // Handle links properly with null checks
    if (updateData.links) {
      if (typeof updateData.links === 'string') {
        try {
          updateData.links = JSON.parse(updateData.links);
        } catch (error) {
          console.error('Error parsing links JSON:', error);
          updateData.links = project.links || {};
        }
      } else if (typeof updateData.links === 'object') {
        // Ensure all link fields exist
        updateData.links = {
          github: updateData.links.github || '',
          demo: updateData.links.demo || '',
          portfolio: updateData.links.portfolio || '',
          documentation: updateData.links.documentation || ''
        };
      }
    } else {
      updateData.links = project.links || {};
    }

    const updatedProject = await ProjectSell.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'username email profilePicture');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.seller.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this project'
      });
    }

    // No need to delete files since we're using base64 storage

    await ProjectSell.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};



// Add inquiry
const addInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addInquiry(userId, message.trim());

    res.status(200).json({
      success: true,
      message: 'Inquiry sent successfully'
    });

  } catch (error) {
    console.error('Error adding inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending inquiry',
      error: error.message
    });
  }
};

// Get featured projects
const getFeaturedProjects = async (req, res) => {
  try {
    const projects = await ProjectSell.getFeatured();
    
    res.status(200).json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Error fetching featured projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured projects',
      error: error.message
    });
  }
};

// Get projects by category
const getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const projects = await ProjectSell.getByCategory(category)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Error fetching projects by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects by category',
      error: error.message
    });
  }
};

// Toggle like for a project
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Force fix the data structure first
    let needsUpdate = false;
    
    // Fix views field
    if (!Array.isArray(project.views)) {
      project.views = [];
      project.markModified('views');
      needsUpdate = true;
    }
    
    // Fix likes field
    if (!Array.isArray(project.likes)) {
      project.likes = [];
      project.markModified('likes');
      needsUpdate = true;
    }
    
    // Fix saves field
    if (!Array.isArray(project.saves)) {
      project.saves = [];
      project.markModified('saves');
      needsUpdate = true;
    }

    // If we had to fix the data structure, save it first
    if (needsUpdate) {
      try {
        await project.save();
        console.log('Fixed data structure for project:', project._id);
      } catch (fixError) {
        console.log('Failed to fix data structure:', fixError.message);
        // Continue anyway, we'll try to handle it in the main operation
      }
    }

    const isLiked = project.likes.some(like => like.user.toString() === userId.toString());
    
    if (isLiked) {
      // Unlike
      project.likes = project.likes.filter(like => like.user.toString() !== userId.toString());
    } else {
      // Like
      project.likes.push({ user: userId, likedAt: new Date() });
    }

    await project.save();

    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: project.likes.length,
      message: isLiked ? 'Project unliked' : 'Project liked'
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// Get trending projects
const getTrendingProjects = async (req, res) => {
  try {
    const projects = await ProjectSell.getTrending();
    
    // Add user interaction status if user is logged in
    const userId = req.user?._id || req.user?.id;
    const projectsWithStats = projects.map(project => {
      const projectData = { ...project };
      
      // Ensure arrays exist for safe operations
      const likes = Array.isArray(project.likes) ? project.likes : [];
      const saves = Array.isArray(project.saves) ? project.saves : [];
      
      projectData.isLiked = userId ? likes.some(like => like.user.toString() === userId.toString()) : false;
      projectData.isSaved = userId ? saves.some(save => save.user.toString() === userId.toString()) : false;
      projectData.likesCount = likes.length;
      projectData.savesCount = saves.length;
      return projectData;
    });

    res.status(200).json({
      success: true,
      projects: projectsWithStats
    });

  } catch (error) {
    console.error('Error fetching trending projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending projects',
      error: error.message
    });
  }
};

// Toggle save for a project
const toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Force fix the data structure first
    let needsUpdate = false;
    
    // Fix views field
    if (!Array.isArray(project.views)) {
      project.views = [];
      project.markModified('views');
      needsUpdate = true;
    }
    
    // Fix likes field
    if (!Array.isArray(project.likes)) {
      project.likes = [];
      project.markModified('likes');
      needsUpdate = true;
    }
    
    // Fix saves field
    if (!Array.isArray(project.saves)) {
      project.saves = [];
      project.markModified('saves');
      needsUpdate = true;
    }

    // If we had to fix the data structure, save it first
    if (needsUpdate) {
      try {
        await project.save();
        console.log('Fixed data structure for project:', project._id);
      } catch (fixError) {
        console.log('Failed to fix data structure:', fixError.message);
        // Continue anyway, we'll try to handle it in the main operation
      }
    }

    const isSaved = project.saves.some(save => save.user.toString() === userId.toString());
    
    if (isSaved) {
      // Unsave
      project.saves = project.saves.filter(save => save.user.toString() !== userId.toString());
    } else {
      // Save
      project.saves.push({ user: userId, savedAt: new Date() });
    }

    await project.save();

    res.status(200).json({
      success: true,
      isSaved: !isSaved,
      savesCount: project.saves.length,
      message: isSaved ? 'Project unsaved' : 'Project saved'
    });

  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling save',
      error: error.message
    });
  }
};

// Get user's liked projects
const getUserLikes = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const projects = await ProjectSell.find({
      'likes.user': userId
    }).select('_id');

    const likedProjectIds = projects.map(project => project._id.toString());

    res.status(200).json({
      success: true,
      likedProjects: likedProjectIds
    });

  } catch (error) {
    console.error('Error fetching user likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user likes',
      error: error.message
    });
  }
};

// Get user's saved projects
const getUserSaves = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const projects = await ProjectSell.find({
      'saves.user': userId
    }).select('_id');

    const savedProjectIds = projects.map(project => project._id.toString());

    res.status(200).json({
      success: true,
      savedProjects: savedProjectIds
    });

  } catch (error) {
    console.error('Error fetching user saves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user saves',
      error: error.message
    });
  }
};

// Increment project view
const incrementView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Force fix the data structure first
    let needsUpdate = false;
    
    // Fix views field
    if (!Array.isArray(project.views)) {
      project.views = [];
      project.markModified('views');
      needsUpdate = true;
    }
    
    // Fix likes field
    if (!Array.isArray(project.likes)) {
      project.likes = [];
      project.markModified('likes');
      needsUpdate = true;
    }
    
    // Fix saves field
    if (!Array.isArray(project.saves)) {
      project.saves = [];
      project.markModified('saves');
      needsUpdate = true;
    }

    // If we had to fix the data structure, save it first
    if (needsUpdate) {
      try {
        await project.save();
        console.log('Fixed data structure for project:', project._id);
      } catch (fixError) {
        console.log('Failed to fix data structure:', fixError.message);
      }
    }

    // Increment view
    await project.incrementView(userId);

    res.status(200).json({
      success: true,
      viewCount: project.getViewCount(),
      message: 'View recorded'
    });

  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording view',
      error: error.message
    });
  }
};

// Get all projects for admin (including all statuses)
const getAllProjectsForAdmin = async (req, res) => {
  try {
    console.log('getAllProjectsForAdmin called with query:', req.query);
    console.log('User making request:', req.user);
    
    const { page = 1, limit = 50, status, category, search } = req.query;
    
    const query = {};
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    console.log('Final query:', query);
    
    const skip = (page - 1) * limit;
    
    const projects = await ProjectSell.find(query)
      .populate('seller', 'username email profilePicture rating totalEarnings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ProjectSell.countDocuments(query);
    
    console.log(`Found ${projects.length} projects out of ${total} total`);
    
    res.json({
      success: true,
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting projects for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting projects for admin',
      error: error.message
    });
  }
};

// Delete project by admin
const deleteProjectByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await ProjectSell.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await ProjectSell.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

// Get seller's average rating
const getSellerRating = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Import ProjectPurchase model to get ratings
    const ProjectPurchase = (await import('../Model/ProjectPurchaseModel.js')).default;

    // Get all purchases where this user is the seller and has been rated
    const ratedPurchases = await ProjectPurchase.find({
      seller: sellerId,
      isRated: true,
      rating: { $exists: true, $ne: null }
    });

    if (ratedPurchases.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          hasRatings: false
        }
      });
    }

    // Calculate average rating
    const totalRating = ratedPurchases.reduce((sum, purchase) => sum + purchase.rating, 0);
    const averageRating = totalRating / ratedPurchases.length;

    res.status(200).json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings: ratedPurchases.length,
        hasRatings: true
      }
    });

  } catch (error) {
    console.error('Error getting seller rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting seller rating',
      error: error.message
    });
  }
};

// Get project's individual rating
const getProjectRating = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Import ProjectPurchase model to get ratings
    const ProjectPurchase = (await import('../Model/ProjectPurchaseModel.js')).default;

    // Get all purchases for this specific project that have been rated
    const ratedPurchases = await ProjectPurchase.find({
      project: projectId,
      isRated: true,
      rating: { $exists: true, $ne: null }
    }).populate('buyer', 'name email');

    if (ratedPurchases.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          hasRatings: false,
          individualRatings: []
        }
      });
    }

    // Calculate average rating for this specific project
    const totalRating = ratedPurchases.reduce((sum, purchase) => sum + purchase.rating, 0);
    const averageRating = Math.round((totalRating / ratedPurchases.length) * 10) / 10;

    // Format individual ratings
    const individualRatings = ratedPurchases.map(purchase => ({
      rating: purchase.rating,
      comment: purchase.comment || '',
      buyerName: purchase.buyer?.name || 'Anonymous',
      ratedAt: purchase.ratedAt || purchase.reviewDate
    }));

    return res.status(200).json({
      success: true,
      data: {
        averageRating,
        totalRatings: ratedPurchases.length,
        hasRatings: true,
        individualRatings
      }
    });
  } catch (error) {
    console.error('Error getting project rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export {
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
};
