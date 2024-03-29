import "babel-polyfill";
import bodyParser from "body-parser";
import bugsnag from "bugsnag";
import cluster from "cluster";
import express from "express";
import morgan from "morgan";
import os from "os";
import util from "util";

import * as datadog from "./datadog";
import * as metrics from "./metrics";
import errorHandler from "./errorHandler";
import logger from "./logger";
import pingResponder from "./pingResponder";
import setupCluster from "./setupCluster";
import { bootstrapConsul } from "./config";

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
  bugsnagFilters: [],
  bugsnagIgnore: [],
  cluster: !!process.env.CLUSTER,
  clusterSize: Math.max(
    1,
    parseInt(process.env.CLUSTER_SIZE || os.cpus().length - 1, 10)
  ),
  consul: null,
  datadog: null,
  datadogMiddleware: true,
  defaultContentType: "application/json",
  errorHandler,
  healthSignalHandling: !!process.env.SIGNAL_BASED_HEALTH,
  listen: null,
  logFormat: "short",
  name: false,
  ping: "/_____ping_____",
  customPingPath: false,
  profilingEnabled: !!process.env.PROFILING_ENABLED,
  statsd: null,
  statsdMiddleware: true,
};

const baseBugsnagFilters = ["password", "card"];

export default (options) => {
  const config = { ...defaultConfig, ...options };
  const app = express();
  const test = process.env.NODE_ENV === "test";
  const releaseStage = process.env.AWS_ENV || "local";

  if (!test && config.consul) bootstrapConsul(config.consul);

  if (!test && config.bugsnag)
    bugsnag.register(config.bugsnag, {
      releaseStage,
      notifyReleaseStages: releaseStage !== "local" ? [releaseStage] : [],
      projectRoot: "/app",
      filters: [...baseBugsnagFilters, ...config.bugsnagFilters],
      sendCode: true,
    });

  if (config.bugsnag)
    bugsnag.onBeforeNotify((notification) => {
      const [event] = notification.events;
      const [error] = event.exceptions;
      return !config.bugsnagIgnore.includes(error.errorClass);
    });

  process.on("uncaughtException", (err) =>
    logger.error(
      `Uncaught exception: ${(err && err.stack) || util.inspect(err)}`
    )
  );

  process.on("unhandledRejection", (err) =>
    logger.error(
      `Unhandled rejection: ${(err && err.stack) || util.inspect(err)}`
    )
  );

  if (config.cluster && cluster.isMaster) {
    setupCluster(config.clusterSize);
    return null;
  }

  if (!test && config.statsd) metrics.setup(config.statsd);

  config.before(app);

  if (!test && config.bugsnag) app.use(bugsnag.requestHandler);
  if (!test) {
    app.use(
      morgan(config.logFormat, {
        skip(req) {
          return (
            (config.customPingPath &&
              req.path === config.customPingPath &&
              process.env.LOG_LEVEL !== "debug") ||
            (config.ping &&
              req.path === config.ping &&
              process.env.LOG_LEVEL !== "debug")
          );
        },
        stream: logger.stream,
      })
    );
  }

  if (config.name) app.get("/", (req, res) => res.send(config.name));
  if (config.ping) app.get(config.ping, pingResponder(config));

  if (!test && config.statsd && config.statsdMiddleware)
    app.use(metrics.middleware);
  if (!test && config.datadog && config.datadogMiddleware) {
    app.use(datadog.middlewareFactory(config.datadog));
  }

  /* eslint-disable no-param-reassign */
  if (config.defaultContentType)
    app.use((req, res, next) => {
      req.headers["content-type"] =
        req.headers["content-type"] || "application/json";
      next();
    });

  if (config.amazonJSON)
    app.use((req, res, next) => {
      if (
        req.headers["user-agent"] &&
        req.headers["user-agent"].indexOf("Amazon") > -1
      ) {
        req.headers["content-type"] = "application/json";
      }

      next();
    });
  /* eslint-enable no-param-reassign */

  if (config.bodyParser) app.use(config.bodyParser);

  const wrap = (handler) => (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req))
      .then(({ payload = {}, status = 200 }) =>
        res.status(status).json(payload)
      )
      .catch(next);

  config.beforeHandlers(app);

  if (typeof config.handlers === "function") {
    config.handlers(app, wrap);
  } else {
    throw new TypeError("config.handlers must be a function");
  }

  config.afterHandlers(app);

  if (!test && config.bugsnag) app.use(bugsnag.errorHandler);
  if (config.errorHandler) app.use(config.errorHandler(config.name));

  config.after(app);

  if (!test) {
    Promise.resolve(config.beforeListen()).then(() => {
      // eslint-disable-line consistent-return
      const port = process.env.PORT || config.defaultPort;
      if (config.listen) return config.listen(app, port);
      const server = app.listen(port, () => {
        const host = server.address().address;
        logger.info(
          `${
            config.name || "Service"
          } listening at http://${host}:${port}  (pid: ${process.pid})`
        );
      });
    });
  }

  return app;
};
