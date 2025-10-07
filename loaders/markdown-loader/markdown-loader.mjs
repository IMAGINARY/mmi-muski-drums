import { parse } from 'marked';

// eslint-disable-next-line import/prefer-default-export
export function markdownLoader(source) {
  const options = this.getOptions();
  return parse(source, options);
}
