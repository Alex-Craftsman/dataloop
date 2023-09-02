import {Page} from 'puppeteer';

// crawler options
export interface IOpts {
  verbose?: boolean;

  url: string;
  depth: number;

  puppeteerPage: Page;
}

// image data structure
export interface IImage {
  imageUrl: string;
  sourceUrl: string;
  depth: number;
}

// result data structure
export interface IResult {
  result: IImage[];
}
