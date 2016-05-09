import { parse } from 'url';
import consul from 'consul';
import logger from './logger';

let config = {};

export const bootstrap = ({ key, url = 'http://localhost:8500', ...opts }) => {
  if (!key) {
    logger.error('[consul] Must provide a key to watch from.');
    return;
  }

  logger.info(`[consul] Starting consul watcher contacting ${url}`);

  const consulUrl = parse(url);
  const keyFrom = string => string.replace(`${key}/`, '');

  const agent = consul({
    host: consulUrl.hostname,
    port: consulUrl.port,
    secure: consulUrl.protocol === 'https:',
    consistent: process.env.NODE_ENV === 'production',
    ...opts,
  });

  const watcher = agent.watch({
    method: agent.kv.get,
    options: {
      key,
      recurse: true,
    },
  });

  watcher.on('change', data => {
    logger.debug('[consul] Change found', data);
    config = (data || [])
      .reduce((memo, { Key, Value }) => {
        const name = keyFrom(Key);
        return (name === '') ? memo : { ...memo, [name]: Value };
      }, {});
  });

  watcher.on('error', err => {
    logger.error(err);
  });
};

export default name => config[name] || process.env[name];
