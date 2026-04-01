import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./src/routes/user.routes.js";
import aiRouter from "./src/routes/ai.routes.js";
import chatRouter from "./src/routes/chat.routes.js";

const app = express();

// CORS - Allow Vercel frontend
app.use(
  cors({
    origin: [
      "https://intellichat-main.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/chat", chatRouter);
export default app;
