import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import socket from "./socket";
import { userRouter } from "./route/userRouter";
import { docRouter } from "./route/docRouter";
import { generateResponse } from "./chat";
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const local_url = process.env.CLIENT_URL || "";
const prod_url = process.env.CLIENT_PROD_URL || "";
const prod_url2 = process.env.CLIENT_PROD_URL2 || "";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 12000,
  cors: {
    origin: [local_url, prod_url, prod_url2],
  },
});

app.use(cors());
app.use(express.json());

const db = process.env.ATLAS_URI || "";
mongoose.connect(db);
mongoose.connection.once("open", () => {
  console.log("Connected to database!");
});

socket(io);

app.get("/", (req, res) => {
  res.send("Working!");
});

app.use("/user", userRouter);
app.use("/doc", docRouter);

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;

  try {
    const response = await generateResponse(messages);
    return res.status(200).json({ msg: "Response generated!", response });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error!", error });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
