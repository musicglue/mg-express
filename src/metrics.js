import dogapi from 'dogapi';
import os from 'os';

const FLUSH_INTERVAL = 10000;
const host = os.hostname();

let defaultTags = [];
let isSetup = false;
let queues = {};

const flushQueue = () => {
  const metrics = Object.values(queues);
  queues = {};
  if (metrics.length > 0 && isSetup) dogapi.metric.send_all(metrics);
};

export const setup = ({ apiKey, appKey }, tags = []) => {
  dogapi.initialize({ api_key: apiKey, app_key: appKey });
  defaultTags = [];
  isSetup = true;

  setInterval(flushQueue, FLUSH_INTERVAL);
};

const getQueue = (metric, tags) => {
  const key = `${metric}::${tags ? tags.join('|') : ''}`;
  if (!queues[key]) {
    queues[key] = {
      metric,
      points: [],
      host,
      tags: tags ? tags.join(defaultTags) : defaultTags,
    };
  }

  return queues[key];
};

export default (metric, value, tags) =>
  getQueue(metric, tags)
    .points
    .push([Math.floor(Date.now() / 1000), value]);
