// Plan Purchase Controller (Updated to handle plan expiration)

import Stripe from "stripe";
import PlanSxhemaModel from "../Model/PlanSxhemaModel.js";
import UserModel from "../Model/UserModel.js";
import PlanPurchaseModel from "../Model/PlanPurchaseModel.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPlanPurchase = async (req, res) => {
  try {
    const { planId, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    if (!planId || !paymentMethod)
      return res
        .status(400)
        .json({ message: "Plan ID and payment method are required." });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = await PlanSxhemaModel.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Restrict free plan multiple activation
    if (plan.planType === "free") {
      const existingFreePlan = await PlanPurchaseModel.findOne({
        user: userId,
        plan: planId,
      });
      if (existingFreePlan) {
        return res.status(400).json({
          message: "You have already activated this free plan.",
        });
      }

      // Expire all previous plans before activating new free plan
      await PlanPurchaseModel.updateMany(
        { user: userId, status: { $ne: "expired" } },
        { $set: { status: "expired" } }
      );

      const purchase = new PlanPurchaseModel({
        user: userId,
        plan: planId,
        amount: 0,
        paymentMethod: "free",
        status: "approved",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      });

      await purchase.save();

      return res.status(201).json({
        message: "Free plan activated successfully",
        purchase,
      });
    }

    // Handle Paid Plan with Stripe only
    if (paymentMethod !== "card") {
      return res
        .status(400)
        .json({ message: "Only Card payment is supported." });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
      },
      payment_method: paymentDetails.paymentMethodId,
      confirm: true,
      return_url:
        "http://localhost:3000/BiZy/user/dashboard/client/planmanagement",
    });

    if (paymentIntent.status === "succeeded") {
      // Expire all previous plans before creating new one
      await PlanPurchaseModel.updateMany(
        { user: userId, status: { $ne: "expired" } },
        { $set: { status: "expired" } }
      );

      const purchase = new PlanPurchaseModel({
        user: userId,
        plan: planId,
        amount: plan.price,
        paymentMethod: "card",
        paymentDetails: {
          paymentIntentId: paymentIntent.id,
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
          cardBrand:
            paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand,
          last4:
            paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4,
          country:
            paymentIntent.charges?.data[0]?.billing_details?.address?.country,
          additionalDetails: paymentIntent,
        },
        status: "approved",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      });

      await purchase.save();

      return res.status(201).json({
        message: "Plan purchased successfully",
        purchase,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
      });
    } else {
      // If payment requires additional action, return the client secret
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (err) {
    console.error("Plan purchase error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const getMyPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all plan purchases by the user, sorted by latest first
    const myPlans = await PlanPurchaseModel.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by latest first
      .populate("plan");

    if (!myPlans || myPlans.length === 0) {
      return res.status(404).json({
        message: "No plans found for this user.",
        plans: [],
        currentPlan: null,
      });
    }

    // Process plans to add additional information
    const processedPlans = myPlans.map((plan) => {
      const now = new Date();
      const endDate = new Date(plan.endDate);

      // Set time to start of day for accurate date comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const planEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      const isExpired = plan.status === "expired" || planEndDate < today;

      return {
        ...plan._doc,
        isExpired,
        isCurrent: plan.status === "approved" && !isExpired,
      };
    });

    // Find the current active plan
    const currentPlan = processedPlans.find((plan) => plan.isCurrent);

    res.status(200).json({
      message: "Plans fetched successfully.",
      plans: processedPlans,
      currentPlan: currentPlan || null,
    });
  } catch (err) {
    console.error("Error fetching user plans:", err);
    res.status(500).json({
      message: "Internal server error while fetching user's plans.",
      error: err.message,
    });
  }
};

export const getLatestPlanForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the most recent approved plan purchase by the user
    const latestPlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved", // Only get approved plans
    })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .populate("plan");

    if (!latestPlan) {
      return res.status(404).json({
        success: false,
        message: "No active plan found for this user.",
        hasPlan: false,
      });
    }

    // Check if the plan has expired (endDate is in the past)
    const now = new Date();
    const endDate = new Date(latestPlan.endDate);

    // Set time to start of day for accurate date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const planEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    const isExpired = planEndDate < today;
    const status = isExpired ? "expired" : latestPlan.status;

    // Calculate remaining days more accurately
    const remainingDays = isExpired
      ? 0
      : Math.max(0, Math.ceil((planEndDate - today) / (1000 * 60 * 60 * 24)));

    // Format the response with additional useful information
    const responseData = {
      ...latestPlan._doc,
      isExpired,
      status,
      remainingDays,
    };

    res.status(200).json({
      success: true,
      message: "Latest plan retrieved successfully",
      hasPlan: true,
      plan: responseData,
      isActive: status === "approved" && !isExpired,
    });
  } catch (err) {
    console.error("Error fetching latest plan:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching latest plan",
      error: err.message,
    });
  }
};

