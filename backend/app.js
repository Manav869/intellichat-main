import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './src/routes/user.routes.js';
import aiRouter from './src/routes/ai.routes.js';
import chatRouter from './src/routes/chat.routes.js';




const app = express();

// CORS - Allow all origins for testing (Postman, etc.)
app.use(cors({
    origin: true, // Allow all origins
    credentials: true, // ESSENTIAL for cookies
}));
app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/chat", chatRouter);
export default app;