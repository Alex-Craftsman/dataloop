import {Page} from 'puppeteer';

export interface IOpts {
  verbose?: boolean;

  url: string;
  depth: number;

  puppeteerPage: Page;
}

export interface IImage {
  imageUrl: string;
  sourceUrl: string;
  depth: number;
}

export interface IResult {
  result: IImage[];
}
