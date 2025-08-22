import mongoose from 'mongoose';
import ProjectSell from './Model/ProjectSellModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateViews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all projects where views is a number
    const projects = await ProjectSell.find({
      views: { $type: 'number' }
    });

    console.log(`Found ${projects.length} projects with number views`);

    // Update each project
    for (const project of projects) {
      project.views = [];
      project.markModified('views');
      await project.save();
      console.log(`Migrated project: ${project.title}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateViews();
