import 'babel-polyfill';
import bodyParser from 'body-parser';
import bugsnag from 'bugsnag';
import context, { createContextMiddleware } from 'wrap-async-context';
import errorHandler from 'api-error-handler';
import express from 'express';
import logger from './logger';
import morgan from 'morgan';
import util from 'util';
import uuid from 'node-uuid';

const defaultConfig = {
  after: () => null,
  afterHandlers: () => null,
  amazonJSON: false,
  before: () => null,
  beforeHandlers: () => null,
  bodyParser: bodyParser.json(),
  bugsnag: false,
  defaultContentType: 'application/json',
  errorHandler: errorHandler(),
  logFormat: 'short',
  name: false,
  ping: '/_____ping_____',
};

export default (options) => {
  const config = { ...defaultConfig, ...options };
  const app = express();
  const test = process.env.NODE_ENV === 'test';

  if (!test && config.bugsnag) bugsnag.register(config.bugsnag, {
    releaseStage: process.env.AWS_ENV || 'local',
    notifyReleaseStages: ['development', 'production', 'staging'],
    projectRoot: '/app',
    metaData: {
      get requestId() {
        return (context() || {}).id;
      },
    },
  });

  process.on('unhandledException', err =>
    logger.error(`Unhandled exception: ${(err && err.stack || util.inspect(err))}`));

  process.on('unhandledRejecion', err =>
    logger.error(`Unhandled rejection: ${(err && err.stack || util.inspect(err))}`));

  config.before(app);

  if (!test && config.bugsnag) app.use(bugsnag.requestHandler);
  if (!test) app.use(morgan(config.logFormat, { stream: logger.stream }));

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
  app.use(createContextMiddleware(uuid.v4));

  const wrap = handler => (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req))
      .then(({ payload = {}, status = 200 }) => res.status(status).json(payload))
      .catch(next);

  if (config.name) app.get('/', (req, res) => res.send(config.name));
  if (config.ping) app.get(config.ping, (req, res) => res.send('OK'));

  config.beforeHandlers(app);

  if (typeof config.handlers === 'function') {
    config.handlers(app, wrap);
  } else {
    throw new TypeError('config.handlers must be a function');
  }

  config.afterHandlers(app);

  if (!test && config.bugsnag) app.use(bugsnag.errorHandler);
  if (config.errorHandler) app.use(config.errorHandler);

  config.after(app);

  if (!test) {
    const port = process.env.PORT || config.defaultPort;
    const server = app.listen(port, () => {
      const host = server.address().address;
      logger.info(`${config.name || 'Service'} listening at http://${host}:${port}`);
    });
  }

  return app;
};
