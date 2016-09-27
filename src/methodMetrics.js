import * as metrics from './metrics';

export default (instance, key, instanceName, methods) => {
  methods.forEach(methodName => {
    const originalMethod = instance[methodName];

    if (originalMethod == null || typeof originalMethod !== 'function') {
      throw new TypeError(`Expected ${instanceName}.${methodName} to be a function`);
    }

    instance[methodName] = function tracked(...args) { // eslint-disable-line no-param-reassign
      const start = Date.now();
      const result = originalMethod.apply(this, args);

      Promise.resolve(result)
        .then(() => 'resolved')
        .catch(() => 'rejected')
        .then(status => {
          const duration = Date.now() - start;

          metrics.timing(`${key}.${instanceName}.${methodName}.${status}`, duration);
        });

      return result;
    };
  });
  return instance;
};
