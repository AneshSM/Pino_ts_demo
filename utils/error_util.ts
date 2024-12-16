// Extend NodeJS.ErrnoException with known error codes
type KnownErrorCodes =
  | "EACCES"
  | "ENOENT"
  | "EBUSY"
  | "EEXIST"
  | "EPERM"
  | "ENOTDIR";

class CustomError implements NodeJS.ErrnoException {
  errno?: number | undefined;
  path?: string | undefined;
  syscall?: string | undefined;
  name!: string;
  message!: string;
  stack?: string | undefined;
  code!: KnownErrorCodes;
}

/**
 * @typedef {object} Logger
 * @property {"warn"|"error"|undefined} variant - The type of log entry.
 * @property {string} category
 * @property {string} code
 * @property {string} context
 * @property {string | undefined} message
 */

interface Logger {
  variant?: "warn" | "error";
  category: string;
  code: string;
  context: string;
  message?: string;
}

class ApiError extends Error {
  statusCode: number;
  error: object | null;
  data: object | null;
  logger: Logger | null;

  /**
   * Creates an ApiError instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="An error occurred"] - Error message.
   * @param {object|null} [error=null] - Detailed error type (e.g., "validation", "authentication").
   * @param {object|null} [data=null] - Additional error-related data.
   * @param {Logger|null} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode: number = 500,
    message: string = "An error occurred",
    error: object | null = null,
    data: object | null = null,
    logger: Logger | null = null
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
    this.data = data;
    this.logger = logger;
  }
}

class ValidationError extends ApiError {
  constructor(
    statusCode: number = 400,
    message: string = "Validation failure",
    logger: Logger | null = null
  ) {
    super(statusCode, message, null, null, logger);
    this.name = "ValidationError";
  }
}

class FS_Error extends ApiError {
  path: string | null;

  constructor(
    statusCode: number = 500,
    message: string = "File system error",
    path: string | null = null,
    error: object | null = null,
    logger: Logger | null = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "FS_Error";
    this.path = path;
  }
}

class GitError extends ApiError {
  log: string | null;
  path: string | null;
  command: string | null;

  constructor(
    statusCode: number = 500,
    message: string = "Git operation failed",
    log: string | null = null,
    path: string | null = null,
    command: string | null = null,
    error: object | null = null,
    logger: Logger | null = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "GitError";
    this.log = log;
    this.path = path;
    this.command = command;
  }
}

class AuthError extends ApiError {
  constructor(
    statusCode: number = 401,
    message: string = "Authentication failed",
    error: object | null = null,
    logger: Logger | null = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "AuthError";
  }
}

class DataBaseError extends ApiError {
  constructor(
    statusCode: number = 500,
    message: string = "Database operation failed",
    error: object | null = null,
    data: object | null = null,
    logger: Logger | null = null
  ) {
    super(statusCode, message, error, data, logger);
    this.name = "DataBaseError";
  }
}

class QlikError extends ApiError {
  constructor(
    statusCode: number = 500,
    message: string = "Qlik Sense error occurred",
    error: object | null = null,
    data: object | null = null,
    logger: Logger | null = null
  ) {
    super(statusCode, message, error, data, logger);
    this.name = "QlikError";
  }
}

export {
  ApiError,
  ValidationError,
  FS_Error,
  GitError,
  AuthError,
  DataBaseError,
  QlikError,
  CustomError,
};
