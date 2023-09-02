import {Options} from 'normalize-url';

export const MIN_DEPTH = 0;
export const MAX_DEPTH = 100;

export const EXPORT_FOLDER = './output';
export const EXPORT_PREFIX = 'crawl';

// https://www.npmjs.com/package/normalize-url
export const NORMALIZE_URL_PARAMS: Options = {
  defaultProtocol: 'https',
  stripHash: true,
  stripTextFragment: true,
  // removeQueryParameters: true,
};
