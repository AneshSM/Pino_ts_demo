import pino, {
  Logger,
  LoggerOptions,
  TransportMultiOptions,
  LogFn,
} from "pino";
import Loggers from "../config/pino_loggers.json";
import {
  LoggerConfig,
  LoggerInstances,
  LoggerMethod,
  LoggersType,
  LoggerMethodRequiredKey,
} from "../utils/pino_util_types";

/**
 * @interface LoggerData
 * @property {string} category
 * @property {string} code
 * @property {string} context
 * @property {string | undefined} message
 */
export interface LoggerData {
  category: string;
  code: string;
  context: string;
  message?: string;
  [key: string]: any;
}

// Enum for Error Categories
export enum loggerCategory {
  SYSTEM = "system",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  USAGE = "usage",
}

/**
 * Validates the meta data passed to the logger wrapper before passing to pino
 * methods and ensures it has the required fields.
 *
 * @param loggerKey - logger key of pino_loggers.json object
 * @param method - avaialbe logger methods
 * @param schema - logger schema as pino_loggers.json structure
 * @param obj - logger key defined in pino_loggers.json
 * @throws {Error} - If the configuration is invalid.
 */
const validateFields = (
  loggerKey: string,
  method: keyof LoggerMethodRequiredKey,
  schema: LoggerConfig,
  obj: Record<string, unknown>
): void => {
  try {
    const loggerConfig = schema?.loggers?.[loggerKey];
    const commonRequiredFields = schema?.common?.requiredFields?.[method] || [];
    const customRequiredFields =
      loggerConfig?.customRequiredFields?.[method] || [];

    // Merge common and custom fields (custom overrides common if specified)
    const requiredFields = [
      ...new Set([...commonRequiredFields, ...customRequiredFields]),
    ];

    // const requiredFields = schema[loggerKey]?.["required"]?.[method] || [];
    if (typeof obj !== "object" || !obj) {
      if (requiredFields?.length > 0)
        throw new Error(
          `Missing required fields for ${loggerKey}.${method}: ${requiredFields.join(
            ", "
          )}`
        );
    } else {
      const missingFields = requiredFields.filter((field) => !(field in obj));

      if (missingFields?.length > 0) {
        throw new Error(
          `Missing required fields for ${loggerKey}.${method}: ${missingFields.join(
            ", "
          )}`
        );
      }
    }
  } catch (error) {
    console.log("Error while validating fields", error);
    throw error;
  }
};

/**
 * Wraps a pino logger method with validation logic.
 * Which will validate the data before passing it to the pion logger function
 *
 * @param originalFn - The original logger method (info/warn/error).
 * @param loggerKey - The logger name (e.g., "validationLogger").
 * @param method - The method being wrapped (info/warn/error).
 * @returns {LogFn} - The wrapped logger method.
 */
const wrapLoggerMethod =
  (originalFn: LogFn, loggerKey: string, method: LoggerMethod): LogFn =>
  (obj: unknown, msg?: string, ...args: any[]) => {
    try {
      validateFields(
        loggerKey,
        method,
        Loggers as LoggerConfig,
        obj as Record<string, unknown>
      );
      return originalFn(obj, msg, ...args);
    } catch (error) {
      throw error;
    }
  };

/**
 * Dynamically wraps logger methods with validation logic.
 *
 * @param logger - The original logger instance.
 * @param loggerKey - The logger name (e.g., "validationLogger").
 * @returns {Logger} - The wrapped logger instance.
 */
const wrapLogger = (logger: Logger, loggerKey: string): Logger => {
  const wrappedLogger = logger.child({}); // Clone the logger instance for better isolation and thread saftey

  (
    ["info", "warn", "error", "debug", "fatal", "trace"] as LoggerMethod[]
  ).forEach((method) => {
    wrappedLogger[method] = wrapLoggerMethod(
      logger[method].bind(logger),
      loggerKey,
      method
    ) as LogFn;
  });

  return wrappedLogger;
};

