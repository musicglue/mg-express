import dogapi from 'dogapi';
import os from 'os';
import { flatten } from 'lodash';

import logger from './logger';

const FLUSH_INTERVAL = 10000;
const host = os.hostname();

const sum = arr => arr.reduce((a, b) => a + b, 0);

const metricsToReport = {
  count: arr => arr.length,
  avg: arr => sum(arr) / arr.length,
  sum,
  median: arr => {
    if (arr.length === 1) return arr[0];
    const half = arr.length / 2;
    return (arr[Math.floor(half)] + arr[Math.ceil(half)]) / 2;
  },
  max: arr => arr[arr.length - 1],
  min: arr => arr[0],
  p95: arr => arr[Math.round(0.95 * (arr.length - 1))],
};

const getTimestamp = () => Math.floor(Date.now() / 1000);

class Bucket {
  constructor(metric, tags) {
    this.metric = metric;
    this.tags = tags;
    this.points = new Map();
  }

  report(value) {
    const timestamp = getTimestamp();
    if (!this.points.has(timestamp)) this.points.set(timestamp, []);
    this.points.get(timestamp).push(value);
  }

  collect() {
    const currentBucketTimestamp = getTimestamp();

    const points = Array.from(this.points.entries())
      .map(([timestamp, values = []]) => [timestamp, values.sort()])
      .filter(([timestamp, values]) => timestamp < currentBucketTimestamp && values.length);

    if (points.length === 0) return [];

    points.forEach(([timestamp]) => this.points.delete(timestamp));

    return Object
      .entries(metricsToReport)
      .map(([name, getValue]) => ({
        metric: `${this.metric}.${name}`,
        points: points.map(([timestamp, values]) => [parseInt(timestamp, 10), getValue(values)]),
        tags: this.tags,
        host,
      }));
  }
}

class Metrics {
  constructor(defaultTags = []) {
    this.buckets = {};
    this.defaultTags = defaultTags;
  }

  report(metric, value, tags = []) {
    const key = `${metric}::${tags.join('|')}`;
    if (!this.buckets[key]) this.buckets[key] = new Bucket(metric, tags.concat(this.defaultTags));
    this.buckets[key].report(value);
  }

  flush() {
    const metrics = flatten(Object.values(this.buckets).map(bucket => bucket.collect()));
    if (metrics.length > 0) {
      logger.debug(`[metrics] Sending ${metrics.length} metric sets to datadog...`);
      console.log(require('util').inspect(metrics, { color: true, depth: 5 }));
      dogapi.metric.send_all(metrics, (err, res) => {
        if (err || !(res && res.status === 'ok')) {
          logger.error('[metrics] error sending metrics to datadog:', err, res);
        } else {
          console.log('FLUSHED', metrics.length);
          logger.debug('[metrics] successfully sent metrics to datadog');
        }
      });
    }
  }
}

let metrics;

export const setup = ({ apiKey, appKey }, tags = []) => {
  if (!(apiKey && appKey)) {
    logger.debug('[metrics] setup called without datadog apiKey and appKey');
    return;
  }
  dogapi.initialize({ api_key: apiKey, app_key: appKey });
  metrics = new Metrics(tags);

  setInterval(() => metrics.flush(), FLUSH_INTERVAL);
};

export const report = (metric, value, tags) => {
  if (!metrics) return;
  metrics.report(metric, value, tags);
};

export const gauge = (...args) => {
  logger.warn('[metrics] gauge is deprecated, use report instead');
  return report(...args);
};

export const guage = (...args) => {
  logger.warn('[metrics] guage is deprecated because @somehats cant spell. use report instead 🦄');
  return report(...args);
};

export const count = (...args) => {
  logger.warn('[metrics] count is deprecated, use report instead');
  return report(...args);
};

/* eslint-disable no-param-reassign */
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

    report('node.express.request', Date.now() - req._startTime, tags);
  };

  next();
};
