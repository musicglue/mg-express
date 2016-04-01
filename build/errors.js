import axios from 'axios';
import csv from 'csv';
import { readFileSync, writeFileSync } from 'fs';
import generate from 'babel-generator';
import template from 'babel-template';
import { identifier, stringLiteral, numericLiteral, program } from 'babel-types';

const parse = string => new Promise((resolve, reject) =>
  csv.parse(string, (err, data) => {
    if (err) return reject(err);
    return resolve(data);
  }));

const capitalise = word => {
  const [first, ...rest] = word.split('');
  return first.toUpperCase() + rest.join('').toLowerCase();
};

const formatName = name =>
  name
    .split(' ')
    .map(capitalise)
    .concat(['Error'])
    .join('');

const errorTemplate = template(`
  export class error extends Error {
    constructor(msg) {
      super(msg);
      this.name = errorString;
      this.status = statusCode;
    }
  }
`, { sourceType: 'module' });

const toAST = ([code, name]) => errorTemplate({
  error: identifier(name),
  errorString: stringLiteral(name),
  statusCode: numericLiteral(code),
});

axios.get('http://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv')
  .then(response => parse(response.data))
  .then(codes =>
    codes
      .filter(([code, name]) => code.match(/^\d{3}$/) && name !== 'Unassigned')
      .map(([code, name]) => [parseInt(code, 10), formatName(name)])
      .filter(([code]) => code >= 400)
      .map(toAST))
  .then(errors => {
    writeFileSync(
      'generated-src/errors.js',
      generate(program(errors)).code,
      { encoding: 'utf-8' });

    console.log(`Generated ${errors.length} error classes in generated-src/errors.js`);
  })
  .catch(e => {
    console.error(e.stack);
    process.exit(1);
  });
