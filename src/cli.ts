#!/usr/bin/env node

import normalizeUrl from 'normalize-url';
import meow from 'meow';

import WebCrawler from './crawler/crawler.class.js';
import {NORMALIZE_URL_PARAMS} from './const/crawler.const.js';
import {IInput, InputSchema} from './validation/input.validation.js';
import chalk from 'chalk';

// https://www.npmjs.com/package/meow
const cli = meow(
  `
	Usage
    $ ./crawler -u pravatar.cc -d 1

	Options
    --url, -u  URL to crawl
    --depth, -d  crawl depth
`,
  {
    importMeta: import.meta,
    booleanDefault: undefined,
    flags: {
      url: {
        type: 'string',
        shortFlag: 'u',
        isRequired: true,
      },
      depth: {
        type: 'number',
        default: 0,
        shortFlag: 'd',
      },
    },
  }
);

try {
  // Validate user input
  const input: IInput = await InputSchema.validate({
    url: normalizeUrl(cli.flags.url, NORMALIZE_URL_PARAMS),
    depth: cli.flags.depth,
  });

  // Get WebCrawler instance
  const webCrawler: WebCrawler = await WebCrawler.launch(
    input.url,
    input.depth
  );

  // Crawl!
  await webCrawler
    .crawl()
    .then(() => {
      // do something with the result, if you wish
    })
    .finally(() => {
      if (webCrawler) {
        // close the browser
        webCrawler.finish();
      }
    });
} catch (err: unknown) {
  // handle errors
  if (err instanceof Error) {
    console.error(chalk.gray(`Error thrown: ${chalk.red(err.message)}`));
  } else {
    console.error(chalk.red(err));
  }
}
