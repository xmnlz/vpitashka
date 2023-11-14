import { ArgsOf, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { SettingsManagement } from '../../feature/guild/settings-management/settings-management.entity.js';

@Discord()
@injectable()
export class Event {
  constructor(private eventActivityService: EventActivityService) {}
  @On({ event: 'channelDelete' })
  async onChannelDelete([channel]: ArgsOf<'channelDelete'>) {
    if ((!channel.isDMBased() && channel.isTextBased()) || channel.isVoiceBased()) {
      const settings = await SettingsManagement.findOneBy({ guild: { id: channel.guild.id } });

      if (!settings) return;

      if (settings.isChannelConfigured && channel.parent) {
        if (
          channel.parent.id === settings.eventsmodeCategoryId ||
          channel.parent.id === settings.startedEventCategoryId
        ) {
          const { id } = channel;

          const eventActivity = await EventActivity.findOne({
            where: [{ textChannelId: id }, { voiceChannelId: id }],
          });

          if (eventActivity) {
            await this.eventActivityService.deleteEventActivity(eventActivity.id);
          }
        }
      }
    }
  }
}
