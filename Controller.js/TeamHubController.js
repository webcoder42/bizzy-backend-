import TeamHub from "../Model/TeamHubModel.js";
import PlanPurchaseModel from "../Model/PlanPurchaseModel.js";
import PlanSxhemaModel from "../Model/PlanSxhemaModel.js";
import UserModel from "../Model/UserModel.js";

import SiteSettings from '../Model/SiteSettingsModel.js';
export const createTeam = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const userId = req.user.id;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const activePlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved",
    }).populate("plan");

    if (!activePlan) {
      return res.status(400).json({
        success: false,
        message: "You need an active plan to create a team. Please purchase a team plan first.",
      });
    }

    const now = new Date();
    const endDate = new Date(activePlan.endDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const planEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (planEndDate < today) {
      return res.status(400).json({
        success: false,
        message: "Your plan has expired. Please renew your team plan to create a team.",
      });
    }

    if (activePlan.plan.planPurpose !== "team") {
      return res.status(400).json({
        success: false,
        message: "You need a team plan to create a team. Please purchase a team plan first.",
      });
    }

    const newTeam = new TeamHub({
      name,
      description,
      logo: logo || "",
      createdBy: userId,
      members: [
        {
          user: userId,
          role: "admin",
          joinedAt: new Date(),
          status: "active",
        },
      ],
      planId: activePlan._id,
    });

    const savedTeam = await newTeam.save();

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: savedTeam,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating team",
      error: error.message,
    });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, logo } = req.body;
    const userId = req.user.id;

    console.log('Update Team Debug:', {
      teamId,
      userId,
      userType: typeof userId,
      teamIdType: typeof teamId
    });

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    console.log('Team Debug:', {
      teamCreatedBy: team.createdBy,
      teamCreatedByType: typeof team.createdBy,
      userId: userId,
      userIdType: typeof userId,
      comparison: team.createdBy.toString() === userId.toString()
    });

    // More robust comparison that handles both ObjectId and string types
    const isCreator = team.createdBy.toString() === userId.toString() || 
                     team.createdBy.toString() === userId ||
                     team.createdBy === userId.toString() ||
                     team.createdBy === userId;

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "You can only edit teams you created",
      });
    }

    const updatedTeam = await TeamHub.findByIdAndUpdate(
      teamId,
      {
        name,
        description,
        logo: logo || team.logo,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating team",
      error: error.message,
    });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // More robust comparison that handles both ObjectId and string types
    const isCreator = team.createdBy.toString() === userId.toString() || 
                     team.createdBy.toString() === userId ||
                     team.createdBy === userId.toString() ||
                     team.createdBy === userId;

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "You can only delete teams you created",
      });
    }

    await TeamHub.findByIdAndDelete(teamId);

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting team",
      error: error.message,
    });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .populate('chat.sender', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(member => {
      const memberUserId = member.user._id.toString();
      return memberUserId === userId.toString() || memberUserId === userId;
    });
    
    const isCreator = team.createdBy._id.toString() === userId.toString() || 
                     team.createdBy._id.toString() === userId ||
                     team.createdBy._id === userId.toString() ||
                     team.createdBy._id === userId;

    if (!isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this team",
      });
    }

    res.status(200).json({
      success: true,
      message: "Team fetched successfully",
      team: team,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching team",
      error: error.message,
    });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(member => 
      member.user.toString() === userId.toString() || member.user === userId
    );
    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    const isAdmin = team.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'admin'
    );

    console.log('SendChatMessage - User permissions:', { isMember, isCreator, isAdmin });

    if (!isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this team",
      });
    }

    // Check if user has permission to send messages
    if (!isCreator && !isAdmin && team.settings?.allowMessages === false) {
      return res.status(403).json({
        success: false,
        message: "Message sending is disabled by admin",
      });
    }

    // Create new message
    const newMessage = {
      sender: userId,
      message: message.trim(),
      timestamp: new Date(),
      isAdmin: isCreator || isAdmin,
    };

    // Add message to team chat
    team.chat.push(newMessage);
    await team.save();

    // Populate sender info for response
    const populatedTeam = await TeamHub.findById(teamId)
      .populate('chat.sender', 'username email profilePicture')
      .populate('members.user', 'username email profilePicture')
      .populate('createdBy', 'username email profilePicture');

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while sending message",
      error: error.message,
    });
  }
};

