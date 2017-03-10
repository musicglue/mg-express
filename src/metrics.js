import StatsD from 'hot-shots';
import logger from './logger';

let statsd = null;

export const setup = ({ host, port, prefix, opts = {} }) => {
  if (!(host && port)) {
    logger.debug('[metrics] setup called without statsd host and port');
    return;
  }

  statsd = new StatsD({
    ...opts,
    host,
    port,
    prefix: `${prefix}.`,
  });
};

const reporter = type => (stat, value) => (statsd ? statsd[type](stat, value) : true);

export const timing = reporter('timing');
export const increment = reporter('increment');
export const decrement = reporter('decrement');
export const histogram = reporter('histogram');
export const gauge = reporter('gauge');
export const set = reporter('set');
export const unique = reporter('unique');

const START_TIME = Symbol();

/* eslint-disable no-param-reassign */
export const middleware = (req, res, next) => {
  if (!req[START_TIME]) req[START_TIME] = Date.now();

  increment('requestStart');

  const end = res.end;
  res.end = (chunk, encoding) => {
    res.end = end;
    res.end(chunk, encoding);

    const method = req.method.toLowerCase();
    const route = ((req.route && req.route.path) || 'UNKNOWN_ROUTE')
      .replace(/[^a-zA-Z0-9]+/g, '_');

    timing(
      `routes.${method}.${route}`,
      Date.now() - req[START_TIME],
      [`status:${res.statusCode}`]
    );
  };

  next();
};
