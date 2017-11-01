import Tracer from 'datadog-tracer';
import logger from './logger';

let tracer = null;

export const setup = (opts) => {
  tracer = new Tracer(opts);
  tracer.on('error', e => logger.error(e));
};

const endTrace = (req, res) => {
  const { traceSpan } = req;
  traceSpan.addTags({
    resource: req.route.path,
    type: 'web',
    'http.method': req.method,
    'http.url': req.url,
    'http.status_code': res.statusCode,
  });

  traceSpan.finish();
};

/* eslint-disable no-param-reassign */
export const middleware = (req, res, next) => {
  const traceSpan = tracer.startSpan('express.request');
  req.traceSpan = traceSpan;

  res.on('finish', () => endTrace(req, res));
  res.on('close', () => endTrace(req, res));

  next();
};
