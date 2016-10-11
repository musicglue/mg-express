import winston from 'winston';
import config, { subscribe } from './config';

const Papertrail = require('winston-papertrail').Papertrail;

const consoleLogger = new winston.transports.Console({
  colorize: true,
  handleExceptions: process.env.NODE_ENV !== 'test',
  json: false,
  prettyPrint: process.env.NODE_ENV !== 'production',
});

const transports = [consoleLogger];

function ensureLogLevel(level) {
  return level || 'info';
}

if (process.env.NODE_ENV === 'production' && process.env.PAPERTRAIL_HOST) {
  transports.push(new Papertrail({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    program: process.env.PAPERTRAIL_PROGRAM,
    level: ensureLogLevel(config('LOG_LEVEL')),
    logFormat: (level, message) => `[${level}] ${message}`,
  }));
}

const logger = new winston.Logger({
  transports,
  level: ensureLogLevel(config('LOG_LEVEL')),
  exitOnError: false,
});

subscribe('LOG_LEVEL', level => {
  logger.level = ensureLogLevel(level);
  transports.forEach(transport => { transport.level = ensureLogLevel(level); }); // eslint-disable-line
});

logger.stream = {
  write: (message) => logger.info(message),
};

export default logger;
