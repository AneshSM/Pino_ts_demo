import { AxiosError } from "axios";
import { Request, Response, NextFunction } from "express";
import { ApiError, CustomError, FS_Error, GitError } from "../utils/error_util";
import loggers, { loggerCategory } from "../utils/pino_util.js";

// Type for logged data in logger
type CommonRequiredData = {
  code: string;
  context: string;
  [key: string]: any;
};

// Extended error type with logger and custom properties
type ExtendedError = Error & {
  logger?: CommonRequiredData | null;
  statusCode?: number;
  data?: any;
  error?: ApiError | FS_Error | GitError;
};

// Extend CustomError with `data` property to prevent TypeScript errors
type CustomErrorWithData = CustomError & {
  data?: any; // Define `data` property in CustomError
};

// Function to get the appropriate logger method based on category and warning status
const getLoggerMethod = (category: string, isWarning: boolean) => {
  const logCategory: { [key in loggerCategory]: any } = {
    [loggerCategory.SYSTEM]: loggers.systemLogger,
    [loggerCategory.AUTHENTICATION]: loggers.authLogger,
    [loggerCategory.VALIDATION]: loggers.validationLogger,
    [loggerCategory.USAGE]: loggers.usageLogger,
  };

  const logger = logCategory[category as loggerCategory];
  return isWarning ? logger?.warn : logger?.error;
};

// Error Logger Middleware
export const errorLogger = (
  err: ExtendedError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!err?.logger) {
    return next(err);
  }

  const { logger } = err;
  const { category, message: loggerMessage, ...loggerData } = logger;
  const isWarning = err.statusCode === 400;

  const message = loggerMessage || err.message;
  loggerData.error = JSON.parse(JSON.stringify(err.error || {}));

  const logMethod = getLoggerMethod(category, isWarning);
  if (logMethod) {
    logMethod(loggerData, message);
  }

  // Clear logger and pass to next middleware
  err.logger = null;
  next(err);
};

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

// Handle Git Errors
const handleGitError = (err: GitError): void => {
  console.error("-------- Git Error --------", {
    log: err.log,
    path: err.path,
    command: err.command,
  });
  err.statusCode = 500; // Assign custom status code for Git errors
};

// Helper function to handle file system errors
function handleFsError(error: CustomError): string {
  const errorMessages: { [key: string]: string } = {
    EACCES: "Permission denied.",
    ENOENT: "File or directory does not exist.",
    EBUSY: "Resource is busy or locked.",
    EEXIST: "File or directory already exists.",
    EPERM: "Operation not permitted.",
    ENOTDIR: "Expected a directory but found something else.",
  };

  return errorMessages[error.code] || `Unknown error: ${error.message}`;
}

// Handle Custom Errors
const handleCustomError = (err: CustomError): void => {
  console.error("-------- Custom Error --------");
  err.message = "Repository folder is busy or locked";
  handleFsError(err);
};

// Error Handler Middleware
export const errorHandler = (
  err:
    | ExtendedError
    | AxiosError
    | ApiError
    | FS_Error
    | GitError
    | CustomErrorWithData, // CustomError is now extended with `data`
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("-------- Error Handler Middleware --------");
  console.error(err);

  // Handle specific error types
  if (err instanceof AxiosError) {
    handleAxiosError(err);
  } else if (err instanceof FS_Error) {
    console.error("-------- File System Error --------", { path: err.path });
  } else if (err instanceof GitError) {
    handleGitError(err);
  } else if (err instanceof CustomError) {
    handleCustomError(err);
  }

  // Set default status and message for error response
  const statusCode = getStatusCode(err);
  const message = err.message || "An unexpected error occurred";

  // Safely access `data` if it exists
  const data = "data" in err ? err.data : null;

  res.status(statusCode).json({
    error: true,
    message,
    data,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
