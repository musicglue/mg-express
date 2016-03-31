'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _bugsnag = require('bugsnag');

var _bugsnag2 = _interopRequireDefault(_bugsnag);

var _wrapAsyncContext = require('wrap-async-context');

var _wrapAsyncContext2 = _interopRequireDefault(_wrapAsyncContext);

var _apiErrorHandler = require('api-error-handler');

var _apiErrorHandler2 = _interopRequireDefault(_apiErrorHandler);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _parseHandlers = require('./parseHandlers');

var _parseHandlers2 = _interopRequireDefault(_parseHandlers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultConfig = {
  after: () => null,
  afterHandlers: () => null,
  amazonJSON: false,
  before: () => null,
  beforeHandlers: () => null,
  bodyParser: _bodyParser2.default.json(),
  bugsnag: false,
  defaultContentType: 'application/json',
  errorHandler: (0, _apiErrorHandler2.default)(),
  logFormat: 'short',
  name: false,
  ping: '/_____ping_____'
};

exports.default = options => {
  const config = _extends({}, defaultConfig, options);
  const app = (0, _express2.default)();
  const test = process.env.NODE_ENV === 'test';

  if (!test && config.bugsnag) _bugsnag2.default.register(config.bugsnag, {
    releaseStage: process.env.AWS_ENV || 'local',
    notifyReleaseStages: ['development', 'production', 'staging'],
    projectRoot: '/app',
    metaData: {
      get requestId() {
        return ((0, _wrapAsyncContext2.default)() || {}).id;
      }
    }
  });

  process.on('unhandledException', err => _logger2.default.error(`Unhandled exception: ${ err && err.stack || _util2.default.inspect(err) }`));

  process.on('unhandledRejecion', err => _logger2.default.error(`Unhandled rejection: ${ err && err.stack || _util2.default.inspect(err) }`));

  config.before(app);

  if (!test && config.bugsnag) app.use(_bugsnag2.default.requestHandler);
  if (!test) app.use((0, _morgan2.default)(config.logFormat, { stream: _logger2.default.stream }));

  /* eslint-disable no-param-reassign */
  if (config.defaultContentType) app.use((req, res, next) => {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';
    next();
  });

  if (config.amazonJSON) app.use((req, res, next) => {
    if (req.headers['user-agent'].indexOf('Amazon') > -1) {
      req.headers['content-type'] = 'application/json';
    }

    next();
  });
  /* eslint-enable no-param-reassign */

  if (config.bodyParser) app.use(config.bodyParser);
  app.use((0, _wrapAsyncContext.createContextMiddleware)(_nodeUuid2.default.v4));

  const wrap = handler => (req, res, next) => Promise.resolve().then(() => handler(req)).then(_ref => {
    var _ref$payload = _ref.payload;
    let payload = _ref$payload === undefined ? {} : _ref$payload;
    var _ref$status = _ref.status;
    let status = _ref$status === undefined ? 200 : _ref$status;
    return res.status(status).json(payload);
  }).catch(next);

  if (config.name) app.get('/', (req, res) => res.send(config.name));
  if (config.ping) app.get(config.ping, (req, res) => res.send('OK'));

  config.beforeHandlers(app);

  if (typeof config.handlers === 'function') {
    config.handlers(app, wrap);
  } else if (typeof config.handlers === 'object') {
    (0, _parseHandlers2.default)(config.handlers).forEach(_ref2 => {
      let method = _ref2.method;
      let url = _ref2.url;
      let handler = _ref2.handler;
      return app[method](url, wrap(handler));
    });
  } else {
    throw new TypeError('config.handlers must be a function or an object');
  }

  config.afterHandlers(app);

  if (!test && config.bugsnag) app.use(_bugsnag2.default.errorHandler);
  if (config.errorHandler) app.use(config.errorHandler);

  config.after(app);

  if (!test) {
    const port = process.env.PORT || config.defaultPort;
    const server = app.listen(port, () => {
      const host = server.address().address;
      _logger2.default.info(`${ config.name || 'Service' } listening at http://${ host }:${ port }`);
    });
  }

  return app;
};