export const addFunds = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    // Check minimum amount
    if (!amount || amount < 10) {
      return res.status(400).json({ message: "Minimum amount is $10." });
    }

    // Only card payments are supported
    if (paymentMethod !== "card") {
      return res
        .status(400)
        .json({ message: "Only card payments are supported." });
    }

    // Validate user
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        purpose: "add_funds",
      },
      payment_method: paymentDetails.paymentMethodId,
      confirm: true,
      return_url:
        "http://localhost:3000/BiZy/user/dashboard/client/fundsummary",
    });

    if (paymentIntent.status === "succeeded") {
      // Update user totalEarnings with 90% of the amount
      const amountToAdd = amount * 0.9; // 90% of the amount
      user.totalEarnings = (user.totalEarnings || 0) + amountToAdd;
      await user.save();

      return res.status(200).json({
        message: "Funds added successfully.",
        amountAdded: amountToAdd,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
      });
    } else {
      // Return client secret if action required
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (err) {
    console.error("Add funds error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const teamPlanPurchase = async (req, res) => {
  try {
    const { planId, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    if (!planId || !paymentMethod)
      return res
        .status(400)
        .json({ message: "Plan ID and payment method are required." });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = await PlanSxhemaModel.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Restrict free plan multiple activation
    if (plan.planType === "free") {
      const existingFreePlan = await PlanPurchaseModel.findOne({
        user: userId,
        plan: planId,
      });
      if (existingFreePlan) {
        return res.status(400).json({
          message: "You have already activated this free plan.",
        });
      }

      // Expire all previous plans before activating new free plan
      await PlanPurchaseModel.updateMany(
        { user: userId, status: { $ne: "expired" } },
        { $set: { status: "expired" } }
      );

      const purchase = new PlanPurchaseModel({
        user: userId,
        plan: planId,
        amount: 0,
        paymentMethod: "free",
        status: "approved",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      });

      await purchase.save();

      return res.status(201).json({
        message: "Free plan activated successfully",
        purchase,
      });
    }

    // Handle Paid Plan with Stripe only
    if (paymentMethod !== "card") {
      return res
        .status(400)
        .json({ message: "Only Card payment is supported." });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
      },
      payment_method: paymentDetails.paymentMethodId,
      confirm: true,
      return_url:
        "http://localhost:3000/BiZy/user/dashboard/client/planmanagement",
    });

    if (paymentIntent.status === "succeeded") {
      // Expire all previous plans before creating new one
      await PlanPurchaseModel.updateMany(
        { user: userId, status: { $ne: "expired" } },
        { $set: { status: "expired" } }
      );

      const purchase = new PlanPurchaseModel({
        user: userId,
        plan: planId,
        amount: plan.price,
        paymentMethod: "card",
        paymentDetails: {
          paymentIntentId: paymentIntent.id,
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
          cardBrand:
            paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand,
          last4:
            paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4,
          country:
            paymentIntent.charges?.data[0]?.billing_details?.address?.country,
          additionalDetails: paymentIntent,
        },
        status: "approved",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      });

      await purchase.save();

      return res.status(201).json({
        message: "Plan purchased successfully",
        purchase,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
      });
    } else {
      // If payment requires additional action, return the client secret
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (err) {
    console.error("Plan purchase error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
// Add this to your PlanPurchaseController.js
export const getMyTeamPlans = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all team plan purchases by the user, sorted by latest first
    const purchasedPlans = await PlanPurchaseModel.find({ user: userId })
      .populate({
        path: "plan",
        match: { planPurpose: "team" }, // Only include team plans
      })
      .sort({ createdAt: -1 });

    // Filter out any null plans (from the match condition)
    const filteredPlans = purchasedPlans.filter(
      (purchase) => purchase.plan !== null
    );

    // Process plans to add additional information
    const processedPlans = filteredPlans.map((purchase) => {
      const now = new Date();
      const endDate = new Date(purchase.endDate);

      // Set time to start of day for accurate date comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const planEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      const isExpired = purchase.status === "expired" || planEndDate < today;

      // Calculate remaining days more accurately
      const remainingDays = isExpired
        ? 0
        : Math.max(0, Math.ceil((planEndDate - today) / (1000 * 60 * 60 * 24)));

      return {
        ...purchase._doc,
        isExpired,
        isActive: purchase.status === "approved" && !isExpired,
        remainingDays,
      };
    });

    res.status(200).json({
      success: true,
      message: "Purchased team plans retrieved successfully",
      plans: processedPlans,
      count: processedPlans.length,
    });
  } catch (err) {
    console.error("Error fetching purchased team plans:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching purchased team plans",
      error: err.message,
    });
  }
};
