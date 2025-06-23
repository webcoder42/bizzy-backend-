import PlanPurchaseModel from "../Model/PlanPurchaseModel.js";
import User from "../Model/UserModel.js";
import TeamHub from "./../Model/TeamHubModel.js";
import mongoose from "mongoose";
import sanitize from "mongo-sanitize";

export const createTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. ✅ Check if user already created a team
    const existingTeam = await TeamHub.findOne({ createdBy: userId });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "You have already created a team. Only one team is allowed.",
      });
    }

    // 2. ✅ Check if user has any approved plan with planPurpose: 'team'
    const validTeamPlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved",
    }).populate("plan"); // populate plan to check planPurpose

    if (!validTeamPlan || validTeamPlan.plan.planPurpose !== "team") {
      return res.status(403).json({
        success: false,
        message: "You must purchase a team plan first before creating a team.",
      });
    }

    // 3. ✅ Proceed to create team
    const { name, description, logo } = req.body;

    const newTeam = await TeamHub.create({
      name,
      description,
      logo,
      createdBy: userId,
      members: [
        {
          user: userId,
          role: "group-admin",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: newTeam,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating team",
    });
  }
};

// Add this to your controller file
// Update the checkUserTeamStatus function in your controller
export const checkUserTeamStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has created a team
    const isTeamCreator = await TeamHub.exists({ createdBy: userId });

    // Check if user is a member of any team (including as a regular member)
    const isTeamMember = await TeamHub.exists({
      "members.user": userId,
    });

    // Check if user has any team plan (any status)
    const anyTeamPlan = await PlanPurchaseModel.findOne({
      user: userId,
    }).populate("plan");

    // Check if user has any approved team plan
    const approvedTeamPlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved",
    }).populate("plan");

    // Check if user has any expired team plan (either by status or by end date)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const expiredTeamPlan = await PlanPurchaseModel.findOne({
      user: userId,
      $or: [{ status: "expired" }, { endDate: { $lt: today } }],
    }).populate("plan");

    const hasAnyPlan = !!anyTeamPlan;
    const hasApprovedPlan =
      approvedTeamPlan &&
      approvedTeamPlan.plan &&
      approvedTeamPlan.plan.planPurpose === "team" &&
      new Date(approvedTeamPlan.endDate) >= today; // Also check if not expired by date
    const hasExpiredPlan =
      expiredTeamPlan &&
      expiredTeamPlan.plan &&
      expiredTeamPlan.plan.planPurpose === "team";

    res.status(200).json({
      success: true,
      hasAnyPlan: hasAnyPlan,
      hasApprovedPlan: hasApprovedPlan,
      hasExpiredPlan: hasExpiredPlan,
      isTeamCreator: !!isTeamCreator,
      isTeamMember: !!isTeamMember,
    });
  } catch (error) {
    console.error("Error checking user team status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking user status",
    });
  }
};

export const addMemberByEmail = async (req, res) => {
  try {
    const sanitizedEmail = sanitize(req.body.email);
    const userId = req.user.id;

    // 1. Check if the requesting user has a team
    const team = await TeamHub.findOne({ createdBy: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "You don't have a team to add members to",
      });
    }

    // 2. Check if the email exists in users
    const userToAdd = await User.findOne({ email: sanitizedEmail });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found",
      });
    }

    // 3. Check if user is already in the team
    const isAlreadyMember = team.members.some(
      (member) => member.user.toString() === userToAdd._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this team",
      });
    }

    // 4. Add the user to the team
    team.members.push({
      user: userToAdd._id,
      role: "member", // Default role
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: "User added to team successfully",
      team,
    });
  } catch (error) {
    console.error("Error adding member by email:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while adding member",
    });
  }
};

// ✅ GET all team members with their name, email and role
export const getAllTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find team where user is either creator or member
    const team = await TeamHub.findOne({
      $or: [
        { createdBy: userId },
        { "members.user": new mongoose.Types.ObjectId(userId) },
      ],
    }).populate("members.user", "Fullname email _id");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team found where you are a creator or member.",
      });
    }

    // Map members array to send back name, email, role and _id
    const formattedMembers = team.members.map((member) => ({
      _id: member.user?._id || null,
      name: member.user?.Fullname || "No Name",
      email: member.user?.email || "No Email",
      role: member.role,
    }));

    return res.status(200).json({
      success: true,
      members: formattedMembers,
      isAdmin: team.createdBy.toString() === userId.toString(),
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching team members.",
    });
  }
};
export const updateTeamSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      isPublic,
      allowClientAccess,
      allowMembersToChat,
      allowMembersToAssignTasks,
    } = req.body;

    // 🔐 Find the team created by this user (admin)
    const team = await TeamHub.findOne({ createdBy: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or you are not the admin of any team.",
      });
    }

    // ✅ Update only the settings passed in request
    if (typeof isPublic !== "undefined") team.settings.isPublic = isPublic;
    if (typeof allowClientAccess !== "undefined")
      team.settings.allowClientAccess = allowClientAccess;
    if (typeof allowMembersToChat !== "undefined")
      team.settings.allowMembersToChat = allowMembersToChat;
    if (typeof allowMembersToAssignTasks !== "undefined")
      team.settings.allowMembersToAssignTasks = allowMembersToAssignTasks;

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team settings updated successfully",
      settings: team.settings,
    });
  } catch (error) {
    console.error("Error updating team settings:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating team settings.",
    });
  }
};

