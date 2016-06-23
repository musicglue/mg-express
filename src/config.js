import EventEmitter from 'events';
import { parse } from 'url';
import consul from 'consul';
import logger from './logger';

let config = {};

const emitter = new EventEmitter();

const getValue = name => config[name] || process.env[name];

export const subscribe = (key, func) => {
  emitter.on(key, func);
  func(getValue(key), true);
};

export const bootstrapConsul = ({ key, url = 'http://localhost:8500', ...opts }) => {
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

  let hasInitialConsulData = false;

  watcher.on('change', data => {
    logger.debug('[consul] Change found', data);
    const nextConfig = (data || [])
      .reduce((memo, { Key, Value }) => {
        const name = keyFrom(Key);
        if (name === '') return memo;
        if (config[name] !== Value) emitter.emit(name, Value, !hasInitialConsulData);
        return { ...memo, [name]: Value };
      }, {});


    const nextKeys = Object.keys(nextConfig);
    Object
      .keys(config)
      .filter(name => !nextKeys.includes(name))
      .forEach(name => emitter.emit(name, process.env[name], !hasInitialConsulData));

    hasInitialConsulData = true;

    config = nextConfig;
  });

  watcher.on('error', err => {
    logger.error(err);
  });
};

export default getValue;
