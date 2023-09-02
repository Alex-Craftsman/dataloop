import {Options} from 'normalize-url';

// min and max range bound for a depth to crawl
export const MIN_DEPTH = 0;
export const MAX_DEPTH = 100;

// export settings
export const EXPORT_FOLDER = './output';
export const EXPORT_PREFIX = 'crawl';

// https://www.npmjs.com/package/normalize-url
export const NORMALIZE_URL_PARAMS: Options = {
  defaultProtocol: 'https',
  stripHash: true,
  stripTextFragment: true,
};