export const addUserToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    const isAdmin = team.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'admin'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only team creator and admins can add users",
      });
    }

    const userToAdd = await UserModel.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    const isAlreadyMember = team.members.some(member => 
      member.user.toString() === userToAdd._id.toString() || member.user === userToAdd._id
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this team",
      });
    }

    team.members.push({
      user: userToAdd._id,
      role: "member",
      joinedAt: new Date(),
      status: "active",
    });

    await team.save();

    const populatedTeam = await TeamHub.findById(teamId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: "User added to team successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error adding user to team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding user",
      error: error.message,
    });
  }
};

export const removeUserFromTeam = async (req, res) => {
  try {
    const { teamId, userId: userToRemoveId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    const isAdmin = team.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'admin'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only team creator and admins can remove users",
      });
    }

    team.members = team.members.filter(member => 
      member.user.toString() !== userToRemoveId.toString() && member.user !== userToRemoveId
    );

    await team.save();

    const populatedTeam = await TeamHub.findById(teamId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: "User removed from team successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error removing user from team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while removing user",
      error: error.message,
    });
  }
};

export const promoteUserToAdmin = async (req, res) => {
  try {
    const { teamId, userId: userToPromoteId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "Only team creator can promote users to admin",
      });
    }

    const memberToPromote = team.members.find(member => 
      member.user.toString() === userToPromoteId.toString() || member.user === userToPromoteId
    );

    if (!memberToPromote) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this team",
      });
    }

    if (memberToPromote.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    memberToPromote.role = 'admin';
    await team.save();

    const populatedTeam = await TeamHub.findById(teamId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: "User promoted to admin successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while promoting user",
      error: error.message,
    });
  }
};

export const demoteUserFromAdmin = async (req, res) => {
  try {
    const { teamId, userId: userToDemoteId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "Only team creator can demote admins",
      });
    }

    const memberToDemote = team.members.find(member => 
      member.user.toString() === userToDemoteId.toString() || member.user === userToDemoteId
    );

    if (!memberToDemote) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this team",
      });
    }

    if (memberToDemote.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: "User is not an admin",
      });
    }

    memberToDemote.role = 'member';
    await team.save();

    const populatedTeam = await TeamHub.findById(teamId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: "User demoted from admin successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error demoting user from admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while demoting user",
      error: error.message,
    });
  }
};

export const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(member => 
      member.user.toString() === userId.toString() || member.user === userId
    );
    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;

    if (!isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this team",
      });
    }

    // Populate assignedTo field for tasks
    const populatedTeam = await TeamHub.findById(teamId)
      .populate('tasks.assignedTo', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      tasks: populatedTeam.tasks || [],
    });
  } catch (error) {
    console.error("Error fetching team tasks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching tasks",
      error: error.message,
    });
  }
};



export const createTeamTask = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { title, description, assignedToUserId, assignedToEmail, amount, priority, dueDate } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    const isAdmin = team.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'admin'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only team creator and admins can create tasks",
      });
    }

    // Validate assigned user if provided
    let assignedTo = null;
    if (assignedToUserId) {
      const isAssignedUserMember = team.members.some(member => 
        member.user.toString() === assignedToUserId.toString() || member.user === assignedToUserId
      );
      if (!isAssignedUserMember) {
        return res.status(400).json({
          success: false,
          message: "Assigned user must be a team member",
        });
      }
      assignedTo = assignedToUserId;
    }

    // Check if user has enough balance for task amount
    if (amount && amount > 0) {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.totalEarnings < amount) {
        return res.status(400).json({
          success: false,
          message: "You don't have enough balance to create this task",
        });
      }

      // Deduct amount from user's totalEarnings
      user.totalEarnings -= amount;
      await user.save();
    }

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo,
      assignedToEmail: assignedToEmail || "",
      amount: amount || 0,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pending",
      createdAt: new Date(),
    };

    team.tasks.push(newTask);
    
    // Add system message to chat about task creation
    const systemMessage = {
      sender: userId,
      message: `📋 New task created: "${newTask.title}"${newTask.amount > 0 ? ` ($${newTask.amount})` : ''}${newTask.assignedToEmail ? ` - Assigned to: ${newTask.assignedToEmail}` : ''}`,
      timestamp: new Date(),
      isAdmin: true,
      isSystemMessage: true
    };
    
    team.chat.push(systemMessage);
    await team.save();

    // Populate team data for response
    const populatedTeam = await TeamHub.findById(teamId)
      .populate('chat.sender', 'username email profilePicture')
      .populate('members.user', 'username email profilePicture')
      .populate('createdBy', 'username email profilePicture');

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error creating team task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating task",
      error: error.message,
    });
  }
};

