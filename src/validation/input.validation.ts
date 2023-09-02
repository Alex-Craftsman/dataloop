import {InferType, number, object, string} from 'yup';
import {MAX_DEPTH, MIN_DEPTH} from '../const/crawler.const.js';

// https://www.npmjs.com/package/yup
// user input validation schema
export const InputSchema = object({
  url: string().url().required(),
  depth: number().required().positive().integer().min(MIN_DEPTH).max(MAX_DEPTH),
});

// user input type
export type IInput = InferType<typeof InputSchema>;
