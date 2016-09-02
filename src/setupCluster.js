import cluster from 'cluster';
import { times } from 'lodash';
import logger from './logger';

export default (clusterSize) => {
  logger.info(`Master started (pid: ${process.pid})`);

  times(clusterSize, () => cluster.fork());

  cluster.on('exit', (worker, code) => {
    logger.info(`Worker ${worker.process.pid} died (${code}), restarting...`);
    cluster.fork();
  });
};
