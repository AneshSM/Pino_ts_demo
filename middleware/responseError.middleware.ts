import { AxiosError } from "axios";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/error_util";
import { ApiResponse } from "./logger.middleware";

// Helper function to safely get statusCode from various error types
const getStatusCode = (err: any): number => {
  if (err instanceof AxiosError) {
    return err.response?.status || 500;
  }
  return err.statusCode || 500;
};

// Helper function to handle Axios errors
const handleAxiosError = (err: AxiosError): void => {
  console.error("-------- Axios Error --------");
  if (err.response) {
    console.error("Response Error:", {
      data: err.response.data,
      status: err.response.status,
      headers: err.response.headers,
    });
  } else if (err.request) {
    console.error("Request Error:", err.request);
  } else {
    console.error("Axios Configuration Error:", {
      message: err.message,
      config: err.config,
    });
  }
};

// Response and Error handler middleware
const responseErrorHandler = (
  apiResult: ApiResponse | AxiosError | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (apiResult instanceof ApiResponse) {
    const { statusCode, message, data } = apiResult;
    res.status(statusCode).send({ message, data });
  } else if (apiResult instanceof Error) {
    const error = apiResult;
    console.log("-------- Error Handler Middleware --------");
    console.error(error);

    // Handle specific error types
    if (error instanceof AxiosError) {
      handleAxiosError(error);
    }
    // Set default status and message for error response
    const statusCode = getStatusCode(error);
    const message = error.message || "An unexpected error occurred";
    // Safely access `data` if it exists
    const data = "data" in error ? error.data : null;

    res.status(statusCode).json({
      error: true,
      message,
      data,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export default responseErrorHandler;
