import pino from "pino";
import { Logger, LoggerOptions, TransportMultiOptions } from "pino";
import Loggers from "./pino_loggers.json";

/**
 * Type for the `loggers.json` configuration file.
 */
interface LoggerConfig {
  [key: string]: string; // Example: { validation: "Validation", system: "System" }
}

/**
 * Type for the generated loggers object.
 */
interface LoggerInstances {
  [key: string]: Logger; // Each logger is an instance of `pino.Logger`
}

/**
 * Validates the `loggers.json` configuration and ensures it has the correct structure.
 *
 * @param config - The parsed loggers.json configuration.
 * @returns {LoggerConfig} - The validated logger configuration.
 * @throws {Error} - If the configuration is invalid.
 */
const validateLoggerConfig = (config: unknown): LoggerConfig => {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Invalid or missing `loggers.json` configuration.");
  }

  // Ensure all keys and values are strings
  Object.entries(config).forEach(([key, value]) => {
    if (typeof key !== "string" || typeof value !== "string") {
      throw new Error(`Invalid logger configuration: ${key} -> ${value}`);
    }
  });

  return config as LoggerConfig;
};

/**
 * Generates a date-based file path for logging.
 *
 * @param parent - The parent folder (e.g., "Validation", "System").
 * @param context - The context used for the file name prefix (e.g., "error", "info").
 * @returns {string} - The dynamically generated log file path.
 */
const generateLogFilePath = (parent: string, context: string): string => {
  try {
    const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    return `./logs/${parent}/${context}-${date}.log`;
  } catch (error) {
    console.error("Error generating log file path:", error);
    throw new Error("Failed to generate log file path.");
  }
};

/**
 * Creates transport configurations for different log levels.
 *
 * @param loggerField - The logger field name (e.g., "Validation").
 * @returns {TransportMultiOptions["targets"]} - Array of transport targets for pino.
 */
const createTransportConfig = (
  loggerField: string
): TransportMultiOptions["targets"] => {
  try {
    return [
      {
        target: "pino-pretty",
        options: {
          colorize: true, // Enable colored output
          translateTime: "SYS:standard", // Formats time as `YYYY-MM-DD HH:mm:ss`
        },
      },
      {
        target: "pino/file",
        level: "error",
        options: {
          destination: generateLogFilePath(loggerField, "error"),
          mkdir: true, // Automatically create missing directories
        },
      },
      {
        target: "pino/file",
        level: "warn",
        options: {
          destination: generateLogFilePath(loggerField, "warn"),
          mkdir: true,
        },
      },
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: generateLogFilePath(loggerField, "info"),
          mkdir: true,
        },
      },
    ];
  } catch (error) {
    console.error("Error creating transport configuration:", error);
    throw new Error("Failed to create transport configuration.");
  }
};

/**
 * Initializes a pino logger instance for a given context.
 *
 * @param loggerKey - The logger key (e.g., "validation").
 * @param loggerField - The logger display name (e.g., "Validation").
 * @returns {Logger} - Configured pino logger instance.
 */
const createLogger = (loggerKey: string, loggerField: string): Logger => {
  try {
    const options: LoggerOptions = {
      level: "debug", // Logs messages up to the "debug" level
      timestamp: pino.stdTimeFunctions.isoTime, // Use ISO time format for timestamps

      // Inject a "context" field based on the log level
      mixin(_context, level) {
        return { context: pino.levels.labels[level]?.toUpperCase() };
      },

      // Merge strategy to ensure flat logging structure
      mixinMergeStrategy(mergeObject, mixinObject) {
        return { ...mergeObject, ...mixinObject };
      },

      // Transport configurations
      transport: {
        targets: createTransportConfig(loggerField),
      },
    };

    return pino(options);
  } catch (error) {
    console.error(`Error creating logger for key "${loggerKey}":`, error);
    throw new Error(`Failed to create logger for "${loggerKey}".`);
  }
};

/**
 * Dynamically generates loggers based on the `loggers.json` configuration.
 *
 * @returns {LoggerInstances} - Object containing logger instances.
 */
const generateLoggers = (): LoggerInstances => {
  try {
    const config = validateLoggerConfig(Loggers);

    return Object.entries(config).reduce<LoggerInstances>(
      (acc, [loggerKey, loggerField]) => {
        if (!loggerKey || !loggerField) {
          console.warn(
            `Skipping invalid logger configuration: ${loggerKey} -> ${loggerField}`
          );
          return acc; // Skip invalid logger configuration
        }

        acc[loggerKey] = createLogger(loggerKey, loggerField);
        return acc;
      },
      {}
    );
  } catch (error) {
    console.error("Error generating loggers:", error);
    throw new Error("Failed to generate loggers.");
  }
};

/**
 * Initializes and exports the loggers.
 * Provides a centralized logging utility for different application contexts.
 */
let loggers: LoggerInstances = {};
try {
  loggers = generateLoggers();
} catch (error) {
  // console.error(
  //   "Failed to initialize loggers. Falling back to default console logger."
  // );
  // const fallbackLogger = pino({ level: "info" });
  // loggers = { default: fallbackLogger };

  console.error("Failed to initialize loggers:", error);
  process.exit(1); // Terminate the process if loggers fail to initialize
}

export default loggers;
