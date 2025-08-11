import { checkAndProcessSubmissions } from "./services/AutoCompletionService.js";
import SubmitProjectModel from "./Model/SubmitProjectModel.js";
import PostProjectModel from "./Model/PostProjectModel.js";
import UserModel from "./Model/UserModel.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const testAutoCompletion = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();
    
    console.log("🔄 Running auto-completion check...");
    await checkAndProcessSubmissions();
    
    console.log("✅ Auto-completion check completed!");
    
    const pendingSubmissions = await SubmitProjectModel.find({
      status: "submitted"
    }).populate("project").populate("user");
    
    console.log(`📊 Found ${pendingSubmissions.length} pending submissions`);
    
    pendingSubmissions.forEach(submission => {
      const submissionDate = new Date(submission.submittedAt);
      const currentDate = new Date();
      const daysSinceSubmission = Math.floor((currentDate - submissionDate) / (1000 * 60 * 60 * 24));
      
      console.log(`📋 Project: ${submission.project?.title || 'N/A'}`);
      console.log(`👤 Freelancer: ${submission.user?.name || 'N/A'}`);
      console.log(`📅 Days since submission: ${daysSinceSubmission}`);
      console.log(`⏰ Status: ${daysSinceSubmission >= 3 && daysSinceSubmission < 10 ? 'Needs Reminder' : daysSinceSubmission >= 10 ? 'Needs Auto-Complete' : 'Normal'}`);
      console.log("---");
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in test:", error);
    process.exit(1);
  }
};

testAutoCompletion(); 