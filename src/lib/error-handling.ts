import { CommandError } from './errors/command.error.js';
import { logger } from './logger.js';

process
  .on('unhandledRejection', async (error) => {
    if (error instanceof CommandError) {
      await error.useErrorHandle();
      return;
    }

    logger.error(error);
  })
  .on('uncaughtException', async (error) => {
    if (error instanceof CommandError) {
      await error.useErrorHandle();
      return;
    }

    logger.error(error);
  });
