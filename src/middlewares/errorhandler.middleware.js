
import { Prisma } from "../../generated/prisma/client.js";
import AppError from "../utils/app-error.utils.js";

export function errorHandler(err, req, res, next) {

    if (res.headersSent) {
        return next(err);
    }

    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    console.log(err)

    if (err instanceof AppError) {

        statusCode = err.statusCode;
        errorMessage = err.message;

    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {

        switch (err.code) {

            case "P2002":
                statusCode = 409;
                errorMessage = "Resource already exists";
                break;

            case "P2025":
                statusCode = 404;
                errorMessage = "Requested resource not found";
                break;

            case "P2003":
                statusCode = 400;
                errorMessage = "Related resource does not exist or is still in use";
                break;

            case "P2000":
                statusCode = 400;
                errorMessage = "Provided value is too long";
                break;

            default:
                statusCode = 400;
                errorMessage = "Database request error";
        }

    } else if (err instanceof Prisma.PrismaClientValidationError) {

        statusCode = 400;
        errorMessage = "Invalid data provided";

    } else if (
        err instanceof Prisma.PrismaClientInitializationError ||
        err.code === "P1001" ||
        err.code === "P1002"
    ) {

        statusCode = 503;
        errorMessage = "Database service is currently unavailable";

    } else if (err.name === "JsonWebTokenError") {

        statusCode = 401;
        errorMessage = "Invalid token";

    } else if (err.name === "TokenExpiredError") {

        statusCode = 401;
        errorMessage = "Token expired";

    }

    // Log internal errors on the server
    if (statusCode >= 500) {
        console.error("Internal Server Error:", err);
    }

    return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        statusCode
    });
}
