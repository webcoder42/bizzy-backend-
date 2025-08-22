import axios from "axios";
import ChatBotModel from "../Model/ChatBotModel.js";
import {
  searchKnowledgeBase,
  getBizyInfo,
  BiZZyKnowledgeBase,
} from "../Helper/BiZyKnowledgeBase.js";
import dotenv from 'dotenv'
dotenv.config();
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

export const getDailyProposalCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Count today's proposals for this user
    const todayProposalCount = await ChatBotModel.countDocuments({
      userId: userId,
      isProposal: true,
      createdAt: {
        $gte: today,
        $lte: todayEnd
      }
    });

    res.status(200).json({
      success: true,
      count: todayProposalCount,
      remaining: Math.max(0, 5 - todayProposalCount),
      maxDaily: 5
    });

  } catch (error) {
    console.error("Error getting daily proposal count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get proposal count"
    });
  }
};

export const generateProposal = async (req, res) => {
  const { 
    projectTitle, 
    projectDescription, 
    projectSkills, 
    projectBudget, 
    projectCategory,
    experienceRequired,
    problemsToSolve,
    userSkills,
    userName,
    userExperience
  } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  try {
    // Check if user has active plan
    const PlanPurchaseModel = (await import("../Model/PlanPurchaseModel.js")).default;
    const activePlan = await PlanPurchaseModel.findOne({
      user: userId,
      status: "approved"
    });

    // If no active plan, check daily limit
    if (!activePlan) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Count today's proposals for this user
      const todayProposalCount = await ChatBotModel.countDocuments({
        userId: userId,
        isProposal: true,
        createdAt: {
          $gte: today,
          $lte: todayEnd
        }
      });

      if (todayProposalCount >= 5) {
        return res.status(403).json({
          success: false,
          message: "Daily limit reached! You can generate 5 proposals per day without an active plan. Upgrade your plan for unlimited AI proposal generation.",
          dailyLimit: true,
          usedToday: todayProposalCount,
          maxDaily: 5
        });
      }
    }

    const skillsMatch = userSkills.filter(userSkill => 
      projectSkills.some(projectSkill => 
        projectSkill.toLowerCase().includes(userSkill.toLowerCase()) || 
        userSkill.toLowerCase().includes(projectSkill.toLowerCase())
      )
    );

    // Enhanced matching and analysis
    const experienceYears = userExperience || '3+ years';
    const isExperienceMatch = experienceRequired && 
      parseInt(experienceRequired) <= parseInt(experienceYears);
    
    const specificRequirements = [];
    if (projectDescription.toLowerCase().includes('stripe')) {
      specificRequirements.push('Stripe payment integration');
    }
    if (projectDescription.toLowerCase().includes('restapi') || projectDescription.toLowerCase().includes('rest api')) {
      specificRequirements.push('RESTful API development');
    }
    if (projectDescription.toLowerCase().includes('secure') || projectDescription.toLowerCase().includes('security')) {
      specificRequirements.push('Security implementation');
    }
    if (projectDescription.toLowerCase().includes('mern')) {
      specificRequirements.push('MERN stack development');
    }
    if (projectDescription.toLowerCase().includes('debug') || projectDescription.toLowerCase().includes('fix')) {
      specificRequirements.push('debugging and error fixing');
    }

    const prompt = `Create a highly personalized, professional freelance proposal based on these specific requirements:

PROJECT DETAILS:
Title: ${projectTitle}
Description: ${projectDescription}
Required Experience: ${experienceRequired || 'Professional level'}
Budget: $${projectBudget}
Required Skills: ${projectSkills?.join(', ') || 'Not specified'}
Problems to Solve: ${problemsToSolve || 'Not specified'}
Category: ${projectCategory || 'Development'}

MY QUALIFICATIONS:
- Name: ${userName || 'Professional Developer'}
- Experience: ${experienceYears} of professional experience
- Skills: ${userSkills?.join(', ') || 'Full-stack development'}
- Matching Skills: ${skillsMatch.length > 0 ? skillsMatch.join(', ') : 'General development expertise'}
- Experience Match: ${isExperienceMatch ? 'YES - I meet the experience requirements' : 'I have relevant experience'}

SPECIFIC REQUIREMENTS IDENTIFIED:
${specificRequirements.length > 0 ? specificRequirements.map(req => `- ${req}`).join('\n') : '- Custom development solutions'}

WRITE A COMPELLING PROPOSAL THAT:
1. Directly addresses each specific requirement mentioned
2. Highlights my ${experienceYears} experience specifically if experience was mentioned
3. Mentions specific technologies they need (Stripe, REST API, MERN, etc.) if mentioned
4. Shows I understand their exact problems and can solve them
5. Provides a clear approach for their specific needs
6. Demonstrates expertise in the exact skills they require
7. Is confident and solution-focused (NO questions)
8. 250-350 words
9. Ends with strong commitment to deliver results

Make it feel personalized to their exact project, not generic. Reference specific details from their description.`;

    // Check if GROQ API key exists
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY not found, using fallback proposal");
      throw new Error("GROQ API key not configured");
    }

    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert freelancer proposal writer with deep technical knowledge. Create winning proposals by: 1) Addressing every specific requirement mentioned 2) Demonstrating deep understanding of their tech stack 3) Showing relevant experience clearly 4) Providing a clear solution approach 5) Being confident and direct (NO questions) 6) Making it feel personalized, not templated. Always reference specific technologies, experience requirements, and problems they mentioned. Write in first person and be solution-focused."
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const proposal = groqRes.data.choices[0].message.content;

    // Save the generated proposal to ChatBot model for tracking
    const chat = new ChatBotModel({
      userId: userId || null,
      message: `Generate AI proposal for: ${projectTitle}`,
      response: proposal,
      username,
      isProposal: true,
    });

    await chat.save();

    res.status(200).json({ 
      success: true,
      proposal: proposal 
    });

  } catch (error) {
    console.error("Error generating proposal:", error?.response?.data || error.message);
    
    // Calculate skills match for fallback as well
    const fallbackSkillsMatch = userSkills.filter(userSkill => 
      projectSkills.some(projectSkill => 
        projectSkill.toLowerCase().includes(userSkill.toLowerCase()) || 
        userSkill.toLowerCase().includes(projectSkill.toLowerCase())
      )
    );

    // Enhanced fallback proposal template with proper null checks
    const fallbackProposal = `I'm excited about your ${projectTitle || 'project'} and understand you need ${projectSkills?.length > 0 ? projectSkills.slice(0, 3).join(', ') : 'professional'} expertise${experienceRequired ? ` with ${experienceRequired}` : ''}.

${problemsToSolve ? `I can solve the specific challenges you mentioned: ${problemsToSolve}.` : 'Based on your requirements,'} I have the expertise to deliver exactly what you need. My experience in ${userSkills?.length > 0 ? userSkills.slice(0, 3).join(', ') : 'relevant technologies'} makes me the perfect fit for this project.

My approach will be:
• Thoroughly understand and analyze your requirements
• ${projectCategory === 'Web Development' ? 'Develop clean, scalable code with modern best practices' : projectCategory === 'Mobile Development' ? 'Create high-performance mobile applications' : 'Deliver professional solutions using industry standards'}
• Provide regular progress updates and maintain clear communication
• Complete the project on time and within your ${projectBudget ? `$${projectBudget}` : 'specified'} budget
• Ensure quality through thorough testing and optimization

${fallbackSkillsMatch.length > 0 ? `My proven expertise in ${fallbackSkillsMatch.join(', ')} ensures I can handle all aspects of your project effectively.` : ''} I'm committed to delivering exceptional results that exceed your expectations and contribute to your business success.

I'm ready to start immediately and bring your vision to life with professional quality and attention to detail.`;

    res.status(200).json({ 
      success: true,
      proposal: fallbackProposal,
      note: "Generated using enhanced template"
    });
  }
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
