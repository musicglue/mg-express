import cluster from 'cluster';
import logger from './logger';
import os from 'os';

export default () => {
  logger.info(`Master started (pid: ${process.pid})`);

  os.cpus().forEach(() => cluster.fork());

  cluster.on('exit', (worker, code) => {
    logger.info(`Worker ${worker.process.pid} died (${code}), restarting...`);
    cluster.fork();
  });
};
