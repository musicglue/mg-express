import Bluebird from 'bluebird';

global.Promise = Bluebird;

const isValidationError = e => e.name === 'ValidationError';

export default (schema, value) =>
  Promise
    .fromCallback(cb => schema.validate(value, cb))
    .catch(isValidationError, e => {
      e.status = 400; // eslint-disable-line no-param-reassign
      return Promise.reject(e);
    });
