import mongoose from 'mongoose';
import ProjectSell from './Model/ProjectSellModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateProjectSell = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all projects that need migration
    const projects = await ProjectSell.find({
      $or: [
        { views: { $type: 'number' } },
        { likes: { $type: 'number' } },
        { saves: { $type: 'number' } },
        { views: { $exists: false } },
        { likes: { $exists: false } },
        { saves: { $exists: false } }
      ]
    });

    console.log(`Found ${projects.length} projects that need migration`);

    let migratedCount = 0;

    for (const project of projects) {
      let needsUpdate = false;

      // Fix views field
      if (!Array.isArray(project.views)) {
        project.views = [];
        needsUpdate = true;
      }

      // Fix likes field
      if (!Array.isArray(project.likes)) {
        project.likes = [];
        needsUpdate = true;
      }

      // Fix saves field
      if (!Array.isArray(project.saves)) {
        project.saves = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await project.save();
        migratedCount++;
        console.log(`Migrated project: ${project.title} (${project._id})`);
      }
    }

    console.log(`Migration completed! ${migratedCount} projects were updated.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProjectSell();
}

export default migrateProjectSell;
