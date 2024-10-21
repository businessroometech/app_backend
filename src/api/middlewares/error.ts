import { Request, Response, NextFunction } from 'express';

class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // TypeORM invalid ID error (similar to MongoDB CastError)
  if (err.name === "EntityNotFoundError") {
    const message = `Resource not found with ID: ${err.id}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error (TypeORM MySQL specific)
  if (err.code === 'ER_DUP_ENTRY') {
    const message = `Duplicate field value entered`;
    err = new ErrorHandler(message, 409);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = "Invalid Token, please login again";
    err = new ErrorHandler(message, 401);
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = "Your token has expired, please login again";
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    error: err.message
  });
};

export { ErrorHandler, errorMiddleware };
