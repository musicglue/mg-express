import statuses from 'statuses';

const production = process.env.NODE_ENV === 'production';

export default (serviceName) => (req, res, next, err) => {
  const status = err.status || err.statusCode || 500;

  res.statusCode = status; // eslint-disable-line no-param-reassign

  res.json({
    status,
    stack: production && err.stack,
    message: err.message || statuses[status],
    code: err.code,
    name: err.name,
    type: err.type,
    details: err.details,
    cat: `https://http.cat/${status}`,
    origin: serviceName,
    requestId: req.headers['x-request-id'],
  });
};
