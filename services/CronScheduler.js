import cron from "node-cron";
import { checkAndProcessSubmissions } from "./AutoCompletionService.js";

const initializeCronJobs = () => {
  console.log("🕐 Initializing cron jobs...");

  cron.schedule("0 9 * * *", async () => {
    console.log("🔄 Running daily auto-completion check...");
    try {
      await checkAndProcessSubmissions();
      console.log("✅ Daily auto-completion check completed");
    } catch (error) {
      console.error("❌ Error in daily auto-completion check:", error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Karachi"
  });

  console.log("✅ Cron jobs initialized successfully");
};

export { initializeCronJobs }; 