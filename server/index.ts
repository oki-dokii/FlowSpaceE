import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import http from "http";
import path from "path";

import authRoutes from "./routes/auth";
import boardsRoutes from "./routes/boards";
import cardsRoutes from "./routes/cards";
import notesRoutes from "./routes/notes";
import { handleDemo } from "./routes/demo";
import { errorHandler } from "./middleware/errorHandler";
import { initSocket } from "./socket";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // MongoDB
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/flowspace";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.use("/api/auth", authRoutes);
  app.use("/api/boards", boardsRoutes);
  app.use("/api/cards", cardsRoutes);
  app.use("/api", notesRoutes);

  // Error handler
  app.use(errorHandler);

  // Create HTTP server and attach socket.io
  const server = http.createServer(app);
  const io = initSocket(server);

  return { app, server, io };
}

if (require.main === module) {
  (async () => {
    const { server } = await createServer();
    const port = Number(process.env.PORT || 8080);
    server.listen(port, () => console.log(`Server listening on ${port}`));
  })();
}
