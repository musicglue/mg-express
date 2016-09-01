import * as metrics from './metrics';

export default (instance, key, instanceName, methods) => {
  methods.forEach(methodName => {
    const originalMethod = instance[methodName];
    instance[methodName] = function (...args) {
      const start = Date.now();
      const result = originalMethod.apply(this, args);

      Promise.resolve(result)
        .then(() => 'resolved')
        .catch(() => 'rejected')
        .then(status => {
          const duration = Date.now() - start;
          const tags = [
            `status:${status}`,
            `method:${instanceName}/${methodName}`,
          ];

          metrics.report(`node.${key}`, duration, tags);
        });

      return result;
    };
  });
  return instance;
};
