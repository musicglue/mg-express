import dogapi from 'dogapi';
import os from 'os';

import logger from './logger';

const FLUSH_INTERVAL = 10000;
const host = os.hostname();

let defaultTags = [];
let isSetup = false;
let queues = {};

const flushQueue = () => {
  const metrics = Object.values(queues);
  queues = {};
  if (metrics.length > 0 && isSetup) {
    logger.debug(`[metrics] Sending ${metrics.length} metric sets to datadog...`);
    dogapi.metric.send_all(metrics, (err, res) => {
      if (err || !(res && res.status === 'ok')) {
        logger.error('[metrics] error sending metrics to datadog:', err, res);
      } else {
        logger.debug('[metrics] successfully sent metrics to datadog');
      }
    });
  }
};

export const setup = ({ apiKey, appKey }, tags = []) => {
  if (!(apiKey && appKey)) {
    logger.debug('[metrics] setup called without datadog apiKey and appKey');
    return;
  }
  dogapi.initialize({ api_key: apiKey, app_key: appKey });
  defaultTags = [];
  isSetup = true;

  setInterval(flushQueue, FLUSH_INTERVAL);
};

const getQueue = (type, metric, tags) => {
  const key = `${type}::${metric}::${tags ? tags.join('|') : ''}`;
  if (!queues[key]) {
    queues[key] = {
      metric,
      points: [],
      host,
      tags: tags ? tags.concat(defaultTags) : defaultTags,
      type,
    };
  }

  return queues[key];
};

const reporter = type => (metric, value, tags) =>
  getQueue(type, metric, tags)
    .points
    .push([Math.floor(Date.now() / 1000), value]);

export const guage = reporter('guage');
export const count = reporter('count');

export const middleware = (req, res, next) => {
  if (!req._startTime) req._startTime = new Date();


  const end = res.end;
  res.end = (chunk, encoding) => {
    res.end = end;
    res.end(chunk, encoding);

    if (!req.route || !req.route.path) {
      logger.debug('[metrics][middleware] request without route ended', req);
      return;
    }

    const tags = [
      `route:${req.route.path}`,
      `method:${req.method.toLowerCase()}`,
      `response_code:${res.statusCode}`,
      `response_class:${Math.floor(res.statusCode / 100)}xx`,
    ];

    count('node.express.request', 1, tags);
    guage('node.express.response_time', new Date() - req._startTime, tags);
  };

  next();
};
