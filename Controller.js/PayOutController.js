import PayOutModel from "../Model/PayOutModel.js";
import UserModel from "../Model/UserModel.js";
import SiteSettings from "../Model/SiteSettingsModel.js";

// Get user data (tax details and connected accounts)
export const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await PayOutModel.findOne({ user: userId });

    if (!userData) {
      return res.status(200).json({
        taxDetails: [],
        payoutAccounts: [],
        withdrawals: [],
      });
    }

    res.status(200).json({
      taxDetails: userData.taxDetails || [],
      payoutAccounts: userData.payoutAccounts || [],
      withdrawals: userData.withdrawals || [],
    });
  } catch (error) {
    console.error("Get user data error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user earnings and payout summary
export const getPayoutSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's total earnings
    const user = await UserModel.findById(userId).select("totalEarnings");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get payout data
    const payoutData = await PayOutModel.findOne({ user: userId });
    const withdrawals = payoutData?.withdrawals || [];

    // Calculate totals
    const totalPayout = withdrawals.reduce((sum, withdrawal) => {
      if (withdrawal.status === "paid") {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    const pendingPayout = withdrawals.reduce((sum, withdrawal) => {
      if (
        withdrawal.status === "pending" ||
        withdrawal.status === "processing"
      ) {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    // Get current month's payout
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthPayout = withdrawals.reduce((sum, withdrawal) => {
      if (
        withdrawal.status === "paid" &&
        new Date(withdrawal.processedAt) >= currentMonth
      ) {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    // Fetch dynamic cashoutTax from SiteSettings
    let cashoutTax = 10; // fallback default
    const settings = await SiteSettings.findOne();
    if (settings && typeof settings.cashoutTax === "number") {
      cashoutTax = settings.cashoutTax;
    }

    res.status(200).json({
      totalEarnings: user.totalEarnings || 0,
      totalPayout,
      thisMonthPayout,
      pendingPayout,
      availableForWithdrawal:
        (user.totalEarnings || 0) - totalPayout - pendingPayout,
      cashoutTax, // send to frontend
    });
  } catch (error) {
    console.error("Get payout summary error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Request withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, accountIndex } = req.body;

    // Fetch settings for minimum amount and tax
    let minimumAmount = 500; // fallback default
    let cashoutTax = 10; // fallback default
    const settings = await SiteSettings.findOne();
    if (settings) {
      if (typeof settings.minimumCashoutAmount === "number") {
        minimumAmount = settings.minimumCashoutAmount;
      }
      if (typeof settings.cashoutTax === "number") {
        cashoutTax = settings.cashoutTax;
      }
    }

    // Validate amount
    if (!amount || amount < minimumAmount) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is $${minimumAmount}`,
      });
    }

    // Get user data
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get payout data
    let payoutData = await PayOutModel.findOne({ user: userId });
    if (!payoutData) {
      payoutData = new PayOutModel({ user: userId });
    }

    // Check if user has tax details
    if (!payoutData.taxDetails || payoutData.taxDetails.length === 0) {
      return res.status(400).json({
        error: "Please submit your tax details before requesting withdrawal",
      });
    }

    // Check if user has connected accounts
    if (!payoutData.payoutAccounts || payoutData.payoutAccounts.length === 0) {
      return res.status(400).json({
        error: "Please connect a bank account before requesting withdrawal",
      });
    }

    // Validate account index
    const accountIdx = parseInt(accountIndex);
    if (accountIdx < 0 || accountIdx >= payoutData.payoutAccounts.length) {
      return res.status(400).json({
        error: "Invalid account selected",
      });
    }

    // Calculate total already withdrawn and pending
    const totalWithdrawn = payoutData.withdrawals.reduce((sum, withdrawal) => {
      if (withdrawal.status === "paid") {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    const totalPending = payoutData.withdrawals.reduce((sum, withdrawal) => {
      if (
        withdrawal.status === "pending" ||
        withdrawal.status === "processing"
      ) {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    const availableForWithdrawal =
      user.totalEarnings - totalWithdrawn - totalPending;

    // Check if user has enough balance
    if (amount > availableForWithdrawal) {
      return res.status(400).json({
        error: `Insufficient balance. Available for withdrawal: $${availableForWithdrawal.toFixed(
          2
        )}`,
      });
    }



    // Calculate tax (dynamic)
    const taxAmount = (amount * cashoutTax) / 100;
    const netAmount = amount - taxAmount;

    // Create withdrawal request
    const withdrawalRequest = {
      amount: amount,
      netAmount: netAmount,
      taxAmount: taxAmount,
      status: "pending",
      requestedAt: new Date(),
      accountIndex: accountIdx,
      accountDetails: payoutData.payoutAccounts[accountIdx],
    };

    payoutData.withdrawals.push(withdrawalRequest);
    await payoutData.save();

    res.status(200).json({
      message: "Withdrawal request submitted successfully",
      withdrawal: withdrawalRequest,
      summary: {
        requestedAmount: amount,
        taxAmount: taxAmount,
        netAmount: netAmount,
        availableBalance: availableForWithdrawal - amount,
        cashoutTax, // send to frontend for confirmation
      },
    });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get withdrawal history
export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const payoutData = await PayOutModel.findOne({ user: userId });
    if (!payoutData) {
      return res.status(200).json({ withdrawals: [] });
    }

    // Sort withdrawals by requestedAt (newest first)
    const sortedWithdrawals = payoutData.withdrawals.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
    );

    res.status(200).json({
      withdrawals: sortedWithdrawals,
    });
  } catch (error) {
    console.error("Get withdrawal history error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get withdrawal history for any user (admin only)
export const getUserWithdrawals = async (req, res) => {
  try {
    // Check if the requester is an admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { userId } = req.params;

    // Get user's payout data
    const payoutData = await PayOutModel.findOne({ user: userId });
    if (!payoutData) {
      return res.status(200).json({ 
        success: true,
        withdrawals: [],
        message: "No withdrawal history found for this user"
      });
    }

    // Sort withdrawals by requestedAt (newest first)
    const sortedWithdrawals = payoutData.withdrawals.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
    );

    // Calculate withdrawal statistics
    const totalWithdrawn = sortedWithdrawals
      .filter(w => w.status === "paid")
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawals = sortedWithdrawals
      .filter(w => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + w.amount, 0);

    res.status(200).json({
      success: true,
      withdrawals: sortedWithdrawals,
      stats: {
        totalWithdrawn,
        pendingWithdrawals,
        totalRequests: sortedWithdrawals.length
      }
    });
  } catch (error) {
    console.error("Get user withdrawals error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

// Cancel withdrawal request (only if pending)
export const cancelWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { withdrawalId } = req.params;

    const payoutData = await PayOutModel.findOne({ user: userId });
    if (!payoutData) {
      return res.status(404).json({ error: "No payout data found" });
    }

    // Find withdrawal by ID - handle both real _id and generated IDs
    let withdrawal = null;
    
    // First try to find by real _id (for new records)
    withdrawal = payoutData.withdrawals.find(w => w._id && w._id.toString() === withdrawalId);
    
    // If not found, try to find by generated ID (for old records)
    if (!withdrawal) {
      const [payoutIdPart, indexPart] = withdrawalId.split('_');
      if (payoutIdPart === payoutData._id.toString() && indexPart) {
        const index = parseInt(indexPart);
        if (!isNaN(index) && index >= 0 && index < payoutData.withdrawals.length) {
          withdrawal = payoutData.withdrawals[index];
        }
      }
    }
    
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        error: "Only pending withdrawal requests can be cancelled",
      });
    }

    // Find and remove the withdrawal - handle both real _id and generated IDs
    let withdrawalIndex = -1;
    
    // First try to find by real _id (for new records)
    const withdrawalToRemove = payoutData.withdrawals.find(w => w._id && w._id.toString() === withdrawalId);
    if (withdrawalToRemove) {
      withdrawalIndex = payoutData.withdrawals.indexOf(withdrawalToRemove);
    } else {
      // Try to find by generated ID (for old records)
      const [payoutIdPart, indexPart] = withdrawalId.split('_');
      if (payoutIdPart === payoutData._id.toString() && indexPart) {
        const index = parseInt(indexPart);
        if (!isNaN(index) && index >= 0 && index < payoutData.withdrawals.length) {
          withdrawalIndex = index;
        }
      }
    }
    
    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }
    
    // Remove the withdrawal by index
    payoutData.withdrawals.splice(withdrawalIndex, 1);
    await payoutData.save();

    res.status(200).json({
      message: "Withdrawal request cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel withdrawal error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const submitTaxDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, taxIdentificationNumber, country, taxDocumentUrl } =
      req.body;

    // Validate input
    if (!fullName || !taxIdentificationNumber || !country) {
      return res
        .status(400)
        .json({ error: "Please fill all required fields." });
    }

    // Find existing withdrawal doc
    let request = await PayOutModel.findOne({ user: userId });

    // Create new document if doesn't exist
    if (!request) {
      request = new PayOutModel({ user: userId });
    }

    // If user already has tax details, update them instead of adding new ones
    if (request.taxDetails && request.taxDetails.length > 0) {
      // Update the first (and only) tax detail entry
      request.taxDetails[0] = {
        fullName,
        taxIdentificationNumber,
        country,
        taxDocumentUrl,
      };
    } else {
      // Add new tax details if none exist
      request.taxDetails.push({
        fullName,
        taxIdentificationNumber,
        country,
        taxDocumentUrl,
      });
    }

    await request.save();

    res.status(200).json({
      message: "Tax details updated successfully.",
      taxDetails: request.taxDetails,
    });
  } catch (err) {
    console.error("Tax submission error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller: connectPayoutAccount.js

export const connectPayoutAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      withdrawalMethod,
      accountHolderName,
      accountNumber,
      routingNumber,
      swiftCode,
      country,
      currency,
      bankAddress,
    } = req.body;

    // Input validation
    if (!accountHolderName || !accountNumber || !country) {
      return res
        .status(400)
        .json({ error: "Please fill all required fields." });
    }

    // Construct payout account object
    const newAccount = {
      withdrawalMethod: withdrawalMethod || "manual",
      payoneer: {
        accountHolderName,
        accountNumber,
        routingNumber,
        swiftCode,
        country,
        currency: currency || "USD",
        bankAddress,
      },
    };

    // Check if user already has a payout document
    let payoutDoc = await PayOutModel.findOne({ user: userId });

    if (!payoutDoc) {
      // Create new document with this account
      payoutDoc = new PayOutModel({
        user: userId,
        payoutAccounts: [newAccount],
      });
    } else {
      // Push new account into array
      payoutDoc.payoutAccounts.push(newAccount);
    }

    await payoutDoc.save();

    res.status(200).json({
      message: "Bank account connected successfully.",
      payoutAccounts: payoutDoc.payoutAccounts,
    });
  } catch (error) {
    console.error("Connect payout account error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get connected accounts only
export const getConnectedAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await PayOutModel.findOne({ user: userId });

    if (!userData) {
      return res.status(200).json({
        payoutAccounts: [],
      });
    }

    res.status(200).json({
      payoutAccounts: userData.payoutAccounts || [],
    });
  } catch (error) {
    console.error("Get connected accounts error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get tax details only
export const getTaxDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await PayOutModel.findOne({ user: userId });

    if (!userData) {
      return res.status(200).json({
        taxDetails: [],
      });
    }

    res.status(200).json({
      taxDetails: userData.taxDetails || [],
    });
  } catch (error) {
    console.error("Get tax details error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete connected account
export const deleteConnectedAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountIndex } = req.params;

    const userData = await PayOutModel.findOne({ user: userId });

    if (!userData) {
      return res.status(404).json({ error: "User data not found" });
    }

    if (!userData.payoutAccounts || userData.payoutAccounts.length === 0) {
      return res.status(404).json({ error: "No connected accounts found" });
    }

    const index = parseInt(accountIndex);
    if (index < 0 || index >= userData.payoutAccounts.length) {
      return res.status(400).json({ error: "Invalid account index" });
    }

    // Remove the account at the specified index
    userData.payoutAccounts.splice(index, 1);
    await userData.save();

    res.status(200).json({
      message: "Account deleted successfully.",
      payoutAccounts: userData.payoutAccounts,
    });
  } catch (error) {
    console.error("Delete connected account error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getAllWithdrawals = async (req, res) => {
  try {
    // Get all payouts with populated user data
    const payouts = await PayOutModel.find().populate({
      path: "user",
      select: "username email Fullname profileImage",
    });

    // Extract and format withdrawals data
    const withdrawals = payouts.flatMap((payout) =>
      payout.withdrawals
        .map((withdrawal, index) => {
          const generatedId = withdrawal._id || `${payout._id}_${index}`;
          console.log(`Withdrawal ${index}:`, {
            hasRealId: !!withdrawal._id,
            realId: withdrawal._id ? withdrawal._id.toString() : 'none',
            generatedId: generatedId,
            payoutId: payout._id.toString()
          });
          return {
            ...withdrawal.toObject(),
            _id: generatedId, // Generate ID for old records
            user: payout.user,
            payoutId: payout._id,
          };
        })
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    );

    res.status(200).json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error("Get all withdrawals error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch withdrawals",
    });
  }
};

// ADMIN: Update withdrawal status
// ADMIN: Update withdrawal status - Fixed version
// Robust updateWithdrawalStatus controller
export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { payoutId, withdrawalId } = req.params;
    const { status } = req.body;

    // Validate IDs
    if (!payoutId || !withdrawalId) {
      return res.status(400).json({
        success: false,
        error: "Both payoutId and withdrawalId are required",
      });
    }

    // Validate status
    const validStatuses = ["pending", "processing", "paid", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value",
      });
    }

    const payout = await PayOutModel.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        success: false,
        error: "Payout record not found",
      });
    }

    // Find withdrawal by ID - handle both real _id and generated IDs
    let withdrawal = null;
    
    console.log('Looking for withdrawalId:', withdrawalId);
    console.log('Payout ID:', payout._id.toString());
    console.log('Number of withdrawals in payout:', payout.withdrawals.length);
    
    // First try to find by real _id (for new records)
    withdrawal = payout.withdrawals.find(w => w._id && w._id.toString() === withdrawalId);
    
    // If not found, try to find by generated ID (for old records)
    if (!withdrawal) {
      const [payoutIdPart, indexPart] = withdrawalId.split('_');
      console.log('Split withdrawalId:', { payoutIdPart, indexPart });
      if (payoutIdPart === payout._id.toString() && indexPart) {
        const index = parseInt(indexPart);
        console.log('Parsed index:', index);
        if (!isNaN(index) && index >= 0 && index < payout.withdrawals.length) {
          withdrawal = payout.withdrawals[index];
          console.log('Found withdrawal by index:', withdrawal);
        }
      }
    }
    
    if (!withdrawal) {
      console.log('Withdrawal not found. Available withdrawal IDs:', payout.withdrawals.map((w, i) => ({
        index: i,
        realId: w._id ? w._id.toString() : 'none',
        generatedId: `${payout._id}_${i}`
      })));
      return res.status(404).json({
        success: false,
        error: "Withdrawal not found in this payout record",
      });
    }

    // Update status
    withdrawal.status = status;

    // Set processedAt if status is paid
    if (status === "paid" && !withdrawal.processedAt) {
      withdrawal.processedAt = new Date();
    }

    await payout.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal status updated successfully",
      data: {
        id: withdrawal._id || `${payout._id}_${payout.withdrawals.indexOf(withdrawal)}`,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt,
      },
    });
  } catch (error) {
    console.error("Update withdrawal status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update withdrawal status",
      details: error.message,
    });
  }
};

// ADMIN: Delete withdrawal
export const deleteWithdrawal = async (req, res) => {
  try {
    const { payoutId, withdrawalId } = req.params;

    const payout = await PayOutModel.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        success: false,
        error: "Payout record not found",
      });
    }

    // Find and remove the withdrawal - handle both real _id and generated IDs
    let withdrawalIndex = -1;
    
    // First try to find by real _id (for new records)
    const withdrawal = payout.withdrawals.find(w => w._id && w._id.toString() === withdrawalId);
    if (withdrawal) {
      withdrawalIndex = payout.withdrawals.indexOf(withdrawal);
    } else {
      // Try to find by generated ID (for old records)
      const [payoutIdPart, indexPart] = withdrawalId.split('_');
      if (payoutIdPart === payout._id.toString() && indexPart) {
        const index = parseInt(indexPart);
        if (!isNaN(index) && index >= 0 && index < payout.withdrawals.length) {
          withdrawalIndex = index;
        }
      }
    }
    
    if (withdrawalIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Withdrawal not found in this payout record",
      });
    }
    
    // Remove the withdrawal by index
    payout.withdrawals.splice(withdrawalIndex, 1);
    await payout.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal deleted successfully",
    });
  } catch (error) {
    console.error("Delete withdrawal error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete withdrawal",
    });
  }
};

// ADMIN: Get withdrawal stats
export const getWithdrawalStats = async (req, res) => {
  try {
    const payouts = await PayOutModel.find().populate("user");

    const allWithdrawals = payouts.flatMap((payout) => payout.withdrawals);

    const stats = {
      total: allWithdrawals.length,
      pending: allWithdrawals.filter((w) => w.status === "pending").length,
      processing: allWithdrawals.filter((w) => w.status === "processing")
        .length,
      paid: allWithdrawals.filter((w) => w.status === "paid").length,
      rejected: allWithdrawals.filter((w) => w.status === "rejected").length,
      totalAmount: allWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      totalTax: allWithdrawals.reduce((sum, w) => sum + w.taxAmount, 0),
      totalNet: allWithdrawals.reduce((sum, w) => sum + w.netAmount, 0),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get withdrawal stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get withdrawal stats",
    });
  }
};
