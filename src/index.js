import bodyParser from 'body-parser';
import bugsnag from 'bugsnag';
import context, { createContextMiddleware } from 'wrap-async-context';
import errorHandler from 'api-error-handler';
import express from 'express';
import logger from './logger';
import morgan from 'morgan';
import util from 'util';
import uuid from 'node-uuid';

import parseHandlers from './parseHandlers';

const defaultConfig = {
  after: () => null,
  amazonJSON: false,
  before: () => null,
  bodyParser: bodyParser.json(),
  bugsnag: false,
  logFormat: 'short',
  name: false,
  ping: '/_____ping_____',
  errorHandler: errorHandler(),
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

  process.env('unhandledRejecion', err =>
    logger.error(`Unhandled rejection: ${(err && err.stack || util.inspect(err))}`));

  options.before(app);

  if (!test && config.bugsnag) app.use(bugsnag.requestHandler);
  if (!test) app.use(morgan(config.logFormat, { stream: logger.stream }));

  /* eslint-disable no-param-reassign */
  if (config.amazonJSON) app.use((req, res, next) => {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';

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

  parseHandlers(config.handlers).forEach((method, url, handler) =>
    app[method](url, wrap(handler)));

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
