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

// Enhanced knowledge base search with action buttons
const getKnowledgeBasedResponse = (message) => {
  const searchTerm = message.toLowerCase();

  // Check for specific action requests
  if (
    searchTerm.includes("complaint") ||
    searchTerm.includes("complain") ||
    searchTerm.includes("issue") ||
    searchTerm.includes("problem")
  ) {
    return {
      reply: `📝 **Submit a Complaint/Issue**\n\nWe're here to help resolve your concerns quickly!\n\n**How to submit a complaint:**\n1. Go to your dashboard\n2. Click on "Help & Support"\n3. Select "Submit Complaint"\n4. Fill out the form with details\n\n**Or use the direct link below:**`,
      actions: [
        {
          type: "link",
          label: "📝 Submit Complaint",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/help",
          description: "Click to submit your complaint"
        },
        {
          type: "link", 
          label: "📞 Contact Support",
          url: "mailto:support@bizzy.com",
          description: "Email our support team"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("cashout") ||
    searchTerm.includes("withdraw") ||
    searchTerm.includes("withdrawal") ||
    searchTerm.includes("get money")
  ) {
    return {
      reply: `💰 **Cashout/Withdrawal**\n\nReady to withdraw your earnings? Here's how:\n\n**For Freelancers:**\n• Minimum withdrawal: $50\n• Processing time: 2-5 business days\n• Fee: 15% of withdrawal amount\n\n**For Clients:**\n• Refund unused funds\n• No minimum amount\n• Processing time: 3-7 business days`,
      actions: [
        {
          type: "link",
          label: "💰 Request Withdrawal",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Go to withdrawal page"
        },
        {
          type: "link",
          label: "📊 View Balance",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Check your current balance"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("find job") ||
    searchTerm.includes("search job") ||
    searchTerm.includes("available jobs") ||
    searchTerm.includes("projects")
  ) {
    return {
      reply: `💼 **Find Jobs/Projects**\n\nDiscover amazing opportunities on BiZy!\n\n**Available Categories:**\n• Programming & Tech\n• Design & Creative\n• Writing & Content\n• Digital Marketing\n• Business & Consulting\n• And 100+ more categories\n\n**How to find jobs:**\n1. Browse available projects\n2. Filter by skills and budget\n3. Submit your proposal\n4. Get hired!`,
      actions: [
        {
          type: "link",
          label: "🔍 Browse Jobs",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "View available projects"
        },
        {
          type: "link",
          label: "📝 My Proposals",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Check your submitted proposals"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("post job") ||
    searchTerm.includes("hire") ||
    searchTerm.includes("post project") ||
    searchTerm.includes("find freelancer")
  ) {
    return {
      reply: `🎯 **Post a Job/Hire Freelancers**\n\nReady to find the perfect talent for your project?\n\n**How it works:**\n1. Create your project description\n2. Set budget and timeline\n3. Review proposals from freelancers\n4. Choose the best match\n5. Start working together\n\n**Benefits:**\n• Access to top 5% talent\n• Secure milestone payments\n• Quality guarantee`,
      actions: [
        {
          type: "link",
          label: "📝 Post New Job",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/client",
          description: "Create a new job posting"
        },
        {
          type: "link",
          label: "👥 Browse Freelancers",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/client",
          description: "Find talented freelancers"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("payment") ||
    searchTerm.includes("billing") ||
    searchTerm.includes("add funds") ||
    searchTerm.includes("deposit")
  ) {
    return {
      reply: `💳 **Payment & Billing**\n\nManage your payments and billing easily!\n\n**Available Options:**\n• Credit/Debit Cards\n• Bank Transfers\n• Digital Wallets\n• Cryptocurrency\n• Mobile Payments\n\n**Features:**\n• Multi-currency support (50+ currencies)\n• Secure transactions\n• Real-time processing\n• Low fees (1.5% + $0.30)`,
      actions: [
        {
          type: "link",
          label: "💰 Add Funds",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/client/billing",
          description: "Add money to your account"
        },
        {
          type: "link",
          label: "📊 Transaction History",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/client/billing",
          description: "View your payment history"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("profile") ||
    searchTerm.includes("account") ||
    searchTerm.includes("settings")
  ) {
    return {
      reply: `👤 **Profile & Account Settings**\n\nManage your account and profile information.\n\n**What you can do:**\n• Update personal information\n• Change password\n• Manage notifications\n• Update skills and portfolio\n• Set payment preferences\n• Privacy settings`,
      actions: [
        {
          type: "link",
          label: "👤 My Profile",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "View and edit your profile"
        },
        {
          type: "link",
          label: "⚙️ Account Settings",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Manage account settings"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("quiz") ||
    searchTerm.includes("test") ||
    searchTerm.includes("skill test")
  ) {
    return {
      reply: `📝 **Skill Quiz/Test**\n\nTake skill quizzes to showcase your expertise!\n\n**Available Skills:**\n• Programming (JavaScript, Python, React, etc.)\n• Design (UI/UX, Graphic Design, etc.)\n• Writing (Content, Technical, Creative)\n• Marketing (Digital, Social Media, SEO)\n• Business (Consulting, Strategy, Analysis)\n\n**Benefits:**\n• Prove your skills to clients\n• Get higher project rates\n• Stand out from competition\n• Build credibility`,
      actions: [
        {
          type: "link",
          label: "📝 Take Quiz",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Start a skill quiz"
        },
        {
          type: "link",
          label: "🏆 My Certificates",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "View your completed quizzes"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("team") ||
    searchTerm.includes("collaboration") ||
    searchTerm.includes("team hub")
  ) {
    return {
      reply: `👥 **Team Hub & Collaboration**\n\nWork together seamlessly with your team!\n\n**Features:**\n• Real-time collaboration\n• File sharing and management\n• Project tracking\n• Team communication\n• Task assignment\n• Progress monitoring\n\n**Perfect for:**\n• Large projects\n• Team-based work\n• Client collaboration\n• Project management`,
      actions: [
        {
          type: "link",
          label: "👥 Team Hub",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Access team collaboration tools"
        },
        {
          type: "link",
          label: "📁 My Projects",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "View your active projects"
        }
      ],
      isActionable: true
    };
  }

  // Check for specific categories
  if (
    searchTerm.includes("what is bizy") ||
    searchTerm.includes("about bizy") ||
    searchTerm.includes("platform")
  ) {
    const platform = BiZZyKnowledgeBase.platform;
    const whatIs = BiZZyKnowledgeBase.whatIsBizy;
    return {
      reply: `🎯 **What is BuzYoo?**\n\n${
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
      reply: `🔄 **How BuzYoo Works:**\n\n${steps
        .map((step) => `${step.step}. **${step.title}** - ${step.description}`)
        .join("\n")}\n\n✨ It's that simple! Start your journey today.`,
      actions: [
        {
          type: "link",
          label: "🚀 Get Started",
          url: "/register",
          description: "Create your account"
        },
        {
          type: "link",
          label: "📚 Learn More",
          url: "/doc",
          description: "Read our documentation"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("packages") ||
    searchTerm.includes("plans") ||
    searchTerm.includes("pricing")
  ) {
    const packages = BiZZyKnowledgeBase.packages;
    let reply = `📦 **BuzYoo Packages & Plans:**\n\n**Freelancer Plans:**\n`;

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

    return { 
      reply,
      actions: [
        {
          type: "link",
          label: "📦 View Plans",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "See all available plans"
        },
        {
          type: "link",
          label: "💳 Upgrade Plan",
          url: "/B/a9fd38c3-4731-4e97-ae6e-83a4c8f8bd2e/dashboard/freelancer",
          description: "Upgrade your current plan"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("billing") ||
    searchTerm.includes("payment") ||
    searchTerm.includes("security")
  ) {
    const billing = BiZZyKnowledgeBase.billingSystem;
    const paymentMethods = BiZZyKnowledgeBase.paymentMethods;

    return {
      reply: `💳 **BuzYoo Billing & Payment System:**\n\n**${billing.title}**\n${
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
      reply: `🆘 **BuzYoo Support & Help:**\n\n**Availability:** ${
        support.availability
      }\n\n**Support Channels:**\n${support.channels
        .map((channel) => `• ${channel}`)
        .join("\n")}\n\n**Response Times:**\n• Standard: ${
        support.responseTimes.standard
      }\n• Priority: ${support.responseTimes.priority}\n• VIP: ${
        support.responseTimes.vip
      }\n\n💬 We're here to help you succeed!`,
      actions: [
        {
          type: "link",
          label: "📞 Contact Support",
          url: "mailto:support@bizzy.com",
          description: "Email our support team"
        },
        {
          type: "link",
          label: "📚 Help Center",
          url: "/doc",
          description: "Browse help articles"
        }
      ],
      isActionable: true
    };
  }

  if (
    searchTerm.includes("statistics") ||
    searchTerm.includes("numbers") ||
    searchTerm.includes("stats")
  ) {
    const stats = BiZZyKnowledgeBase.statistics;
    return {
      reply: `📊 **BuzYoo By The Numbers:**\n\n• Platform Uptime: ${stats.platformUptime}\n• Transactions Processed: ${stats.transactionsProcessed}\n• Faster Checkout: ${stats.fasterCheckout}\n• Countries Supported: ${stats.countriesSupported}\n• Conversion Rates: ${stats.conversionRates}\n• Lower Costs: ${stats.lowerCosts}\n\n🚀 These numbers speak for themselves!`,
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
      reply: `🚀 **Getting Started with BuzYoo:**\n\n**For Freelancers:**\n${gettingStarted.freelancers
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}\n\n**For Clients:**\n${gettingStarted.clients
        .map((step, index) => `${index + 1}. ${step}`)
        .join(
          "\n"
        )}\n\n✨ Ready to start your journey? Create your account today!`,
      actions: [
        {
          type: "link",
          label: "🚀 Sign Up",
          url: "/register",
          description: "Create your account"
        },
        {
          type: "link",
          label: "📚 Learn More",
          url: "/doc",
          description: "Read our guide"
        }
      ],
      isActionable: true
    };
  }

  // Search through knowledge base for general queries
  const searchResults = searchKnowledgeBase(message);
  if (searchResults.length > 0) {
    const relevantResults = searchResults.slice(0, 3); // Get top 3 results
    let reply = `🔍 **Here's what I found about your query:**\n\n`;
    relevantResults.forEach((result, index) => {
      reply += `${index + 1}. **${result.section.replace(/BiZy|BiZZy|bizy/gi, 'BuzYoo')}**: ${result.content.substring(
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
        isActionable: knowledgeResponse.isActionable,
      });

      await chat.save();
      return res.status(200).json({
        reply: knowledgeResponse.reply,
        isKnowledgeBased: knowledgeResponse.isKnowledgeBased,
        isActionable: knowledgeResponse.isActionable,
        actions: knowledgeResponse.actions || [],
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
            isKnowledgeBased: fallbackResponse.isKnowledgeBased,
            isActionable: fallbackResponse.isActionable,
            actions: fallbackResponse.actions || [],
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
