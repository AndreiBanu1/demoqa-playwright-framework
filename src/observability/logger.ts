import pino from 'pino';

const isCI = Boolean(process.env.CI);

export const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: ['password', 'token', 'authorization', '*.password', '*.token', 'headers.cookie'],
      censor: '[redacted]',
    },
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  isCI
    ? pino.destination({ dest: './artifacts/run.log', mkdir: true, sync: true })
    : pino.transport({ target: 'pino-pretty', options: { colorize: true } }),
);
