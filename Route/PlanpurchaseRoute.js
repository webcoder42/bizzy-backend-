import express from "express";
import {
  addFunds,
  createPlanPurchase,
  getLatestPlanForUser,
  getMyPlan,
  getMyTeamPlans,
  teamPlanPurchase,
} from "../Controller.js/PlanPurchaseController.js";
import { requireSignIn } from "../middleware/UserMiddleware.js";

const router = express.Router();

router.post("/purchase", requireSignIn, createPlanPurchase);

router.post("/team-purchase", requireSignIn, teamPlanPurchase);

router.get("/my-plan", requireSignIn, getMyPlan);

router.get("/my-latest-plan", requireSignIn, getLatestPlanForUser);

router.post("/add-funds", requireSignIn, addFunds);
router.get("/my-team-plans", requireSignIn, getMyTeamPlans);

export default router;
