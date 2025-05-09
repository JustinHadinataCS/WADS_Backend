import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/db.js";
import ticketRoutes from "./routes/ticket.route.js";
import userRoutes from "./routes/user.route.js";
import notificationRoutes from "./routes/notification.route.js";
import departmentRoutes from "./routes/department.route.js";
import auditRoutes from "./routes/audit.route.js";
import exportRoutes from "./routes/export.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import chatRoutes from "./routes/chat.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import session from "express-session";
import passport from "./middleware/auth.js";

import { specs } from "./config/swagger.js";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

// Middleware
app.use(helmet());
app.use(cors());

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Parse JSON request body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth routes
app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home
    res.redirect("/");
  }
);

// API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Semesta Medika API Documentation",
  })
);

// API routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/chat", chatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// MongoDB connection and server startup
if (process.env.NODE_ENV !== "test") {
  connectDB()
    .then(() => {
      server.listen(PORT, () =>
        console.log(`🚀 Server running on http://localhost:${PORT}`)
      );
    })
    .catch((error) => {
      console.error(`Failed to connect to database: ${error.message}`);
      process.exit(1);
    });
}

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("forum:send-message", (data) =>
    socket.broadcast.emit("forum:message-received", data)
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

export default app;
