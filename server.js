import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import ticketRoutes from "./routes/ticket.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use("/api/tickets", ticketRoutes);

// MongoDB connection
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
