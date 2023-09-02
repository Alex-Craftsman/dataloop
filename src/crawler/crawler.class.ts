import puppeteer, { Browser, Page } from 'puppeteer';
import normalizeUrl from 'normalize-url';
import getUuid from 'uuid-by-string';
import * as fs from 'fs';

import { IImage, IOpts, IResult } from '../types/crawler.type.js';
import {
  EXPORT_FOLDER,
  EXPORT_PREFIX,
  NORMALIZE_URL_PARAMS,
} from '../const/crawler.const.js';
import chalk from 'chalk';
import { log } from 'console';
import { randomUUID } from 'crypto';

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

  // data structures to collect crawler data
  private readonly images: Map<string, IImage>;

  private readonly visited: Map<string, number>;
  private readonly toVisit: Map<string, number>;

  // private constructor to prevent direct instantiation
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

  // helper function to launch a new crawler instance
  static async launch(
    url: string,
    depth = 0,
    verbose = true
  ): Promise<WebCrawler> {
    // init puppeteer
    const puppeteerBrowser = await puppeteer.launch({ headless: 'new' });

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

    // return new instance
    return new WebCrawler({
      url,
      depth,
      puppeteerPage: await puppeteerBrowser.newPage(),
      verbose,
    });
  }

  // helper function to log messages
  private async log(message: string, force = false): Promise<void> {
    if (this.verbose || force) {
      log(message);
    }
  }

  // main crawl function
  public async crawl(): Promise<void> {
    this.log(
      chalk.gray(
        `Crawl started @ ${chalk.cyan(
          new Date().toISOString()
        )} ${chalk.dim.italic(`[REF:${this.sessionId}]`)}`
      )
    );

    // add initial url to toVisit list
    this.toVisit.set(this.url, 0);

    // crawl until toVisit list is empty
    while (this.toVisit.size > 0) {
      // get next url to visit
      const url = this.toVisit.entries().next().value;

      if (url) {
        // index url
        const visited = this.visited.get(url);

        // index url if not visited
        if (!visited) {
          await this.index(url[0], url[1]);
        }

        // remove url from toVisit list
        this.toVisit.delete(url[0]);
      }
    }

    // export results
    await this.export();

    // finish crawl
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

    // get plain array of images
    const imagesToExport = this.getImages();

    // log images to export
    for (const i in imagesToExport) {
      this.log(`${chalk.white(parseInt(i, 10) + 1)} ${chalk.gray(
        `Image URL: ${chalk.cyan(imagesToExport[i].imageUrl)}`
      )}
${chalk.gray(`Source URL: ${chalk.cyan(imagesToExport[i].sourceUrl)}`)}
${chalk.gray(`Depth: ${chalk.cyan(imagesToExport[i].depth)}`)}
`);
    }

    // write images to file
    fs.writeFileSync(
      `${EXPORT_FOLDER}/${EXPORT_PREFIX}-${this.base.hostname}-${this.sessionId}.json`,
      JSON.stringify({ result: imagesToExport } as IResult, null, 2)
    );

    this.log(
      chalk.gray(`Export finished @ ${chalk.cyan(new Date().toISOString())}, [${chalk.cyan(imagesToExport.length)}] images found`)
    );

    return;
  }

  // helper function to index a url
  public async index(url: string, depth: number): Promise<void> {
    this.log(chalk.gray(`Indexing @ ${chalk.cyan(url)}`));

    // check if page is closed
    if (this.puppeteerPage.isClosed()) {
      throw new Error('Page is closed');
    }

    // visit url
    await this.puppeteerPage.goto(url);

    // process images 
    await this.processImages(url, depth);

    // process links
    await this.processLinks(url, depth);

    // add url to visited list
    this.visited.set(url, depth);
  }

  // helper function to process images
  private async processImages(url: string, depth: number): Promise<void> {
    // get all images
    const images: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.images) ?? []).map(i => i.src)
    );

    this.log(
      chalk.gray(
        `Found ${chalk.cyan(images.length)} images @ ${chalk.cyan(url)}`
      )
    );

    // add images to images list
    for (const image of images) {
      const normalizedUrl = normalizeUrl(image, NORMALIZE_URL_PARAMS);

      const imageObject: IImage = {
        imageUrl: normalizedUrl,
        sourceUrl: url,
        depth,
      };

      // generate hash for image
      const imageHash = getUuid(JSON.stringify(imageObject));

      // add image to images list
      if (!this.images.has(imageHash)) {
        this.images.set(imageHash, imageObject);
      }
    }
  }

  // helper function to process links
  private async processLinks(url: string, depth: number): Promise<void> {
    // get all links
    const toVisit: string[] = await this.puppeteerPage.evaluate(() =>
      (Array.from(document.links) ?? []).map(link => link.href)
    );

    this.log(
      chalk.gray(
        `Found ${chalk.cyan(toVisit.length)} images @ ${chalk.cyan(url)}`
      )
    );

    // add links to toVisit list
    for (const link of toVisit) {
      const normalizedUrl = normalizeUrl(link, NORMALIZE_URL_PARAMS);

      // add link to toVisit list
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

  // helper function to get images as plain object
  public getImages(): IImage[] {
    return Array.from(this.images.values());
  }

  // helper function to finish crawl and close opened instances
  public async finish(): Promise<void> {
    let browser: Browser | null = null;

    // close page if not closed
    if (this.puppeteerPage && !this.puppeteerPage.isClosed()) {
      this.log(
        chalk.gray(
          `Closing opened pages @ ${chalk.cyan(new Date().toISOString())}`
        )
      );

      browser = this.puppeteerPage.browser();

      await this.puppeteerPage.close();
    }

    // close browser if not closed
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
