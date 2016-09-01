import { pick } from 'lodash';
import * as metrics from './metrics';

const INTERVAL = 1000;

const reportStats = (stats, name) => {
  Object
    .entries(stats)
    .forEach(([key, value]) =>
      metrics.report(`node.pool.${name}.${key}`, value));
};

// client.stats:
// { min, max, allocated, available, queued, maxRequests }
export const knex = ({ client }, name = 'knex') =>
  setInterval(() =>
    reportStats(pick(client.pool.stats(), ['allocated', 'available', 'queued']), name), INTERVAL);

const pgPoolStats = pool => ({
  allocated: pool.inUseObjectsCount(),
  available: pool.getPoolSize(),
  queued: pool.waitingClientsCount(),
});

export const pgp = (connString, pools, name = 'pgp') =>
  setInterval(() => {
    const pool = pools[connString];
    if (!pool) return;
    reportStats(pgPoolStats(pool), name);
  }, INTERVAL);
