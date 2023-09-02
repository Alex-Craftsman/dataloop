import WebCrawler from '../src/crawler/crawler.class.js';

describe('crawler class', () => {
  test(
    'check https://pravatar.cc/',
    async () => {
      // Arrange
      const url = 'https://pravatar.cc/';
      const depth = 1;

      const result = 12;

      // Act
      const crawler = await WebCrawler.launch(url, depth);

      await crawler.crawl();

      // Assert
      expect(result).toBe(crawler.getImages().length);
    },
    60 * 1000
  );
});
