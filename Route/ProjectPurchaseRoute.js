import express from 'express';
import {
  createProjectPurchase,
  createDirectProjectPurchase,
  createWalletProjectPurchase,
  createCardProjectPurchase,
  confirmPayment,
  paymentCallback,
  getBuyerPurchases,
  getSellerSales,
  getPurchaseDetails,
  addPurchaseMessage,
  updateDeliveryStatus,
  addRating,
  rateDeliveredOrder,
  cancelPurchase,
  checkUserOrders,
  createTestOrder,
  checkUserProjects,
  getAllUserOrders,
  submitProject,
  getAllOrdersForAdmin,
  getAllReviewsForAdmin,
  updateOrderStatusByAdmin,
  approveReviewByAdmin,
  rejectReviewByAdmin
} from '../Controller.js/ProjectPurchaseController.js';
import { requireSignIn, isAdmin } from '../middleware/UserMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireSignIn);

// Create a new project purchase with payment
router.post('/create', createProjectPurchase);

// Create a direct project purchase (deduct from balance)
router.post('/create-direct', createDirectProjectPurchase);

// Create a wallet-based project purchase (deduct from earnings)
router.post('/create-wallet', createWalletProjectPurchase);

// Create a card-based project purchase (using Stripe)
router.post('/create-card', createCardProjectPurchase);

// Confirm payment
router.post('/confirm-payment', confirmPayment);

// PayTabs payment callback
router.post('/payment-callback', paymentCallback);

// Get buyer's purchases
router.get('/buyer-purchases', getBuyerPurchases);

// Get seller's sales
router.get('/seller-sales', getSellerSales);

// Get specific purchase details
router.get('/purchase/:purchaseId', getPurchaseDetails);

// Add message to purchase
router.post('/purchase/:purchaseId/message', addPurchaseMessage);

// Update delivery status (seller only)
router.put('/purchase/:purchaseId/delivery-status', updateDeliveryStatus);

// Add rating and review (buyer only)
router.post('/purchase/:purchaseId/rating', addRating);

// Rate delivered order (buyer only)
router.post('/rate-order', rateDeliveredOrder);

// Cancel purchase (buyer only)
router.put('/purchase/:purchaseId/cancel', cancelPurchase);

// Check user orders (for debugging)
router.get('/check-user-orders', checkUserOrders);

// Create test order (for debugging)
router.post('/create-test-order', createTestOrder);

// Check user projects (for debugging)
router.get('/check-user-projects', checkUserProjects);

// Get all user orders (both as buyer and seller)
router.get('/all-user-orders', getAllUserOrders);

// Submit project for review
router.post('/purchase/:purchaseId/submit', submitProject);

// Admin routes
console.log('Registering ProjectPurchase admin routes...');
console.log('Admin orders route: /admin/orders');
console.log('Admin reviews route: /admin/reviews');
console.log('Admin status update route: /admin/purchase/:purchaseId/status');
console.log('Admin review approve route: /admin/reviews/:reviewId/approve');
console.log('Admin review reject route: /admin/reviews/:reviewId/reject');
router.get('/admin/orders', requireSignIn, isAdmin, getAllOrdersForAdmin);
router.get('/admin/reviews', requireSignIn, isAdmin, getAllReviewsForAdmin);
router.put('/admin/purchase/:purchaseId/status', requireSignIn, isAdmin, updateOrderStatusByAdmin);
router.put('/admin/reviews/:reviewId/approve', requireSignIn, isAdmin, approveReviewByAdmin);
router.put('/admin/reviews/:reviewId/reject', requireSignIn, isAdmin, rejectReviewByAdmin);

export default router;
