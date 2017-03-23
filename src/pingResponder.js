import logger from './logger';

let active = true;

export default (config) => {
  if (config.healthSignalHandling) {
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, going unhealthy');
      active = false;
    });
  }

  return (req, res) => (active ? res.send('OK') : res.sendStatus(429));
};
