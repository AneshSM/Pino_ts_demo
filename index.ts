import express, { Express, Request, Response, NextFunction } from "express";
import Loggers, { loggerCategory } from "./utils/pino_util";
import { ApiError, AuthError, ValidationError } from "./utils/error_util";
import loggerMiddleware, { ApiResponse } from "./middleware/logger.middleware";
import responseErrorHandler from "./middleware/responseError.middleware";

const app: Express = express();
const port = 3000;
const simulateFailure = false;

try {
  // Routes
  app.get("/", (req, res, next) => {
    if (!simulateFailure) {
      // Direct logger usage
      Loggers.systemLogger.info(
        { code: "HEALTH_CHECK", context: "health check call" },
        "Health check"
      );
      next(
        new ApiResponse({
          statusCode: 200,
          message: "GET / request received",
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "ROOT_API",
              context: "root api call",
            },
          },
        })
      );
    } else {
      // Centralized error logger middleware usage
      next(
        new ApiError({
          statusCode: 500,
          message: "Simulated error: GET / request failure",
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "USAGE_ROOT_ERROR",
              context: "Failed to get root",
            },
          },
        })
      );
    }
  });
  app.get("/validation", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      next(
        new ApiResponse({
          statusCode: 200,
          message: "Validation endpoint",
          options: {
            logger: {
              category: loggerCategory.VALIDATION,
              code: "VALIDATION_KEY_SUCCESS",
              context: "Successull license key validation",
              message: "The license key validated successfully",
            },
          },
        })
      );
    } else
      next(
        new ApiError({
          statusCode: 500,
          message: "Simulated error: GET /validation request failure",
          options: {
            error: new ValidationError({
              statusCode: 400,
              message: "Validation failed",
            }),
            logger: {
              category: loggerCategory.VALIDATION,
              code: "VALIDATION_KEY_SUCCESS",
              context: "Failed to validate key",
            },
          },
        })
      );
  });

  app.get(
    "/authentication",
    (req: Request, res: Response, next: NextFunction) => {
      if (!simulateFailure) {
        next(
          new ApiResponse({
            statusCode: 200,
            message: "Authentication endpoint",
            options: {
              logger: {
                category: loggerCategory.AUTHENTICATION,
                code: "AUTH_LICENSE_SUCCESS",
                context: "Successful authentication",
                message: "Matching license was found for the provided key.",
              },
            },
          })
        );
      } else
        next(
          new ApiError({
            statusCode: 500,
            message: "Simulated error: GET /authentication request failure",
            options: {
              error: new AuthError({
                statusCode: 500,
                message: "Unauthorized user",
              }),
              logger: {
                category: loggerCategory.AUTHENTICATION,
                code: "AUTH_LICENSE_NOT_FOUND",
                context: "license key not found",
                message: "No matching license was found for the provided key.",
              },
            },
          })
        );
    }
  );

  app.get("/system", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      next(
        new ApiResponse({
          statusCode: 200,
          message: "System endpoint",
          options: {
            logger: {
              category: loggerCategory.SYSTEM,
              code: "SYSTEM_CLOCK",
              context: "System Clock",
              message: "The system clock: " + new Date().toLocaleString(),
            },
          },
        })
      );
    } else
      next(
        new ApiError({
          statusCode: 500,
          message: "Simulated error: GET /system request failure",
          options: {
            logger: {
              category: loggerCategory.SYSTEM,
              code: "SYSTEM_INVALID_CLOCK",
              context: "Invalid System Clock",
              message:
                "The system clock is inaccurate. Check your system time.",
            },
          },
        })
      );
  });

  app.get("/usage", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      next(
        new ApiResponse({
          statusCode: 200,
          message: "Usage endpoint",
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "USAGE_RECORDED",
              context: "License Usage Recorded",
              message: "Usage recorded successfully for license key.",
            },
          },
        })
      );
    } else
      next(
        new ApiError({
          statusCode: 500,
          message: "Simulated error: GET /uasge request failure",
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "USAGE_QUOTA_EXCEEDED",
              context: "License Quota Exceeded",
              message: "License usage limit exceeded.",
            },
          },
        })
      );
  });

  app.get("/user/:id", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      const userId = req.params.id;
      next(
        new ApiResponse({
          statusCode: 200,
          message: `User data for user ${userId}`,
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "USER_DATA_ACCESS",
              context: "user data api call",
              message: "Fetching user data",
              metadata: {
                secretKey: "cscdcsdwq3453",
                user: {
                  userId,
                  password: "1234",
                  ssn: "65432vsdc",
                },
              },
            },
          },
        })
      );
    } else
      next(
        new ApiError({
          statusCode: 500,
          message: "Simulated error: GET /user/:id request failure",
          options: {
            logger: {
              category: loggerCategory.USAGE,
              code: "USER_DATA_ACCESS_ERROR",
              context: "Failed to valdate user access",
              message: "Unauthorized user access",
            },
          },
        })
      );
  });

  // Response and Error logs handler
  app.use(loggerMiddleware);
  // Response and Error handler
  app.use(responseErrorHandler);

  // Unhandled exceptions and rejections
  process.on("uncaughtException", (error) => {
    Loggers.systemLogger.error(
      { code: "UNCAUGHT_EXCEPTION", context: "uncaught exception", error },
      "Uncaught Exception"
    );
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: any) => {
    Loggers.systemLogger.warn(
      { code: "UNHANDLED_REJECTION", context: "unhandled rejection", reason },
      "Unhandled Rejection"
    );
  });

  // Start the server
  app.listen(port, () => {
    Loggers.systemLogger.info(
      { code: "INITIATE_SERVER", context: "server started" },
      `Server is running on http://localhost:${port}`
    );
  });
} catch (error) {
  console.log("caught error", error);
}
