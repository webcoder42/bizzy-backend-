import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixProjectData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('projectsells');

    // Find all documents that need fixing
    const projects = await collection.find({
      $or: [
        { views: { $type: 'number' } },
        { likes: { $type: 'number' } },
        { saves: { $type: 'number' } },
        { views: { $exists: false } },
        { likes: { $exists: false } },
        { saves: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${projects.length} projects that need fixing`);

    let fixedCount = 0;

    for (const project of projects) {
      const updateData = {};
      let needsUpdate = false;

      // Fix views field
      if (!Array.isArray(project.views)) {
        updateData.views = [];
        needsUpdate = true;
      }

      // Fix likes field
      if (!Array.isArray(project.likes)) {
        updateData.likes = [];
        needsUpdate = true;
      }

      // Fix saves field
      if (!Array.isArray(project.saves)) {
        updateData.saves = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await collection.updateOne(
          { _id: project._id },
          { $set: updateData }
        );
        fixedCount++;
        console.log(`Fixed project: ${project.title || project._id}`);
      }
    }

    console.log(`Data fix completed! ${fixedCount} projects were updated.`);

  } catch (error) {
    console.error('Data fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix
fixProjectData();
