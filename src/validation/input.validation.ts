import {InferType, number, object, string} from 'yup';
import {MAX_DEPTH, MIN_DEPTH} from '../const/crawler.const.js';

export const InputSchema = object({
  url: string().url().required(),
  depth: number().required().positive().integer().min(MIN_DEPTH).max(MAX_DEPTH),
});

export type IInput = InferType<typeof InputSchema>;
