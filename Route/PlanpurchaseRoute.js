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
  getAllPlanPurchases
} from "../Controller.js/PlanPurchaseController.js";
import { requireSignIn } from "../middleware/UserMiddleware.js";

const router = express.Router();

router.post("/purchase", requireSignIn, createPlanPurchase);

router.post("/team-purchase", requireSignIn, teamPlanPurchase);

router.get("/my-plan", requireSignIn, getMyPlan);

router.get("/my-latest-plan", requireSignIn, getLatestPlanForUser);

router.post("/add-funds", requireSignIn, addFunds);
router.get("/my-team-plans", requireSignIn, getMyTeamPlans);
router.get("/total-purchase-amount", requireSignIn, getTotalPlanPurchaseAmount);
router.get("/monthly-purchase-amounts", requireSignIn, getMonthlyPlanPurchaseAmounts);
router.get("/alltime-monthly-purchases", requireSignIn, getAllTimeMonthlyPurchases);
router.get("/all-purchase", requireSignIn, getAllPlanPurchases);

export default router;
