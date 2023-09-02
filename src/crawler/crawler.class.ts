import puppeteer, {Browser, Page} from 'puppeteer';
import normalizeUrl from 'normalize-url';
import getUuid from 'uuid-by-string';
import * as fs from 'fs';

import {IImage, IOpts, IResult} from '../types/crawler.type.js';
import {
  EXPORT_FOLDER,
  EXPORT_PREFIX,
  NORMALIZE_URL_PARAMS,
} from '../const/crawler.const.js';
import chalk from 'chalk';
import {log} from 'console';
import {randomUUID} from 'crypto';

class WebCrawler {
  // instance settings
  private readonly sessionId: string;

  // debug settings
  private verbose = true;

  // crawl settings
  private url: string;
  private depth: number;

  private readonly base: URL;

  // browser settigs
  private readonly puppeteerPage: Page;

  private readonly images: Map<string, IImage>;

  private readonly visited: Map<string, number>;
  private readonly toVisit: Map<string, number>;

  private constructor(options: IOpts) {
    this.sessionId = randomUUID();

    this.verbose = options.verbose ?? this.verbose;

    this.url = options.url;
    this.depth = options.depth;

    this.base = new URL(this.url);

    this.puppeteerPage = options.puppeteerPage;

    this.images = new Map<string, IImage>();

    this.visited = new Map<string, number>();
    this.toVisit = new Map<string, number>();
  }

  static async launch(
    url: string,
    depth = 0,
    verbose = false
  ): Promise<WebCrawler> {
    // init puppeteer
    const puppeteerBrowser = await puppeteer.launch({headless: 'new'});

    verbose
      ? log(
          chalk.gray(
            `
URL: ${chalk.cyan(url)}
DEPTH: ${chalk.cyan(depth)}
`
          )
        )
      : null;

    return new WebCrawler({
      url,
      depth,
      puppeteerPage: await puppeteerBrowser.newPage(),
    });
  }

  private async log(message: string, force = false): Promise<void> {
    if (this.verbose || force) {
      log(message);
    }
  }

  public async crawl(): Promise<void> {
    this.log(
      chalk.gray(
        `Crawl started @ ${chalk.cyan(
          new Date().toISOString()
        )} ${chalk.dim.italic(`[REF:${this.sessionId}]`)}`
      )
    );

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

    await this.export();

    await this.finish();

    this.log(
      chalk.gray(
        `Crawl finished @ ${chalk.cyan(
          new Date().toISOString()
        )} ${chalk.dim.italic(`[REF:${this.sessionId}]`)}`
      )
    );
  }

  private export(): void {
    this.log(
      chalk.gray(`Export started @ ${chalk.cyan(new Date().toISOString())}`)
    );

    const imagesToExport = this.getImages();

    for (const i in imagesToExport) {
      this.log(`${chalk.white(parseInt(i, 10) + 1)} ${chalk.gray(
        `Image URL: ${chalk.cyan(imagesToExport[i].imageUrl)}`
      )}
${chalk.gray(`Source URL: ${chalk.cyan(imagesToExport[i].sourceUrl)}`)}
${chalk.gray(`Depth: ${chalk.cyan(imagesToExport[i].depth)}`)}
`);
    }

    return fs.writeFileSync(
      `${EXPORT_FOLDER}/${EXPORT_PREFIX}-${this.base.hostname}-${this.sessionId}.json`,
      JSON.stringify({result: imagesToExport} as IResult, null, 2)
    );
  }

  public async index(url: string, depth: number): Promise<void> {
    this.log(chalk.gray(`Indexing @ ${chalk.cyan(url)}`));

    if (this.puppeteerPage.isClosed()) {
      throw new Error('Page is closed');
    }

    await this.puppeteerPage.goto(url);

    await this.processImages(url, depth);

    await this.processLinks(url, depth);

    this.visited.set(url, depth);
  }

  private async processImages(url: string, depth: number): Promise<void> {
    const images: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.images) ?? []).map(i => i.src)
    );

    this.log(
      chalk.gray(
        `Found ${chalk.cyan(images.length)} images @ ${chalk.cyan(url)}`
      )
    );

    for (const image of images) {
      const normalizedUrl = normalizeUrl(image, NORMALIZE_URL_PARAMS);

      const imageObject: IImage = {
        imageUrl: normalizedUrl,
        sourceUrl: url,
        depth,
      };

      const imageHash = getUuid(JSON.stringify(imageObject));

      if (!this.images.has(imageHash)) {
        this.images.set(imageHash, imageObject);
      }
    }
  }

  private async processLinks(url: string, depth: number): Promise<void> {
    const toVisit: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.links) ?? []).map(link => link.href)
    );

    this.log(
      chalk.gray(
        `Found ${chalk.cyan(toVisit.length)} images @ ${chalk.cyan(url)}`
      )
    );

    for (const link of toVisit) {
      const normalizedUrl = normalizeUrl(link, NORMALIZE_URL_PARAMS);

      if (!this.visited.has(normalizedUrl)) {
        const urlObject = new URL(link);

        if (depth >= this.depth) {
          this.log(chalk.yellow(`Max depth reached @ ${chalk.cyan(link)}`));

          continue;
        }

        if (!urlObject.hostname.endsWith(this.base.hostname)) {
          this.log(chalk.yellow(`Hostname mismatch @ ${chalk.cyan(link)}`));

          continue;
        }

        this.toVisit.set(normalizedUrl, depth + 1);
      }
    }
  }

  public getImages(): IImage[] {
    return Array.from(this.images.values());
  }

  public async finish(): Promise<void> {
    let browser: Browser | null = null;

    if (this.puppeteerPage && !this.puppeteerPage.isClosed()) {
      this.log(
        chalk.gray(
          `Closing opened pages @ ${chalk.cyan(new Date().toISOString())}`
        )
      );

      browser = this.puppeteerPage.browser();

      await this.puppeteerPage.close();
    }

    if (browser && browser.isConnected()) {
      this.log(
        chalk.gray(
          `Closing opened browser @ ${chalk.cyan(new Date().toISOString())}`
        )
      );

      await browser.close();
    }

    return;
  }
}

export default WebCrawler;
