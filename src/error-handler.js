import statuses from 'statuses';
import logger from './logger';

const production = process.env.NODE_ENV === 'production';
const logErrors = process.env.NODE_ENV === 'test' ? process.env.LOG_TEST_ERRORS : true;

export default (serviceName) => (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;

  if (logErrors) logger.error((err && err.stack) || err);

  res.status(status).json({
    status,
    stack: production ? null : err.stack,
    message: err.message || statuses[status],
    code: err.code,
    name: err.name,
    type: err.type,
    details: err.details,
    cat: `https://http.cat/${status}.jpg`,
    origin: serviceName,
  });
};
