'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _wrapAsyncContext = require('wrap-async-context');

var _wrapAsyncContext2 = _interopRequireDefault(_wrapAsyncContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Papertrail = require('winston-papertrail').Papertrail;

const consoleLogger = new _winston2.default.transports.Console({
  colorize: true,
  handleExceptions: process.env.NODE_ENV !== 'test',
  json: false,
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production'
});

const transports = [consoleLogger];

if (process.env.NODE_ENV === 'production') {
  transports.push(new Papertrail({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    program: process.env.PAPERTRAIL_PROGRAM,
    level: process.env.LOG_LEVEL || 'info',
    logFormat: (level, message) => `[${ level }][id:${ ((0, _wrapAsyncContext2.default)() || {}).id }] ${ message }`
  }));
}

const logger = new _winston2.default.Logger({
  transports,
  exitOnError: false
});

logger.stream = {
  write: message => logger.info(message)
};

exports.default = logger;