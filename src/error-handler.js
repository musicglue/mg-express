import statuses from 'statuses';

const production = process.env.NODE_ENV === 'production';

export default (serviceName) => (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;

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
