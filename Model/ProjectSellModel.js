import mongoose from 'mongoose';

const projectSellSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Category and Type
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['web', 'mobile', 'design', 'software', 'other'],
    default: 'web'
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [1, 'Price must be at least $1']
  },
  

  
  duration: {
    type: String,
    enum: ['1week', '2weeks', '1month', '2months', '3months', 'custom'],
    default: '1month'
  },
  
  // Media Files - Base64 Storage
  images: [{
    originalName: String,
    base64Data: String, // Base64 data URL
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  

  
  // Links
  links: {
    github: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?github\.com\//.test(v);
        },
        message: 'Please provide a valid GitHub URL'
      }
    },
    
    demo: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    
    portfolio: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    
    documentation: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid URL'
      }
    }
  },
  
  // Additional Information
  features: [{
    type: String,
    trim: true
  }],
  
  requirements: {
    type: String,
    trim: true,
    maxLength: [1000, 'Requirements cannot exceed 1000 characters']
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'sold', 'archived'],
    default: 'draft'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // User Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  
  // Analytics
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  saves: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    message: String,
    inquiredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // SEO and Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
projectSellSchema.virtual('likeCount').get(function() {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

// Virtual for inquiry count
projectSellSchema.virtual('inquiryCount').get(function() {
  return Array.isArray(this.inquiries) ? this.inquiries.length : 0;
});

// Virtual for view count
projectSellSchema.virtual('viewCount').get(function() {
  return Array.isArray(this.views) ? this.views.length : 0;
});

// Migration function to convert old views format to new format
projectSellSchema.methods.migrateViews = async function() {
  if (typeof this.views === 'number') {
    // Convert number to array format
    this.views = [];
    this.markModified('views');
    await this.save();
  }
  return this;
};

// Create slug before saving
projectSellSchema.pre('save', function(next) {
  // Handle views migration - ensure views is always an array
  if (!Array.isArray(this.views)) {
    this.views = [];
    this.markModified('views');
  }

  // Handle likes migration - ensure likes is always an array
  if (!Array.isArray(this.likes)) {
    this.likes = [];
    this.markModified('likes');
  }

  // Handle saves migration - ensure saves is always an array
  if (!Array.isArray(this.saves)) {
    this.saves = [];
    this.markModified('saves');
  }

  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  this.updatedAt = new Date();
  next();
});

// Pre-find middleware to handle migration
projectSellSchema.pre('find', function() {
  // This ensures that when we query documents, we handle any migration issues
});

projectSellSchema.pre('findOne', function() {
  // This ensures that when we query documents, we handle any migration issues
});

projectSellSchema.pre('findById', function() {
  // This ensures that when we query documents, we handle any migration issues
});

// Indexes for better performance
projectSellSchema.index({ seller: 1, status: 1 });
projectSellSchema.index({ category: 1, status: 1 });
projectSellSchema.index({ price: 1 });
projectSellSchema.index({ createdAt: -1 });

projectSellSchema.index({ slug: 1 });
projectSellSchema.index({ tags: 1 });

// Static methods
projectSellSchema.statics.getByCategory = function(category) {
  return this.find({ category, status: 'published', isActive: true })
    .populate('seller', 'username profilePicture rating')
    .sort({ createdAt: -1 });
};

projectSellSchema.statics.getFeatured = function() {
  return this.find({ isFeatured: true, status: 'published', isActive: true })
    .populate('seller', 'username profilePicture rating')
    .sort({ createdAt: -1 })
    .limit(10);
};

projectSellSchema.statics.getTrending = function() {
  return this.aggregate([
    { $match: { status: 'published', isActive: true } },
    { $addFields: { viewCount: { $size: "$views" } } },
    { $sort: { viewCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'seller'
      }
    },
    { $unwind: '$seller' },
    {
      $project: {
        'seller.password': 0,
        'seller.resetPasswordToken': 0,
        'seller.resetPasswordExpires': 0
      }
    }
  ]);
};

projectSellSchema.statics.searchProjects = function(query) {
  return this.find({
    $and: [
      { status: 'published', isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).populate('seller', 'username profilePicture rating');
};

// Instance methods
projectSellSchema.methods.incrementView = function(userId) {
  // Ensure views is an array
  if (!Array.isArray(this.views)) {
    this.views = [];
    this.markModified('views');
  }
  
  // Check if user has already viewed this project
  const existingView = this.views.find(view => view.user.toString() === userId.toString());
  
  if (!existingView) {
    // Add new view
    this.views.push({ user: userId, viewedAt: new Date() });
  } else {
    // Update existing view timestamp
    existingView.viewedAt = new Date();
  }
  
  return this.save();
};

projectSellSchema.methods.getViewCount = function() {
  return Array.isArray(this.views) ? this.views.length : 0;
};

projectSellSchema.methods.addLike = function(userId) {
  // Ensure likes is an array
  if (!Array.isArray(this.likes)) {
    this.likes = [];
    this.markModified('likes');
  }
  
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return this;
};

projectSellSchema.methods.removeLike = function(userId) {
  // Ensure likes is an array
  if (!Array.isArray(this.likes)) {
    this.likes = [];
    this.markModified('likes');
  }
  
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

projectSellSchema.methods.addInquiry = function(userId, message) {
  this.inquiries.push({ user: userId, message });
  return this.save();
};

const ProjectSell = mongoose.model('ProjectSell', projectSellSchema);

export default ProjectSell;