export const updateTeamTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(member => 
      member.user.toString() === userId.toString() || member.user === userId
    );
    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;

    if (!isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this team",
      });
    }

    const task = team.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const previousStatus = task.status;

    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
        
        // Handle earning distribution when task is completed
        if (task.amount && task.amount > 0 && task.assignedTo && previousStatus !== 'completed') {
          try {
            // Get assigned user
            const assignedUser = await UserModel.findById(task.assignedTo);
            if (assignedUser) {
              // Fetch task completion tax from SiteSettings (default 2%)
              let taskCompletionTax = 2;
              const settings = await SiteSettings.findOne();
              if (settings && typeof settings.taskCompletionTax === 'number') {
                taskCompletionTax = settings.taskCompletionTax;
              }

              // Calculate tax and net amount
              const taxAmount = (task.amount * taskCompletionTax) / 100;
              const netAmount = task.amount - taxAmount;

              // Update assigned user's earnings
              assignedUser.totalEarnings += netAmount;
              
              // Add earning log
              if (!assignedUser.EarningLogs) {
                assignedUser.EarningLogs = [];
              }
              assignedUser.EarningLogs.push({
                amount: netAmount,
                date: new Date(),
              });

              await assignedUser.save();
            }
          } catch (earningError) {
            console.error("Error updating user earnings:", earningError);
          }
        }
        
        // Add system message to chat about task completion
        const systemMessage = {
          sender: userId,
          message: `✅ Task completed: "${task.title}"${task.amount > 0 && task.assignedTo ? ` - Payment processed` : ''}`,
          timestamp: new Date(),
          isAdmin: true,
          isSystemMessage: true
        };
        
        team.chat.push(systemMessage);
      }
    }

    await team.save();

    // Populate team data for response
    const populatedTeam = await TeamHub.findById(teamId)
      .populate('chat.sender', 'username email profilePicture')
      .populate('members.user', 'username email profilePicture')
      .populate('createdBy', 'username email profilePicture');

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: task,
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error updating team task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating task",
      error: error.message,
    });
  }
};

export const getUserTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await TeamHub.find({
      $or: [
        { createdBy: userId },
        { "members.user": userId }
      ]
    }).populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Teams fetched successfully",
      teams: teams,
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching teams",
      error: error.message,
    });
  }
};

export const updateTeamSettings = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only creator and admins can update settings
    const isCreator = team.createdBy.toString() === userId.toString() || team.createdBy === userId;
    const isAdmin = team.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'admin'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only team creator and admins can update settings",
      });
    }

    // Update settings
    if (settings) {
      team.settings = { ...team.settings, ...settings };
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: "Team settings updated successfully",
      team: team,
    });
  } catch (error) {
    console.error("Error updating team settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating team settings",
      error: error.message,
    });
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await TeamHub.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member of the team
    const memberIndex = team.members.findIndex(member => 
      member.user.toString() === userId.toString() || member.user === userId
    );

    if (memberIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this team",
      });
    }

    // Creator cannot leave the team
    if (team.createdBy.toString() === userId.toString() || team.createdBy === userId) {
      return res.status(403).json({
        success: false,
        message: "Team creator cannot leave the team. Please transfer ownership or delete the team instead.",
      });
    }

    // Remove the member from the team
    team.members.splice(memberIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the team",
    });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while leaving team",
      error: error.message,
    });
  }
};
