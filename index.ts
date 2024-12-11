import express, { Express, Request, Response, NextFunction } from "express";
import Loggers from "./pino_util";

const app: Express = express();
const port = process.env.PORT || 3000;

try {
  // Routes
  app.get("/validation", (req: Request, res: Response) => {
    Loggers.validationLogger.info(
      {
        code: "VALIDATION_KEY_SUCCESS",
        context: "Successull license key validation",
      },
      "The license key validated successfully"
    );
    res.send("Validation endpoint");
  });

  app.get("/authentication", (req: Request, res: Response) => {
    Loggers.authLogger.error(
      {
        code: "AUTH_LICENSE_NOT_FOUND",
        context: "license key not found",
      },
      "No matching license was found for the provided key."
    );
    res.send("Authentication endpoint");
  });

  app.get("/system", (req: Request, res: Response) => {
    Loggers.systemLogger.warn(
      {
        code: "SYSTEM_INVALID_CLOCK",
        context: "Invalid System Clock",
      },
      "The system clock is inaccurate. Check your system time."
    );
    res.send("System endpoint");
  });

  app.get("/usage", (req: Request, res: Response) => {
    Loggers.usageLogger.info(
      {
        code: "USAGE_RECORDED",
        context: "License Usage Recorded",
      },
      "Usage recorded successfully for license key."
    );
    res.send("Usage endpoint");
  });

  // Error handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    Loggers.systemLogger.error(
      {
        code: "SERVER_ERROR",
        context: "server error in express app",
        error: err,
      },
      "Unhandled exception"
    );
    res.status(500).send("Internal Server Error");
  });

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
