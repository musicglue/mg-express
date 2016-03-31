import winston from 'winston';
import context from 'wrap-async-context';

const Papertrail = require('winston-papertrail').Papertrail;

const consoleLogger = new winston.transports.Console({
  colorize: true,
  handleExceptions: process.env.NODE_ENV !== 'test',
  json: false,
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production',
});

const transports = [consoleLogger];

if (process.env.NODE_ENV === 'production') {
  transports.push(new Papertrail({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    program: process.env.PAPERTRAIL_PROGRAM,
    level: process.env.LOG_LEVEL || 'info',
    logFormat: (level, message) => `[${level}][id:${(context() || {}).id}] ${message}`,
  }));
}

const logger = new winston.Logger({
  transports,
  exitOnError: false,
});

logger.stream = {
  write: (message) => logger.info(message),
};

export default logger;
