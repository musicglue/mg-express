import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import asPromised from 'chai-as-promised';

import validate from '../src/validateJoi';

chai.use(asPromised);
chai.use(dirtyChai);

describe('joi validation', () => {
  context('when the schema is not valid', () => {
    const schema = {
      validate: (value, options, callback) => {
        const err = new Error();
        err.name = 'ValidationError';

        return callback(err);
      },
    };

    it('rejects', () => expect(validate(schema, null)).to.be.rejected());

    it('sets the error code to 400', () => validate(schema, null)
       .catch(e => expect(e.status).to.eq(400)));
  });

  context('when the schema is valid', () => {
    const schema = {
      validate: (value, options, callback) => callback(null, value),
    };

    it('resolves', () => expect(validate(schema, null)).to.be.fulfilled());
  });
});
