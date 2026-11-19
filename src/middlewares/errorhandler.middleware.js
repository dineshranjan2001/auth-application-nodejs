import { Prisma } from "../../generated/prisma/client";
import AppError from "../utils/app-error.utils.js";


export function errorHandler(err, _, res, next) {
    let statusCode = err.statusCode || 500;
    let errorMessage = err.message || "Internal Server Error";

    if (res.headersSent) {
        return next(err);
    }


    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorMessage = err.message;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002": { // unique constraint
                const fields =
                    err.meta?.target ??
                    err.meta?.driverAdapterError?.cause?.constraint?.fields;
                statusCode = 409;
                errorMessage = `Already exists${fields ? `: ${[].concat(fields).join(", ")}` : ""}`;
                break;
            }
            case "P2025": // record not found (update/delete/...OrThrow)
                statusCode = 404;
                errorMessage = err.meta?.cause || "Record not found";
                break;
            case "P2003": // foreign key constraint failed
                statusCode = 400;
                errorMessage = "Related record does not exist or is still in use";
                break;
            case "P2000": // value too long for column
                statusCode = 400;
                errorMessage = "Value too long for column";
                break;
            default:
                statusCode = 400;
                errorMessage = "Database request error";
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorMessage = "Invalid data sent to the database";
    }// Database unreachable / failed to connect
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        errorMessage = "Database connection failed";
    }

    // JWT (if you use jsonwebtoken)
    else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        errorMessage = "Invalid token";
    } else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        errorMessage = "Token expired";
    }

    const isProduction = process.env.NODE_ENV === "production";
    if (statusCode >= 500) {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        message: isProduction && statusCode >= 500
            ? "Internal Server Error"
            : errorMessage,
        ...(!isProduction && { stack: err.stack }),
    });
}