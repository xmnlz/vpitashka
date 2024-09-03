import { env } from 'process';

export const __prod__ = env.NODE_ENV === 'production';
