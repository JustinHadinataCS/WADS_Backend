  import express from "express";
  import dotenv from "dotenv";
  import cors from "cors";
  import helmet from "helmet";
  import morgan from "morgan";
  import connectDB from "./config/db.js";
  import ticketRoutes from "./routes/ticket.route.js";
  import userRoutes from "./routes/user.route.js";
  import notificationRoutes from "./routes/notification.route.js";
  import errorHandler from "./middleware/errorHandler.js";

  // Load environment variables
  dotenv.config();

  // Initialize express app
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors());

  // Request logging in development
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Parse JSON request body
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notifications",notificationRoutes)

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
  connectDB()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`🚀 Server running on http://localhost:${PORT}`)
      );
    })
    .catch((error) => {
      console.error(`Failed to connect to database: ${error.message}`);
      process.exit(1);
    });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });