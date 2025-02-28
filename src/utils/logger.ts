/**
 * Utility for controlling log output based on environment
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.error(...args);
    }
  },
};
