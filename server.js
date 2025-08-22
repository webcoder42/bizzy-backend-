import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { xss } from "express-xss-sanitizer";
import connectDB from "./config/db.js";

// Routes
import UserRoute from "./Route/UserRoute.js";
import PostProjectRoute from "./Route/PostProjectRoute.js";
import PlansRoute from "./Route/PlansRoute.js";
import PlanpurchaseRoute from "./Route/PlanpurchaseRoute.js";
import Apply from "./Route/ApplyRoute.js";
import SubmitProjectRoute from "./Route/SubmitProjectRoute.js";
import MessageRoute from "./Route/MessageRoute.js";
import ChatBotRoute from "./Route/ChatBotRoute.js";
import HelpCenterRoute from "./Route/HelpCenterRoute.js";
import PayoutRoute from "./Route/payoutRoutes.js";
import BlogRoute from "./Route/BlogRoute.js";
import QuizRoute from "./Route/QuizRoute.js";
import SiteSettingsRoute from "./Route/SiteSettingsRoute.js";
import AutoCompletionRoute from "./Route/AutoCompletionRoute.js";
import ActivityRoute from "./Route/ActivityRoute.js";
import TeamHubRoute from "./Route/TeamHubRoute.js";
import AdminAnalyticsRoute from "./Route/AdminAnalyticsRoute.js";
import ProjectSellRoute from "./Route/ProjectSellRoute.js";
import ProjectPurchaseRoute from "./Route/ProjectPurchaseRoute.js";
import { setupSocketIO } from "./Controller.js/MessageController.js";
import { initializeCronJobs } from "./services/CronScheduler.js";
import { initializeActivityTracking } from "./services/ActivityTrackingService.js";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env & DB
dotenv.config();
connectDB();

// Express & HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Allowed origins for CORS
const allowedOrigins = ["http://localhost:3000", "https://bizzyy.netlify.app"];

// ✅ Socket.IO with dynamic CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket.IO CORS blocked."));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});
setupSocketIO(io);

// ✅ CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(morgan("dev"));



// Uploads folder setup
const uploadsDir = path.join(__dirname, "uploads");
const cvsDir = path.join(uploadsDir, "cvs");
const projectImagesDir = path.join(uploadsDir, "project-images");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(cvsDir)) fs.mkdirSync(cvsDir, { recursive: true });
if (!fs.existsSync(projectImagesDir)) fs.mkdirSync(projectImagesDir, { recursive: true });
// Allow CORS for static files
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
app.use("/uploads", express.static(uploadsDir));
app.get("/uploads/cvs/:filename", (req, res) => {
  const { filename } = req.params;
  const cvPath = path.join(cvsDir, filename);
  res.download(cvPath);
});

// ✅ Routes
app.use("/api/v1/users", UserRoute);
app.use("/api/v1/postproject", PostProjectRoute);
app.use("/api/v1/plans", PlansRoute);
app.use("/api/v1/planpurchase", PlanpurchaseRoute);
app.use("/api/v1/apply", Apply);
app.use("/api/v1/submit", SubmitProjectRoute);
app.use("/api/v1/message", MessageRoute);
app.use("/api/v1/chat", ChatBotRoute);
app.use("/api/v1/helpCenter", HelpCenterRoute);
app.use("/api/v1/payout", PayoutRoute);
app.use("/api/v1/blog", BlogRoute);
app.use("/api/v1/quiz", QuizRoute);
app.use("/api/site-settings", SiteSettingsRoute);
app.use("/api/v1/auto-completion", AutoCompletionRoute);
app.use("/api/v1/activity", ActivityRoute);
app.use("/api/v1/teamhub", TeamHubRoute);
app.use("/api/v1/admin-analytics", AdminAnalyticsRoute);
console.log('Registering project-sell routes...');
app.use("/api/v1/project-sell", ProjectSellRoute);
console.log('Registering project-purchase routes...');
app.use("/api/v1/project-purchase", ProjectPurchaseRoute);

// Root
app.get("/", (req, res) => {
  res.send("Welcome to BiZZy");
});

// Initialize cron jobs
initializeCronJobs();

// Initialize activity tracking
initializeActivityTracking();

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
