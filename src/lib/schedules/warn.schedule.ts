import * as schedule from 'node-schedule';
import { container } from 'tsyringe';
import { Warn } from '../../feature/warn/warn.entity.js';
import { WarnService } from '../../feature/warn/warn.service.js';

export const warnSchedule = schedule.scheduleJob('0 0 */3 * *', async () => {
  const warnService = container.resolve(WarnService);

  const warns = await Warn.findBy({ isVerbal: true });

  if (!warns.length) return;

  for await (const { id, warnedAt } of warns) {
    const twoWeeks = 1000 * 60 * 60 * 24 * 14;
    if (warnedAt.getTime() + twoWeeks >= new Date().getTime()) await warnService.removeWarn(id);
  }
});
