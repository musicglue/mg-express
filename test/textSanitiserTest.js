import { expect } from 'chai';
import sanitise from '../src/textSanitiser';

describe.only('error sanitiser', () => {
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
});
