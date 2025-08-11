import UserModel from "../Model/UserModel.js";

// Track user activity and update lastSeen
export const updateUserActivity = async (userId) => {
  try {
    await UserModel.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
      availability: "online"
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};

// Check for inactive users and set them offline
export const checkInactiveUsers = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    const inactiveUsers = await UserModel.find({
      lastSeen: { $lt: tenMinutesAgo },
      availability: "online"
    });

    if (inactiveUsers.length > 0) {
      await UserModel.updateMany(
        {
          lastSeen: { $lt: tenMinutesAgo },
          availability: "online"
        },
        {
          availability: "offline"
        }
      );

      console.log(`✅ Set ${inactiveUsers.length} users offline due to inactivity`);
    }
  } catch (error) {
    console.error("Error checking inactive users:", error);
  }
};

// Initialize activity tracking
export const initializeActivityTracking = () => {
  // Check for inactive users every minute
  setInterval(checkInactiveUsers, 60 * 1000);
  
  console.log("✅ Activity tracking service initialized");
}; 