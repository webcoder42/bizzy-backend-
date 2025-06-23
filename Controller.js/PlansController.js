import PlanSxhemaModel from "../Model/PlanSxhemaModel.js";

// Create a new plan
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      maxprojectPerDay,
      isActive,
      planType,
      planPurpose, // New field added here
    } = req.body;

    // Validation: Ensure planPurpose is provided
    if (!planPurpose || !["billing", "team"].includes(planPurpose)) {
      return res.status(400).json({
        message:
          "Invalid or missing planPurpose. It must be either 'billing' or 'team'.",
      });
    }

    const newPlan = new PlanSxhemaModel({
      name,
      description,
      price,
      duration,
      maxprojectPerDay,
      isActive,
      planType: planType || "paid",
      planPurpose, // Add planPurpose here
    });

    const savedPlan = await newPlan.save();

    res
      .status(201)
      .json({ message: "Plan created successfully", plan: savedPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating plan", error: error.message });
  }
};

// Get all plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await PlanSxhemaModel.find();
    res.status(200).json(plans);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching plans", error: error.message });
  }
};

// Get single plan by ID
export const getSinglePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlanSxhemaModel.findById(id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.status(200).json(plan);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching plan", error: error.message });
  }
};

// Update a plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planPurpose } = req.body;

    // Optional: Validate planPurpose if it's being updated
    if (planPurpose && !["billing", "team"].includes(planPurpose)) {
      return res.status(400).json({
        message: "Invalid planPurpose. It must be either 'billing' or 'team'.",
      });
    }

    const updateData = {
      ...req.body,
      planType: req.body.planType || "paid",
    };

    const updatedPlan = await PlanSxhemaModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res
      .status(200)
      .json({ message: "Plan updated successfully", plan: updatedPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating plan", error: error.message });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPlan = await PlanSxhemaModel.findByIdAndDelete(id);
    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting plan", error: error.message });
  }
};

// Get all team-specific plans
export const getTeamPlans = async (req, res) => {
  try {
    // Find only those plans where planPurpose is "team"
    const teamPlans = await PlanSxhemaModel.find({ planPurpose: "team" });

    res.status(200).json({
      message: "Team plans fetched successfully",
      plans: teamPlans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching team plans",
      error: error.message,
    });
  }
};