/**
 * Validates the `loggers.json` configuration and ensures it has the correct structure.
 *
 * @param config - The parsed loggers.json configuration.
 * @returns {LoggerConfig} - The validated logger configuration.
 * @throws {Error} - If the configuration is invalid.
 */
const validateLoggerConfig = (config: LoggerConfig): LoggerConfig => {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Invalid or missing `loggers.json` configuration.");
  }

  // Ensure all keys and values are strings
  Object.entries(config.loggers).forEach(([key, value]) => {
    if (
      typeof key !== "string" ||
      typeof value !== "object" ||
      !value.category
    ) {
      throw new Error(`Invalid logger configuration: ${key} -> ${value}`);
    }
  });

  return config;
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
    return `./logs/${parent}/${context}/${context}-${date}.log`;
  } catch (error) {
    console.error("Error generating log file path:", error);
    throw new Error("Failed to generate log file path.");
  }
};

/**
 * Creates transport configurations for different log levels.
 *
 * @param loggerCategory - The logger field name (e.g., "Validation").
 * @returns {TransportMultiOptions["targets"]} - Array of transport targets for pino.
 */
const createTransportConfig = (
  loggerCategory: string
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
          destination: generateLogFilePath(loggerCategory, "error"),
          mkdir: true, // Automatically create missing directories
        },
        worker: {
          autoEnd: true, // Enables auto-closing of the worker when the process ends
        },
      },
      {
        target: "pino/file",
        level: "warn",
        options: {
          destination: generateLogFilePath(loggerCategory, "warn"),
          mkdir: true,
        },
        worker: {
          autoEnd: true, // Enables auto-closing of the worker when the process ends
        },
      },
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: generateLogFilePath(loggerCategory, "info"),
          mkdir: true,
        },
        worker: {
          autoEnd: true, // Enables auto-closing of the worker when the process ends
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
 * @param loggerCategory - The logger display name (e.g., "Validation").
 * @param {string[]} redactFields - Fields to redact in the logs.
 * @returns {Logger} - Configured pino logger instance.
 */
const createLogger = (
  loggerKey: string,
  loggerCategory: string,
  redactFields: string[] = []
): Logger => {
  try {
    const options: LoggerOptions = {
      level: "debug", // Logs messages up to the "debug" level
      customLevels: {}, // Add custom levels here if needed
      timestamp: () => `,"time":"${new Date().toLocaleString()}"`, //local machine date
      errorKey: "error", // The string key for the 'error' in the JSON object.

      // Inject a "type" field based on the log level
      mixin(_context, level) {
        return { type: pino.levels.labels[level]?.toUpperCase() };
      },
      // Merge strategy to ensure flat logging structure
      mixinMergeStrategy(mergeObject, mixinObject) {
        return { ...mergeObject, ...mixinObject };
      },

      // Redact sensitive fields
      redact: {
        paths: redactFields,
        censor: "[Redacted]", // Replace sensitive fields with this value
      },

      // Transport configurations
      transport: {
        targets: createTransportConfig(loggerCategory),
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
    const { loggers: loggersConfig, common: commonConfig } = config;
    return Object.entries(loggersConfig).reduce<LoggerInstances>(
      (acc, [loggerKey, loggerConfig]) => {
        if (!loggerKey || !loggerConfig || !loggerConfig.category) {
          console.warn(
            `Skipping invalid logger configuration: ${loggerKey} -> ${loggerConfig}`
          );
          return acc; // Skip invalid logger configuration
        }
        const { category, redactFields = [] } = loggerConfig;
        const logger = createLogger(loggerKey, category, [
          ...(commonConfig?.redactFields || []),
          ...redactFields,
        ]);
        acc[loggerKey] = wrapLogger(logger, loggerKey);
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
let loggers: LoggersType;

try {
  loggers = generateLoggers() as unknown as LoggersType;
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
