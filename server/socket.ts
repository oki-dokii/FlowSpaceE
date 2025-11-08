import { Server as IOServer } from "socket.io";
import http from "http";
import { Card } from "./models/Card";
import { Note } from "./models/Note";
import { Activity } from "./models/Activity";

export function initSocket(server: http.Server) {
  const io = new IOServer(server, {
    cors: { origin: process.env.CORS_ORIGIN || "*", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on("joinBoard", (boardId: string) => {
      const room = `board:${boardId}`;
      socket.join(room);
      socket.to(room).emit("presence:update", { id: socket.id, event: "join" });
    });

    socket.on("leaveBoard", (boardId: string) => {
      const room = `board:${boardId}`;
      socket.leave(room);
      socket
        .to(room)
        .emit("presence:update", { id: socket.id, event: "leave" });
    });

    // Card creation is handled by HTTP API, not socket
    // Socket only receives broadcast from server after HTTP create

    // Card update is handled by HTTP API, not socket
    // Socket only receives broadcast from server after HTTP update

    socket.on("card:delete", async (data) => {
      try {
        const { id } = data;
        const card = await Card.findByIdAndDelete(id);
        const room = `board:${card?.boardId}`;
        if (room) socket.to(room).emit("card:delete", { id });
        socket.emit("card:delete:ok", { id });
      } catch (err) {
        socket.emit("error", { message: "Failed to delete card" });
      }
    });

    socket.on("note:update", async (data) => {
      try {
        const { boardId, content, updatedBy } = data;
        const note = await Note.findOneAndUpdate(
          { boardId },
          { content, updatedBy, updatedAt: new Date() },
          { upsert: true, new: true },
        );
        const room = `board:${boardId}`;
        socket.to(room).emit("note:update", note);
        socket.emit("note:update:ok", note);
      } catch (err) {
        socket.emit("error", { message: "Failed to update note" });
      }
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id);
    });
  });

  return io;
}
