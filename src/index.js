import 'babel-polyfill';
import 'trace';
import 'clarify';
import bodyParser from 'body-parser';
import bugsnag from 'bugsnag';
import cluster from 'cluster';
import express from 'express';
import morgan from 'morgan';
import util from 'util';
import uuid from 'node-uuid';

import errorHandler from './error-handler';
import logger from './logger';
import setupCluster from './setup-cluster';
import setupProfiler  from './profiler';
import { bootstrapConsul } from './config';

import Bluebird from 'bluebird';

global.Promise = Bluebird;
Error.stackTraceLimit = 1000;

const defaultConfig = {
  after: () => null,
  afterHandlers: () => null,
  amazonJSON: false,
  before: () => null,
  beforeHandlers: () => null,
  beforeListen: () => null,
  bodyParser: bodyParser.json(),
  bugsnag: false,
  bugsnagIgnore: [],
  bugsnagFilters: ['password', 'card'],
  consul: null,
  defaultContentType: 'application/json',
  errorHandler,
  listen: null,
  logFormat: 'short',
  name: false,
  ping: '/_____ping_____',
  profilingEnabled: !!process.env.PROFILING_ENABLED,
  promisify: [],
  cluster: !!(process.env.NODE_ENV === 'production' || process.env.CLUSTER),
};

export default (options) => {
  const config = { ...defaultConfig, ...options };
  const app = express();
  const test = process.env.NODE_ENV === 'test';

  config.promisify.forEach(module =>
    Bluebird.promisifyAll(require(module))); // eslint-disable-line global-require

  if (!test && config.consul) bootstrapConsul(config.consul);
  if (!test && config.consul && config.profilingEnabled) setupProfiler();

  if (!test && config.bugsnag) bugsnag.register(config.bugsnag, {
    releaseStage: process.env.AWS_ENV || 'local',
    notifyReleaseStages: ['development', 'production', 'staging'],
    projectRoot: '/app',
    filters: config.bugsnagFilters,
    sendCode: true,
  });

  if (config.bugsnag) bugsnag.onBeforeNotify(notification => {
    const [event] = notification.events;
    const [error] = event.exceptions;
    return !config.bugsnagIgnore.includes(error.errorClass);
  });

  process.on('unhandledException', err =>
    logger.error(`Unhandled exception: ${(err && err.stack || util.inspect(err))}`));

  process.on('unhandledRejecion', err =>
    logger.error(`Unhandled rejection: ${(err && err.stack || util.inspect(err))}`));

  if (config.cluster && cluster.isMaster) {
    setupCluster();
    return null;
  }

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
  if (config.errorHandler) app.use(config.errorHandler(config.name));

  config.after(app);

  if (!test) {
    Promise.resolve(config.beforeListen())
      .then(() => { // eslint-disable-line consistent-return
        const port = process.env.PORT || config.defaultPort;
        if (config.listen) return config.listen(app, port);
        const server = app.listen(port, () => {
          const host = server.address().address;
          logger.info(`${config.name || 'Service'} listening at http://${host}:${port}  (pid: ${process.pid})`);
        });
      });
  }

  return app;
};
