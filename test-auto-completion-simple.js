import { checkAndProcessSubmissions } from "./services/AutoCompletionService.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const testAutoCompletion = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();
    
    console.log("🔄 Running auto-completion check...");
    await checkAndProcessSubmissions();
    
    console.log("✅ Auto-completion check completed successfully!");
    console.log("🎉 System is working properly!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in test:", error);
    process.exit(1);
  }
};

console.log("🧪 Testing Auto-Completion System...");
testAutoCompletion(); 