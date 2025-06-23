import axios from "axios";
import ChatBotModel from "../Model/ChatBotModel.js";
import {
  searchKnowledgeBase,
  getBizyInfo,
  BiZZyKnowledgeBase,
} from "../Helper/BiZyKnowledgeBase.js";

// Enhanced fee calculation helper
const calculateFees = (message) => {
  // Detect deposit amounts
  const depositMatch = message.match(/(deposit|deposited|added)\s*(\$?)(\d+)/i);
  if (depositMatch) {
    const amount = parseInt(depositMatch[3]);
    const fee = amount * 0.1;
    const received = amount - fee;
    return {
      reply: `💸 Deposit Calculation:\n\nYou deposited: $${amount}\n10% fee: $${fee.toFixed(
        2
      )}\nAmount added to balance: $${received.toFixed(
        2
      )}\n\nℹ️ Standard deposit fee is 10%`,
      isFinancial: true,
    };
  }

  // Detect cashout amounts
  const cashoutMatch = message.match(
    /(cashout|cash\s*out|withdraw)\s*(\$?)(\d+)/i
  );
  if (cashoutMatch) {
    const amount = parseInt(cashoutMatch[3]);
    const fee = amount * 0.15;
    const received = amount - fee;
    return {
      reply: `💰 Cashout Calculation:\n\nYou requested: $${amount}\n15% fee: $${fee.toFixed(
        2
      )}\nAmount you'll receive: $${received.toFixed(
        2
      )}\n\nℹ️ Standard cashout fee is 15%`,
      isFinancial: true,
    };
  }

  // General fee inquiry
  if (
    message.toLowerCase().includes("fee") ||
    message.toLowerCase().includes("charges")
  ) {
    const fees = BiZZyKnowledgeBase.fees;
    return {
      reply: `📊 BiZy Fee Structure:\n\n• Deposits: ${fees.deposits.percentage} fee\n• Cashouts: ${fees.cashouts.percentage} fee\n• Transactions: ${fees.transactions.percentage}\n\nExamples:\n- ${fees.deposits.example}\n- ${fees.cashouts.example}\n\n💡 Our fees are ${fees.transactions.note}`,
      isFinancial: true,
    };
  }

  return null;
};

// Enhanced knowledge base search
const getKnowledgeBasedResponse = (message) => {
  const searchTerm = message.toLowerCase();

  // Check for specific categories
  if (
    searchTerm.includes("what is bizy") ||
    searchTerm.includes("about bizy") ||
    searchTerm.includes("platform")
  ) {
    const platform = BiZZyKnowledgeBase.platform;
    const whatIs = BiZZyKnowledgeBase.whatIsBizy;
    return {
      reply: `🎯 **What is BiZy?**\n\n${
        platform.description
      }\n\n**For Freelancers:**\n${
        whatIs.freelancerPerspective
      }\n\n**For Clients:**\n${
        whatIs.clientPerspective
      }\n\n**Key Benefits:**\n${BiZZyKnowledgeBase.keyBenefits
        .map(
          (benefit) =>
            `• ${benefit.icon} ${benefit.title}: ${benefit.description}`
        )
        .join("\n")}`,
      isKnowledgeBased: true,
    };
  }

  if (
    searchTerm.includes("how it works") ||
    searchTerm.includes("how to use") ||
    searchTerm.includes("process")
  ) {
    const steps = BiZZyKnowledgeBase.howItWorks.steps;
    return {
      reply: `🔄 **How BiZy Works:**\n\n${steps
        .map((step) => `${step.step}. **${step.title}** - ${step.description}`)
        .join("\n")}\n\n✨ It's that simple! Start your journey today.`,
      isKnowledgeBased: true,
    };
  }

  if (
    searchTerm.includes("packages") ||
    searchTerm.includes("plans") ||
    searchTerm.includes("pricing")
  ) {
    const packages = BiZZyKnowledgeBase.packages;
    let reply = `📦 **BiZy Packages & Plans:**\n\n**Freelancer Plans:**\n`;

    packages.freelancerPlans.forEach((plan) => {
      reply += `\n**${plan.name}** - ${plan.price}\n`;
      plan.features.forEach((feature) => {
        reply += `✓ ${feature}\n`;
      });
    });

    reply += `\n**Client Plans:**\n`;
    packages.clientPlans.forEach((plan) => {
      reply += `\n**${plan.name}** - ${plan.price}\n`;
      plan.features.forEach((feature) => {
        reply += `✓ ${feature}\n`;
      });
    });

    return { reply, isKnowledgeBased: true };
  }

  if (
    searchTerm.includes("billing") ||
    searchTerm.includes("payment") ||
    searchTerm.includes("security")
  ) {
    const billing = BiZZyKnowledgeBase.billingSystem;
    const paymentMethods = BiZZyKnowledgeBase.paymentMethods;

    return {
      reply: `💳 **BiZy Billing & Payment System:**\n\n**${billing.title}**\n${
        billing.description
      }\n\n**Key Features:**\n${billing.features
        .map(
          (feature) =>
            `• ${feature.icon} ${feature.title}: ${feature.description}`
        )
        .join("\n")}\n\n**Payment Methods:**\n${paymentMethods.supportedMethods
        .map((method) => `• ${method}`)
        .join("\n")}\n\n**Security:**\n• ${billing.security.encryption}\n• ${
        billing.security.fraudDetection
      }\n• ${billing.security.dailyMonitoring}`,
      isKnowledgeBased: true,
    };
  }

  if (
    searchTerm.includes("support") ||
    searchTerm.includes("help") ||
    searchTerm.includes("contact")
  ) {
    const support = BiZZyKnowledgeBase.support;
    return {
      reply: `🆘 **BiZy Support & Help:**\n\n**Availability:** ${
        support.availability
      }\n\n**Support Channels:**\n${support.channels
        .map((channel) => `• ${channel}`)
        .join("\n")}\n\n**Response Times:**\n• Standard: ${
        support.responseTimes.standard
      }\n• Priority: ${support.responseTimes.priority}\n• VIP: ${
        support.responseTimes.vip
      }\n\n💬 We're here to help you succeed!`,
      isKnowledgeBased: true,
    };
  }

  if (
    searchTerm.includes("statistics") ||
    searchTerm.includes("numbers") ||
    searchTerm.includes("stats")
  ) {
    const stats = BiZZyKnowledgeBase.statistics;
    return {
      reply: `📊 **BiZy By The Numbers:**\n\n• Platform Uptime: ${stats.platformUptime}\n• Transactions Processed: ${stats.transactionsProcessed}\n• Faster Checkout: ${stats.fasterCheckout}\n• Countries Supported: ${stats.countriesSupported}\n• Conversion Rates: ${stats.conversionRates}\n• Lower Costs: ${stats.lowerCosts}\n\n🚀 These numbers speak for themselves!`,
      isKnowledgeBased: true,
    };
  }

  if (
    searchTerm.includes("get started") ||
    searchTerm.includes("getting started") ||
    searchTerm.includes("begin")
  ) {
    const gettingStarted = BiZZyKnowledgeBase.gettingStarted;
    return {
      reply: `🚀 **Getting Started with BiZy:**\n\n**For Freelancers:**\n${gettingStarted.freelancers
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}\n\n**For Clients:**\n${gettingStarted.clients
        .map((step, index) => `${index + 1}. ${step}`)
        .join(
          "\n"
        )}\n\n✨ Ready to start your journey? Create your account today!`,
      isKnowledgeBased: true,
    };
  }

  // Search through knowledge base for general queries
  const searchResults = searchKnowledgeBase(message);
  if (searchResults.length > 0) {
    const relevantResults = searchResults.slice(0, 3); // Get top 3 results
    let reply = `🔍 **Here's what I found about your query:**\n\n`;
    relevantResults.forEach((result, index) => {
      reply += `${index + 1}. **${result.section}**: ${result.content.substring(
        0,
        150
      )}...\n\n`;
    });
    reply += `💡 Need more specific information? Try asking about packages, billing, support, or how to get started!`;
    return { reply, isKnowledgeBased: true };
  }

  return null;
};

