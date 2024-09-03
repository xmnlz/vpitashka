import * as schedule from 'node-schedule';

export const eventSchedule = schedule.scheduleJob('* * * * *', async () => {
  // const eventActivityService = container.resolve(EventActivityService);
  // const eventsmodeService = container.resolve(EventsmodeService);
  //
  // const eventActivity = await EventActivity.findBy({
  //   isStared: true,
  //   isPaused: false,
  //   isEnded: false,
  // });
  //
  // if (!eventActivity.length) return;
  //
  // for await (const { id, executor } of eventActivity) {
  //   await eventActivityService.addTime(id, 1);
  //   await eventsmodeService.editStatistics(executor.userId, executor.guild.id, {
  //     weeklyTime: 1,
  //     totalTime: 1,
  //   });
  // }
});
