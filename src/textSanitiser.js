const cache = {};
const escapeChars = '\\u001b\\[\\d{1,2}m';
const splitter = `(?:${escapeChars}|\\s)*:(?:${escapeChars}|\\s)*`;
const values = [
  '"((?:\\"|[^"])*?)"',
  '\'((?:\\\'|[^\'])*?)\'',
];

const buildFinders = field => {
  const keys = [
    field,
    `"${field}"`,
    `'${field}'`,
  ];

  const regexp = key => value => ({
    regexp: new RegExp(`${key}${splitter}${value}`, 'gi'),
    key,
    value,
  });

  return keys.reduce((memo, key) => memo.concat(...values.map(regexp(key))), []);
};

const getFinders = field => {
  const finders = cache[field];
  if (finders) return finders;

  return (cache[field] = buildFinders(field));
};

const extract = (finder, text) => {
  const extractor = new RegExp(`(.*${finder.key}${splitter})${finder.value}(.*)`, 'i');
  const match = text.match(extractor);

  return match.slice(1, 4);
};

const mutateMatch = (finder, mutate) => match => {
  const delimiter = finder.value[0];
  const [before, sensitive, after] = extract(finder, match);
  const sanitised = mutate(sensitive);

  return `${before}${delimiter}${sanitised}${delimiter}${after}`;
};

const sanitise = (field, mutate) => text => {
  const finders = getFinders(field);

  return finders.reduce((str, finder) => str.replace(
    finder.regexp, mutateMatch(finder, mutate)), text);
};

export const replace = (selection, replacement) => (text) => text.replace(selection, replacement);
export const starAllChars = replace(/./g, '*');
export const starAllButLast4Chars = replace(/.(?=.{4})/g, '*');

export const sanitisers = [
  sanitise('cardNumber', starAllButLast4Chars),
  sanitise('cvc', starAllChars),
  sanitise('password', starAllChars),
];

const sanitiseLine = line => sanitisers.reduce((p, c) => c(p), line);

export default function (text) {
  return text.split('\n').map(sanitiseLine).join('\n');
}
