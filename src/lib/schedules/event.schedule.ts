import * as schedule from 'node-schedule';
import { container } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';

export const eventSchedule = schedule.scheduleJob('*/1 * * * *', async () => {
  const eventActivityService = container.resolve(EventActivityService);
  const eventsmodeService = container.resolve(EventsmodeService);

  const eventActivity = await EventActivity.findBy({
    isStared: true,
    isPaused: false,
    isEnded: false,
  });

  if (!eventActivity.length) return;

  for await (const { id, executor } of eventActivity) {
    await eventActivityService.addTime(id, 1);
    await eventsmodeService.editStatistics(executor.userId, executor.guild.id, {
      weeklyTime: 1,
      totalTime: 1,
    });
  }
});
