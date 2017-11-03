import Tracer from 'datadog-tracer';
import logger from './logger';

const endTrace = (req, res) => {
  const { traceSpan } = req;
  const resource = req.route != null ? req.route.path : 'middleware';

  traceSpan.addTags({
    resource,
    type: 'web',
    'http.method': req.method,
    'http.url': req.url,
    'http.status_code': res.statusCode,
  });

  traceSpan.finish();
};

/* eslint-disable no-param-reassign, import/prefer-default-export */
export const middlewareFactory = (opts) => {
  const tracer = new Tracer(opts);
  tracer.on('error', e => {
    if (process.env.AWS_ENV === 'production') {
      logger.error(e);
    }
  });

  return (req, res, next) => {
    const traceSpan = tracer.startSpan('express.request');
    req.traceSpan = traceSpan;

    res.on('error', () => { traceSpan.setTag('error', true); });
    res.on('finish', () => endTrace(req, res));
    res.on('close', () => endTrace(req, res));

    next();
  };
};
