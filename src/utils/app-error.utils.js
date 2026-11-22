import { ErrorCode } from "../enums/errorcode.enum.js";

class AppError extends Error{
    constructor(message,statusCode=500,code=ErrorCode.INTERNAL_SERVER_ERROR){
        super(message);
        this.statusCode=statusCode;
        this.code=code;
        this.isOperational=true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;