import { ArgsOf, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';

@Discord()
@injectable()
export class Event {
  constructor(
    private eventActivityService: EventActivityService,
    private eventsmodeService: EventsmodeService,
  ) {}
  @On({ event: 'guildMemberRemove' })
  async onGuildMemberRemove([member]: ArgsOf<'guildMemberRemove'>) {
    const eventsmode = await Eventsmode.findOneBy({
      guild: { id: member.guild.id },
      userId: member.id,
    });

    if (eventsmode) {
      await this.eventsmodeService.removeEventsmode(member.id, member.guild.id);
    }
  }
}
