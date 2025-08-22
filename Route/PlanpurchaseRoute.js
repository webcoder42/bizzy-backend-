import express from "express";
import {
  addFunds,
  createPlanPurchase,
  getLatestPlanForUser,
  getMyPlan,
  getMyTeamPlans,
  teamPlanPurchase,
  getTotalPlanPurchaseAmount,
  getMonthlyPlanPurchaseAmounts,
  getAllTimeMonthlyPurchases,
  getAllPlanPurchases,
  payTabsCallback,
  verifyPayTabsPayment,
  checkActivePlan
} from "../Controller.js/PlanPurchaseController.js";
import { requireSignIn } from "../middleware/UserMiddleware.js";

const router = express.Router();

router.post("/purchase", requireSignIn, createPlanPurchase);

router.get("/check-active-plan", requireSignIn, checkActivePlan);

router.post("/team-purchase", requireSignIn, teamPlanPurchase);

router.get("/my-plan", requireSignIn, getMyPlan);

router.get("/my-latest-plan", requireSignIn, getLatestPlanForUser);

router.post("/add-funds", requireSignIn, addFunds);
router.get("/my-team-plans", requireSignIn, getMyTeamPlans);
router.get("/total-purchase-amount", requireSignIn, getTotalPlanPurchaseAmount);
router.get("/monthly-purchase-amounts", requireSignIn, getMonthlyPlanPurchaseAmounts);
router.get("/alltime-monthly-purchases", requireSignIn, getAllTimeMonthlyPurchases);
router.get("/all-purchase", requireSignIn, getAllPlanPurchases);

// PayTabs routes
router.post("/paytabs-callback", payTabsCallback);
router.post("/verify-paytabs-payment", requireSignIn, verifyPayTabsPayment);

export default router;
