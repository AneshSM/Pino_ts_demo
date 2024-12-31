import { BaseLogger, LogFn, Logger, LoggerExtras } from "pino";

interface LoggerMethodRequiredKey {
  trace?: string[];
  debug?: string[];
  info?: string[];
  warn?: string[];
  error?: string[];
  fatal?: string[];
}

type LoggerMethod = keyof LoggerMethodRequiredKey;

/**
 * Type for the `loggers.json` configuration file.
 */
interface LoggerConfig {
  common: {
    requiredFields?: LoggerMethodRequiredKey;
    redactFields?: string[];
  };
  loggers: {
    [key: string]: {
      category: string;
      customRequiredFields?: LoggerMethodRequiredKey;
      redactFields?: string[];
    };
  };
}

/**
 * Type for the generated loggers object.
 */
interface LoggerInstances {
  [key: string]: Logger; // Each logger is an instance of `pino.Logger`
}

// Compile time validation types for logger methods

type CommonRequiredData = {
  code: string;
  context: string;
  [key: string]: any;
};

type ValidationLoggerMethods = {
  info: (obj: CommonRequiredData, msg: string) => void;
  warn: (
    obj: CommonRequiredData & {
      action?: string;
      reason?: string;
    },
    msg: string
  ) => void;
  error: (
    obj: CommonRequiredData & { action?: string; error?: Error },
    msg: string
  ) => void;
};
type AuthLoggerMethods = {
  info: (obj: CommonRequiredData, msg: string) => void;
  warn: (
    obj: CommonRequiredData & {
      method?: string;
      reason?: string;
    },
    msg: string
  ) => void;
  error: (
    obj: CommonRequiredData & { method?: string; error?: Error },
    msg: string
  ) => void;
};
type SystemLoggerMethods = {
  info: (obj: CommonRequiredData, msg: string) => void;
  warn: (
    obj: CommonRequiredData & {
      method?: string;
      reason?: string;
    },
    msg: string
  ) => void;
  error: (
    obj: CommonRequiredData & { method?: string; error?: Error },
    msg: string
  ) => void;
  fatal: (
    obj: CommonRequiredData & { method?: string; error?: Error },
    msg: string
  ) => void;
};
type UsageLoggerMethods = {
  info: (obj: CommonRequiredData, msg: string) => void;
  warn: (
    obj: CommonRequiredData & {
      reason?: string;
    },
    msg: string
  ) => void;
  error: (
    obj: CommonRequiredData & { method?: string; error?: Error },
    msg: string
  ) => void;
};

// Extend other loggers similarly based on the schema
type LoggersType = {
  validationLogger: LoggerExtras & ValidationLoggerMethods;
  authLogger: LoggerExtras & AuthLoggerMethods;
  systemLogger: LoggerExtras & SystemLoggerMethods;
  usageLogger: LoggerExtras & UsageLoggerMethods;
};

export {
  LoggerConfig,
  LoggerInstances,
  LoggerMethodRequiredKey,
  LoggerMethod,
  LoggersType,
};
