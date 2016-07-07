export const sanitise = (field, mutate) => (text) => {
  const regexp = new RegExp(`(["']?${field}["']?\\s*:\\s*["']?)([^"']+)(["']?)`);
  const match = text.match(regexp);

  if (!match) return text;

  const prefix = match[1];
  const mutated = mutate(match[2]);
  const suffix = match[3];

  return text.replace(regexp, `${prefix}${mutated}${suffix}`);
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

