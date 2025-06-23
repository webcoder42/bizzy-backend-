// server.js
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
import TeamHubRoute from "./Route/TeamHubRoute.js";
import PayoutRoute from "./Route/payoutRoutes.js";
import BlogRoute from "./Route/BlogRoute.js";
import QuizRoute from "./Route/QuizRoute.js";
import { setupSocketIO } from "./Controller.js/MessageController.js";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env & DB
dotenv.config();
connectDB();

// Express & HTTP server
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://bizzyy.netlify.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
setupSocketIO(io);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://bizzyy.netlify.app",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(morgan("dev"));

// 🧹 CSRF Middleware Removed Here
// ❌ app.use(csrf({ cookie: true }));
// ❌ app.use("/api/v1/users/get-csrf-token", ... );

// Uploads folder setup
const uploadsDir = path.join(__dirname, "uploads");
const cvsDir = path.join(uploadsDir, "cvs");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(cvsDir)) fs.mkdirSync(cvsDir, { recursive: true });
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
app.use("/api/v1/teamhub", TeamHubRoute);
app.use("/api/v1/payout", PayoutRoute);
app.use("/api/v1/blog", BlogRoute);
app.use("/api/v1/quiz", QuizRoute);

// Root
app.get("/", (req, res) => {
  res.send("Welcome to BiZZy");
});

// Server start
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
