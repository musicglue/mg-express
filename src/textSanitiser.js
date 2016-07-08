const cache = {};
const splitter = '\\s*[^?]:\\s*';
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
    regexp: new RegExp(`${key}${splitter}${value}`),
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
  const extractor = new RegExp(`(.*${finder.key}${splitter})${finder.value}(.*)`);
  const match = text.match(extractor);

  return match.slice(1, 4);
};

const sanitise = (field, mutate) => text => {
  const finders = getFinders(field);
  const finder = finders.find(f => f.regexp.test(text));

  if (!finder) return text;

  const delimiter = finder.value[0];
  const [before, sensitive, after] = extract(finder, text);
  const sanitised = mutate(sensitive);

  return `${before}${delimiter}${sanitised}${delimiter}${after}`;
};

export const replace = (selection, replacement) => (text) => text.replace(selection, replacement);
export const starAllChars = replace(/./g, '*');
export const starAllButLast4Chars = replace(/.(?=.{4})/g, '*');

export const sanitisers = [
  sanitise('cardNumber', starAllButLast4Chars),
  sanitise('cvc', starAllChars),
  sanitise('password', starAllChars),
];

export default function (text) {
  return sanitisers.reduce((p, c) => c(p), text);
}
