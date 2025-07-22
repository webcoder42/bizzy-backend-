import express from "express";
import { requireSignIn } from "./../middleware/UserMiddleware.js";
import { isAdmin } from "./../middleware/UserMiddleware.js";
import {
  connectPayoutAccount,
  submitTaxDetails,
  getUserData,
  getConnectedAccounts,
  getTaxDetails,
  deleteConnectedAccount,
  getPayoutSummary,
  requestWithdrawal,
  getWithdrawalHistory,
  cancelWithdrawal,
  getAllWithdrawals,
  updateWithdrawalStatus,
  getWithdrawalStats,
  deleteWithdrawal,
} from "../Controller.js/PayOutController.js";

const router = express.Router();

// Get user data (tax details and connected accounts)
router.get("/user-data", requireSignIn, getUserData);

// Get payout summary (earnings, total payout, pending, etc.)
router.get("/summary", requireSignIn, getPayoutSummary);

// Get connected accounts only
router.get("/connected-accounts", requireSignIn, getConnectedAccounts);

// Get tax details only
router.get("/tax-details", requireSignIn, getTaxDetails);

// Get withdrawal history
router.get("/withdrawals", requireSignIn, getWithdrawalHistory);

// Submit/Update tax details
router.post("/tax-details", requireSignIn, submitTaxDetails);

// Connect payout account
router.post("/connect-account", requireSignIn, connectPayoutAccount);

// Request withdrawal
router.post("/request-withdrawal", requireSignIn, requestWithdrawal);

// Cancel withdrawal request
router.delete("/withdrawals/:withdrawalId", requireSignIn, cancelWithdrawal);

// Delete connected account
router.delete(
  "/connected-account/:accountIndex",
  requireSignIn,
  deleteConnectedAccount
);

// ADMIN: Get all withdrawals
router.get("/admin/withdrawals", requireSignIn, isAdmin, getAllWithdrawals);

// ADMIN: Get withdrawal stats
router.get(
  "/admin/withdrawals/stats",
  requireSignIn,
  isAdmin,
  getWithdrawalStats
);

// ADMIN: Update withdrawal status
router.put(
  "/admin/withdrawals/:payoutId/:withdrawalId",
  requireSignIn,
  isAdmin,
  updateWithdrawalStatus
);

// ADMIN: Delete withdrawal
router.delete(
  "/admin/withdrawals/:payoutId/:withdrawalId",
  requireSignIn,
  isAdmin,
  deleteWithdrawal
);

export default router;
