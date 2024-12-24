import { NextFunction, Request, Response } from "express";
import loggers, { loggerCategory, LoggerData } from "../utils/pino_util";
import { ApiError } from "../utils/error_util";

export class ApiResponse {
  statusCode: number;
  message: string;
  data?: any;
  logger?: LoggerData;

  constructor({
    statusCode,
    message,
    options,
  }: {
    statusCode: number;
    message: string;
    options?: {
      logger: LoggerData;
      data?: any;
    };
  }) {
    this.statusCode = statusCode;
    this.message = message;
    if (options) {
      const { logger, data } = options;
      this.logger = logger; // E.g., SYSTEM, USAGE, VALIDATION
      this.data = data;
    }
  }
}

const centralizedLogger = ({
  category,
  details,
  message,
  status,
}: {
  category: string;
  message: string;
  details: any;
  status: "success" | "warning" | "error";
}) => {
  const logCategory: { [key in loggerCategory]: any } = {
    [loggerCategory.SYSTEM]: loggers.systemLogger,
    [loggerCategory.AUTHENTICATION]: loggers.authLogger,
    [loggerCategory.VALIDATION]: loggers.validationLogger,
    [loggerCategory.USAGE]: loggers.usageLogger,
  };

  const logger = logCategory[category as loggerCategory];

  switch (status) {
    case "success": {
      logger?.info?.(details, message);
      break;
    }
    case "warning": {
      logger?.warn?.(details, message);
      break;
    }
    case "error": {
      logger?.error?.(details, message);
      break;
    }
  }
};

const loggerMiddleware = (
  apiResult: ApiResponse | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(apiResult);
  const { statusCode, message, logger } = apiResult;
  if (logger) {
    const { category, ...restLogger } = logger;

    const status =
      statusCode < 400
        ? "success"
        : statusCode >= 400 && statusCode < 500
        ? "warning"
        : "error";

    // Log the response or error
    centralizedLogger({
      category,
      message,
      status,
      details: restLogger,
    });
  }
};

export default loggerMiddleware;