export const sendTeamMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is missing",
      });
    }

    // Find team where user is either creator or member
    const team = await TeamHub.findOne({
      $or: [
        { createdBy: userId },
        { "members.user": new mongoose.Types.ObjectId(userId) },
      ],
    }).populate("chat.sender", "Fullname email _id");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "You are not part of any team",
      });
    }

    const memberInfo = team.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!memberInfo) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this team",
      });
    }

    const isAdmin = memberInfo.role === "group-admin";
    const allowMembersToChat = team.settings?.allowMembersToChat;

    if (!isAdmin && !allowMembersToChat) {
      return res.status(403).json({
        success: false,
        message: "Members are not allowed to send messages in this team",
      });
    }

    // Add new message
    team.chat.push({
      sender: userId,
      message,
      timestamp: new Date(),
    });

    await team.save();

    // Get member roles mapping
    const memberRoles = {};
    team.members.forEach((member) => {
      memberRoles[member.user.toString()] = member.role;
    });

    // Format chat messages with proper sender info
    const formattedChat = team.chat.map((chatMsg) => {
      const senderId = chatMsg.sender._id.toString();
      return {
        sender: {
          _id: chatMsg.sender._id,
          name: chatMsg.sender?.Fullname || "Unknown",
          email: chatMsg.sender?.email || "Unknown",
          role: memberRoles[senderId] || "member",
        },
        message: chatMsg.message,
        timestamp: chatMsg.timestamp,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      chat: formattedChat,
      isAdmin: team.createdBy.toString() === userId.toString(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending message",
    });
  }
};

export const getTeamSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Team find kro jiska creator ye user ho
    const team = await TeamHub.findOne({ createdBy: userId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team found for the current user.",
      });
    }

    return res.status(200).json({
      success: true,
      settings: team.settings,
    });
  } catch (error) {
    console.error("Error fetching team settings:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching team settings.",
    });
  }
};
export const getAllTeamMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find team where user is either creator or member
    const team = await TeamHub.findOne({
      $or: [
        { createdBy: userId },
        { "members.user": new mongoose.Types.ObjectId(userId) },
      ],
    }).populate("chat.sender", "Fullname email _id");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "You are not part of any team.",
      });
    }

    // Get member roles mapping
    const memberRoles = {};
    team.members.forEach((member) => {
      memberRoles[member.user.toString()] = member.role;
    });

    const formattedChat = team.chat.map((chatMsg) => {
      const senderId = chatMsg.sender._id.toString();
      return {
        sender: {
          _id: chatMsg.sender._id,
          name: chatMsg.sender?.Fullname || "Unknown",
          email: chatMsg.sender?.email || "Unknown",
          role: memberRoles[senderId] || "member",
        },
        message: chatMsg.message,
        timestamp: chatMsg.timestamp,
      };
    });

    return res.status(200).json({
      success: true,
      chat: formattedChat,
      isAdmin: team.createdBy.toString() === userId.toString(),
    });
  } catch (error) {
    console.error("Error fetching team chat messages:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching chat messages.",
    });
  }
};