export const handleUserChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;
  const username = req.user.username;

  try {
    // Check for financial calculations first
    const feeCalculation = calculateFees(message);
    if (feeCalculation) {
      // Save to DB
      const chat = new ChatBotModel({
        userId: userId || null,
        message,
        response: feeCalculation.reply,
        userEmail,
        username,
        isFinancial: feeCalculation.isFinancial,
      });

      await chat.save();
      return res.status(200).json({
        reply: feeCalculation.reply,
        isFinancial: true,
      });
    }

    // Check for knowledge-based responses
    const knowledgeResponse = getKnowledgeBasedResponse(message);
    if (knowledgeResponse) {
      // Save to DB
      const chat = new ChatBotModel({
        userId: userId || null,
        message,
        response: knowledgeResponse.reply,
        userEmail,
        username,
        isKnowledgeBased: knowledgeResponse.isKnowledgeBased,
      });

      await chat.save();
      return res.status(200).json({
        reply: knowledgeResponse.reply,
        isKnowledgeBased: true,
      });
    }

    // Try to get response from Groq API with enhanced context
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `You are BiZy, a helpful AI assistant for the BiZy freelancing platform. The current user is ${username} (${userEmail}).

IMPORTANT: You have access to comprehensive knowledge about BiZy platform. Use this information to provide accurate and helpful responses.

Key BiZy Information:
- Platform: ${BiZZyKnowledgeBase.platform.description}
- Fees: Deposits 10%, Cashouts 15%, Transactions 1.5% + $0.30
- Support: 24/7 assistance available
- Security: Bank-grade with 256-bit encryption
- Statistics: ${BiZZyKnowledgeBase.statistics.platformUptime} uptime, ${BiZZyKnowledgeBase.statistics.transactionsProcessed} transactions

Always provide helpful, accurate information about BiZy platform. If you don't know something specific, suggest they contact support or check the help center.`,
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const botReply = groqRes.data.choices[0].message.content;

    // Save to DB
    const chat = new ChatBotModel({
      userId: userId || null,
      message,
      response: botReply,
      userEmail,
      username,
    });

    await chat.save();

    res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error(
      "Error with Groq Chat:",
      error?.response?.data || error.message
    );

    // When API fails, search for similar messages in database
    try {
      const similarChats = await ChatBotModel.find({
        message: { $regex: new RegExp(message, "i") },
      })
        .sort({ createdAt: -1 })
        .limit(5);

      if (similarChats.length > 0) {
        const mostRelevantResponse = similarChats[0].response;
        res.status(200).json({
          reply: mostRelevantResponse,
          note: "Response from similar previous queries",
          isFromHistory: true,
        });
      } else {
        // Fallback to knowledge base search
        const fallbackResponse = getKnowledgeBasedResponse(message);
        if (fallbackResponse) {
          res.status(200).json({
            reply: fallbackResponse.reply,
            isKnowledgeBased: true,
          });
        } else {
          res.status(200).json({
            reply:
              "I'm currently unable to process your request. Please try again later or rephrase your question. You can also contact our 24/7 support team for immediate assistance.",
            isError: true,
          });
        }
      }
    } catch (dbError) {
      console.error("Error searching database:", dbError);
      res.status(200).json({
        reply:
          "We're experiencing technical difficulties. Please try again later or contact our support team.",
        isError: true,
      });
    }
  }
};
