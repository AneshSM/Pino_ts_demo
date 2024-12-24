import { LoggerData } from "./pino_util";

type ErrorOptions = {
  error?: object | null;
  data?: object | null;
  logger?: LoggerData | null;
};

class ApiError extends Error {
  statusCode: number;
  error: object | null = null;
  data: object | null = null;
  logger: LoggerData | null = null;

  constructor({
    statusCode = 500,
    message = "An error occurred",
    options,
  }: {
    statusCode: number;
    message: string;
    options?: ErrorOptions;
  }) {
    super(message);
    this.name = "Api call error";
    this.statusCode = statusCode;

    if (options) {
      const { error = null, data = null, logger = null } = options;
      this.error = error;
      this.data = data;
      this.logger = logger;
    }
  }
}

class ValidationError extends ApiError {
  constructor({
    statusCode = 400,
    message = "Validation failure",
    options,
  }: {
    statusCode: number;
    message: string;
    options?: ErrorOptions;
  }) {
    super({ statusCode, message, options });
    this.name = "ValidationError";
  }
}

class FS_Error extends ApiError {
  path: string | null = null;

  constructor({
    statusCode = 500,
    message = "File system error",
    options,
  }: {
    statusCode: number;
    message: string;
    options?: ErrorOptions & { path?: string | null };
  }) {
    super({ statusCode, message, options });

    if (options) {
      const { path = null } = options;
      this.path = path;
    }

    this.name = "FS_Error";
  }
}

class AuthError extends ApiError {
  constructor({
    statusCode = 401,
    message = "Authentication failed",
    options,
  }: {
    statusCode: number;
    message: string;
    options?: ErrorOptions;
  }) {
    super({ statusCode, message, options });
    this.name = "AuthError";
  }
}

class DataBaseError extends ApiError {
  constructor({
    statusCode = 500,
    message = "Database operation failed",
    options,
  }: {
    statusCode: number;
    message: string;
    options?: ErrorOptions;
  }) {
    super({ statusCode, message, options });
    this.name = "DataBaseError";
  }
}

export { ApiError, ValidationError, FS_Error, AuthError, DataBaseError };
