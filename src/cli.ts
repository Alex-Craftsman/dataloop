import normalizeUrl from 'normalize-url';
import WebCrawler from './crawler/crawler.class';

const argIndexUrl = 'https://dataloop.ai/';
const argDepth = '3';

const MIN_DEPTH = 0;
const MAX_DEPTH = 100;

try {
  const normalizedURL: string = normalizeUrl(argIndexUrl);

  const normalizedDepth = parseInt(argDepth, 10);

  if (isNaN(normalizedDepth)) {
    throw new Error('Depth must be a number');
  }

  if (normalizedDepth < MIN_DEPTH || normalizedDepth > MAX_DEPTH) {
    throw new Error(`Depth must be between ${MIN_DEPTH} and ${MAX_DEPTH}`);
  }

  if (!normalizedURL.startsWith('http')) {
    throw new Error('URL must start with http');
  }

  const crawl = async (url: string, depth: number) => {
    const webCrawler = await WebCrawler.launch(url, depth);
    await webCrawler.crawl();
  };

  crawl(normalizedURL, normalizedDepth).then(() => {
    throw new Error('Crawl finished');
  });
} catch (e) {
  console.error(e);
}
