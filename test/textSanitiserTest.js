import dirtyChai from 'dirty-chai';
import chai, { expect } from 'chai';

chai.use(dirtyChai);

import sanitise from '../src/textSanitiser';

describe('text sanitiser', () => {
  describe('sanitising non-strings', () => {
    it('returns undefined if given undefined', () => expect(sanitise(undefined)).to.be.undefined());
  });

  describe('the error message does not contain anything that looks sensitive', () => {
    const text = 'foo is blah pass word cvx cord number';

    it('does not change the error message', () => expect(sanitise(text)).to.equal(text));
  });

  describe('the error message contains something that looks like a card number', () => {
    describe('the card number is blank', () => {
      const text = '"foo":{"bar":132,"cardNumber":""';

      it('does not insert any stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"bar":132,"cardNumber":""'));
    });

    describe('the card number is not blank', () => {
      const text = '"foo":{"bar":132,"cardNumber":"12345678"';

      it('replaces all but the last 4 chars with stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"bar":132,"cardNumber":"****5678"'));
    });
  });

  describe('the error message contains something that looks like a CVC number', () => {
    describe('the cvc number is blank', () => {
      const text = '"foo":{"cvc":"","blah":"cvc"}';

      it('does not insert any stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"cvc":"","blah":"cvc"}'));
    });

    describe('the cvc number is not blank', () => {
      const text = '"foo":{"cvc":"876","blah":"cvc"}';

      it('replaces all the characters with stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"cvc":"***","blah":"cvc"}'));
    });
  });

  describe('the error message contains something that looks like a password', () => {
    describe('the password is blank', () => {
      const text = '"foo":{"zoo":{"password":""';

      it('does not insert any stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"zoo":{"password":""'));
    });

    describe('the password is not blank', () => {
      const text = '"foo":{"zoo":{"password":"abcdefghijklmnopqrstuvwxyz"';

      it('replaces all the characters with stars', () =>
        expect(sanitise(text)).to.equal('"foo":{"zoo":{"password":"**************************"'));
    });
  });

  describe('the error message contains every type of sensitive information', () => {
    const text = '{"blah":{"card":"asdf","cvc":"121",' +
      '"zoo":{"monkeys":"12", "cardNumber":"887744"}, "woo":{"password":"wonkydonkey"}}';

    it('sanitises all the sensitive fields', () =>
       expect(sanitise(text)).to.equal(
         '{"blah":{"card":"asdf","cvc":"***",' +
           '"zoo":{"monkeys":"12", "cardNumber":"**7744"}, "woo":{"password":"***********"}}'));
  });

  describe('the error message contains a field that is quoted using single quotes', () => {
    const text = '"foo":{"zoo":{\'password\':\'bleep\'';

    it('replaces all the charactes with stars and leaves the single quotes intact', () =>
      expect(sanitise(text)).to.equal('"foo":{"zoo":{\'password\':\'*****\''));
  });

  describe('the error message contains a field that is not quoted', () => {
    const text = 'password : \'bleep\'';

    it('replaces all the charactes with stars and leaves the single quotes intact', () =>
      expect(sanitise(text)).to.equal('password : \'*****\''));
  });

  describe('the error message contains a multiple instances of the same field', () => {
    const text = 'password : \'abc\', \'password\' : "uvwxyz"';

    it('replaces all the charactes with stars and leaves the single quotes intact', () =>
      expect(sanitise(text)).to.equal('password : \'***\', \'password\' : "******"'));
  });

  describe('the error message contains a field that is mixed case', () => {
    const text = 'PassWord : \'bleep\'';

    it('replaces all the charactes with stars and leaves the casing intact', () =>
      expect(sanitise(text)).to.equal('PassWord : \'*****\''));
  });

  describe('the error message contains a field that is not quoted and contains escape chars', () => {
    const text = 'password : "a\'b"';

    it('replaces all the charactes with stars and leaves the single quotes intact', () =>
      expect(sanitise(text)).to.equal('password : "***"'));
  });

  describe('the error message contains multiple lines', () => {
    const text = `some text
password : "a'b"'
foo`;

    it('replaces all the sensitive charactes with stars and leaves the other lines intact', () =>
      expect(sanitise(text)).to.equal(`some text
password : "***"'
foo`));
  });

  describe('the error message contains a field that is not quoted and contains colour codes', () => {
    const text = '42424242\'\u001b[39m,\n     cvc: \u001b[32m\'123\'\u001b[39m,\n     expiry: { month: \u001b';

    it('replaces all the senstive charactes with stars and leaves the colour codes intact', () =>
      expect(sanitise(text)).to.equal('42424242\'\u001b[39m,\n     cvc: \u001b[32m\'***\'\u001b[39m,\n     expiry: { month: \u001b'));
  });
});
