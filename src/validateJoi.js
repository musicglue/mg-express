const isValidationError = e => e.name === 'ValidationError';

export default (schema, value, options = {}) =>
  new Promise((resolve, reject) =>
    schema.validate(
      value,
      options,
      (err, validated) => (err ? reject(err) : resolve(validated))))
  .catch(e => {
    if (isValidationError(e)) {
      e.status = 400; // eslint-disable-line no-param-reassign
    }

    return Promise.reject(e);
  });
