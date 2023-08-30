import puppeteer, {Page} from 'puppeteer';
import normalizeUrl from 'normalize-url';
import * as fs from 'fs';

import {IImage, IOpts, IResult} from '../types/crawler.type';

class WebCrawler {
  // crawl settings
  private url: string;
  private depth: number;

  private readonly base: URL;

  // browser settigs
  private readonly puppeteerPage: Page;

  private readonly images: IImage[];

  private readonly visited: Map<string, number>;
  private readonly toVisit: Map<string, number>;

  private constructor(options: IOpts) {
    this.url = options.url;
    this.depth = options.depth;

    this.base = new URL(this.url);

    this.puppeteerPage = options.puppeteerPage;

    this.images = [];

    this.visited = new Map<string, number>();
    this.toVisit = new Map<string, number>();
  }

  static async launch(url: string, depth = 0): Promise<WebCrawler> {
    // init puppeteer
    const puppeteerBrowser = await puppeteer.launch({headless: 'new'});

    return new WebCrawler({
      url,
      depth,
      puppeteerPage: await puppeteerBrowser.newPage(),
    });
  }

  public async crawl(): Promise<void> {
    console.log('Crawl started', this.url, this.depth);

    this.toVisit.set(this.url, 0);

    while (this.toVisit.size > 0) {
      const url = this.toVisit.entries().next().value;

      if (url) {
        const visited = this.visited.get(url);

        if (!visited) {
          await this.index(url[0], url[1]);
        }

        this.toVisit.delete(url[0]);
      }
    }
  }

  private async export(): Promise<void> {
    fs.writeFileSync(
      `./output/crawl-${this.base.hostname}.json`,
      JSON.stringify({result: this.images} as IResult, null, 2)
    );
  }

  public async index(url: string, depth: number): Promise<void> {
    const urlObject = new URL(url);

    if (depth >= this.depth) {
      return;
    }

    if (this.base.hostname !== urlObject.hostname) {
      return;
    }

    console.log('crawling url', url);

    await this.puppeteerPage.goto(url);

    const images: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.images) ?? []).map(i => i.src)
    );

    for (const image of images) {
      const normalizedUrl = normalizeUrl(image);

      this.images.push({
        imageUrl: normalizedUrl,
        sourceUrl: url,
        depth,
      });
    }

    const toVisit: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.links) ?? []).map(link => link.href)
    );

    for (const link of toVisit) {
      const normalizedUrl = normalizeUrl(link);

      if (!this.visited.has(normalizedUrl)) {
        this.toVisit.set(normalizedUrl, depth + 1);
      }
    }

    this.visited.set(url, depth);

    this.export();
  }
}

export default WebCrawler;