// ✅ Upload Task to Team Controller
export const uploadTaskToTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, amount, sharedFile } = req.body;
    const assignedToEmail = sanitize(req.body.assignedToEmail);

    // 1. ✅ Validate Required Fields
    if (!title || !description || !amount) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and amount are required.",
      });
    }

    // 2. ✅ Fetch user to check earnings
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 3. ✅ Check if user has enough earnings
    if (user.totalEarnings < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance to assign this task.",
      });
    }

    // 4. ✅ Find the team where user is the creator
    const team = await TeamHub.findOne({ createdBy: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found. Only team admins can upload tasks.",
      });
    }

    // 5. ✅ If assignedToEmail is provided, validate and find the user
    let assignedTo = null;
    if (assignedToEmail) {
      const assignedUser = await User.findOne({ email: assignedToEmail });
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found.",
        });
      }

      // Check if the assigned user is a member of the team
      const isTeamMember = team.members.some(
        (member) => member.user.toString() === assignedUser._id.toString()
      );

      if (!isTeamMember) {
        return res.status(400).json({
          success: false,
          message: "Assigned user is not a member of this team.",
        });
      }

      assignedTo = assignedUser._id;
    }

    // 6. ✅ Create task object
    const newTask = {
      title,
      description,
      amount,
      assignedTo,
      status: "todo",
      dueDate: null,
      createdAt: new Date(),
    };

    // 7. ✅ Optional: Add sharedFile if provided
    if (sharedFile && sharedFile.name && sharedFile.path) {
      const fileObj = {
        name: sharedFile.name,
        type: sharedFile.type || "file", // default to file
        path: sharedFile.path,
        uploadedBy: userId,
        uploadedAt: new Date(),
      };

      team.sharedFiles.push(fileObj);
    }

    // 8. ✅ Push task into team.tasks array
    team.tasks.push(newTask);

    // 9. ✅ Deduct amount from user earnings
    user.totalEarnings -= amount;

    await user.save();
    await team.save();

    return res.status(201).json({
      success: true,
      message: "Task uploaded successfully.",
      task: newTask,
    });
  } catch (error) {
    console.error("Error uploading task to team:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the task.",
    });
  }
};
// ✅ Get all tasks of the team
export const getTeamTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the team where user is either creator or member
    const team = await TeamHub.findOne({
      $or: [
        { createdBy: userId },
        { "members.user": new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team found for this user.",
      });
    }

    // Return all tasks from this team
    return res.status(200).json({
      success: true,
      tasks: team.tasks,
    });
  } catch (error) {
    console.error("Error fetching team tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching team tasks.",
    });
  }
};

// ✅ Update Task Status Controller
export const updateTaskStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, newStatus } = req.body;

    // 1. ✅ Validate required fields
    if (!taskId || !newStatus) {
      return res.status(400).json({
        success: false,
        message: "Task ID and new status are required.",
      });
    }

    // 2. ✅ Find the team where user is the admin
    const team = await TeamHub.findOne({ createdBy: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or you are not the admin.",
      });
    }

    // 3. ✅ Find the task in team's tasks
    const taskIndex = team.tasks.findIndex(
      (task) => task._id.toString() === taskId
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const task = team.tasks[taskIndex];
    const oldStatus = task.status;

    // 4. ✅ Update task status
    team.tasks[taskIndex].status = newStatus;

    // 5. ✅ If status is changed to 'done', process payment
    if (newStatus === "done" && oldStatus !== "done" && task.assignedTo) {
      // Find the assigned user
      const assignedUser = await User.findById(task.assignedTo);
      if (assignedUser) {
        // Increment user's earnings
        assignedUser.totalEarnings += task.amount;
        await assignedUser.save();
      }
    }

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      task: team.tasks[taskIndex],
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating task status.",
    });
  }
};

// ✅ Kick member from team (Admin only)
export const kickMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const userId = req.user.id;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }

    // Find team where user is admin
    const team = await TeamHub.findOne({
      createdBy: userId,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or you are not the admin",
      });
    }

    // Remove member from team
    team.members = team.members.filter(
      (member) => member.user.toString() !== memberId
    );

    await team.save();

    res.status(200).json({
      success: true,
      message: "Member removed from team successfully",
      team,
    });
  } catch (error) {
    console.error("Error kicking member:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while removing member",
    });
  }
};

// ✅ Delete team (Admin only)
export const deleteTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find team where user is admin
    const team = await TeamHub.findOne({
      createdBy: userId,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or you are not the admin",
      });
    }

    // Delete the team
    await TeamHub.findByIdAndDelete(team._id);

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting team",
    });
  }
};

// ✅ Leave team (Member only)
export const leaveTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. ✅ Find team where user is a member (not admin)
    const team = await TeamHub.findOne({
      "members.user": new mongoose.Types.ObjectId(userId),
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of any team.",
      });
    }

    // 2. ✅ Check if user is the team admin (admin cannot leave, only delete team)
    if (team.createdBy.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Team admin cannot leave the team. Use delete team option instead.",
      });
    }

    // 3. ✅ Remove user from team members
    team.members = team.members.filter(
      (member) => member.user.toString() !== userId
    );

    await team.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the team.",
    });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while leaving the team.",
    });
  }
};
