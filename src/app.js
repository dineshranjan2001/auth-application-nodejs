import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import roleRoutes from "./routes/role.route.js";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/errorhandler.middleware.js";




const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());

app.use(cookieParser());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth",roleRoutes);

// Protected example API
// app.get(
//     "/api/v1/profile",
//     authenticate,
//     (req, res) => {
//         res.status(200).json({
//             success: true,
//             data: {
//                 userId: req.auth?.userId,
//             },
//         });
//     }
// );

app.use(errorHandler);

export default app;
