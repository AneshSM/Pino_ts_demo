import { Request, Response, NextFunction } from "express";
import loggers, { loggerCategory } from "../utils/pino_util";

// Type for the logger data in the response
type LoggerData = {
  category: loggerCategory;
  code: string;
  context: string;
  message?: string;
  [key: string]: any;
};

// Extend the Express Response object to include a `logger` property
declare module "express-serve-static-core" {
  interface Response {
    logger?: LoggerData | null;
  }
}

/**
 * Helper function to get the appropriate logger method based on category
 * @param {loggerCategory} category
 * @returns {Function | undefined}
 */
const getResponseLoggerInfoMethod = (category: loggerCategory) => {
  const logCategory: { [key in loggerCategory]: any } = {
    [loggerCategory.SYSTEM]: loggers.systemLogger,
    [loggerCategory.AUTHENTICATION]: loggers.authLogger,
    [loggerCategory.VALIDATION]: loggers.validationLogger,
    [loggerCategory.USAGE]: loggers.usageLogger,
  };

  return logCategory[category]?.info;
};

/**
 * Response Logger Middleware
 * Logs response details if logger property exists in the response object
 */
export const responseLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Intercept the response once it's finished
  const originalSend = res.send;

  res.send = function (body: any): any {
    if (res?.logger) {
      const { logger } = res;
      const { category, message: loggerMessage, ...loggerData } = logger;

      const message =
        loggerMessage || `Response logged for status: ${res.statusCode}`;

      const logMethod = getResponseLoggerInfoMethod(category);
      if (logMethod) {
        logMethod(
          { ...loggerData, statusCode: res.statusCode, response: body },
          message
        );
      }

      // Clear logger to prevent re-logging
      res.logger = null;
    }

    // Proceed with the original `res.send` call
    return originalSend.call(this, body);
  };

  next();
};
