export const logger = {
  warn: (message: string, ...error: [error?: unknown]): void => {
    console.warn(`[max-chat] ${message}`, ...error);
  },
};
