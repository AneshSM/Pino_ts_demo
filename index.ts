import express, { Express, Request, Response, NextFunction } from "express";
import Loggers from "./utils/pino_util";
import { ApiError } from "./utils/error_util";
import {
  ErrorCategory,
  errorHandler,
  errorLogger,
} from "./middleware/error.middleware";

const app: Express = express();
const port = 3000;
const simulateFailure = false;

try {
  // Routes
  app.get("/validation", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      Loggers.validationLogger.info(
        {
          code: "VALIDATION_KEY_SUCCESS",
          context: "Successull license key validation",
        },
        "The license key validated successfully"
      );
      res.send("Validation endpoint");
    } else
      next(
        new ApiError(
          500,
          "Simulated error: GET /validation request failure",
          null,
          null,
          {
            category: ErrorCategory.VALIDATION,
            code: "VALIDATION_KEY_SUCCESS",
            context: "Failed to get all jobs",
          }
        )
      );
  });

  app.get(
    "/authentication",
    (req: Request, res: Response, next: NextFunction) => {
      if (!simulateFailure) {
        Loggers.authLogger.error(
          {
            code: "AUTH_LICENSE_SUCCESS",
            context: "Successful authentication",
          },
          "Matching license was found for the provided key."
        );
        res.send("Authentication endpoint");
      } else
        next(
          new ApiError(
            500,
            "Simulated error: GET /authentication request failure",
            null,
            null,
            {
              category: ErrorCategory.AUTHENTICATION,
              code: "AUTH_LICENSE_NOT_FOUND",
              context: "license key not found",
              message: "No matching license was found for the provided key.",
            }
          )
        );
    }
  );

  app.get("/system", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      Loggers.systemLogger.warn(
        {
          code: "SYSTEM_CLOCK",
          context: "System Clock",
        },
        "The system clock: " + new Date().toLocaleString()
      );
      res.send("System endpoint");
    } else
      next(
        new ApiError(
          500,
          "Simulated error: GET /system request failure",
          null,
          null,
          {
            category: ErrorCategory.SYSTEM,
            code: "SYSTEM_INVALID_CLOCK",
            context: "Invalid System Clock",
            message: "The system clock is inaccurate. Check your system time.",
          }
        )
      );
  });

  app.get("/usage", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      Loggers.usageLogger.info(
        {
          code: "USAGE_RECORDED",
          context: "License Usage Recorded",
        },
        "Usage recorded successfully for license key."
      );
      res.send("Usage endpoint");
    } else
      next(
        new ApiError(
          500,
          "Simulated error: GET /uasge request failure",
          null,
          null,
          {
            category: ErrorCategory.USAGE,
            code: "USAGE_QUOTA_EXCEEDED",
            context: "License Quota Exceeded",
            message: "License usage limit exceeded.",
          }
        )
      );
  });

  app.get("/user/:id", (req: Request, res: Response, next: NextFunction) => {
    if (!simulateFailure) {
      const userId = req.params.id;
      Loggers?.usageLogger?.info(
        {
          code: "USER_DATA_ACCESS",
          context: "user data api call",
          user: {
            userId,
            password: "1234",
            ssn: "65432vsdc",
          },
          metadata: {
            secretKey: "cscdcsdwq3453",
          },
        },
        "Fetching user data"
      );
      res.send(`User data for user ${userId}`);
    } else
      next(
        new ApiError(
          500,
          "Simulated error: GET /user/:id request failure",
          null,
          null,
          {
            category: ErrorCategory.USAGE,
            code: "USER_DATA_ACCESS_ERROR",
            context: "Failed to valdate user access",
            message: "Unauthorized user access",
          }
        )
      );
  });

  // Error logs handler
  app.use(errorLogger);
  // Error handler
  app.use(errorHandler);

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
