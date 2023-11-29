import { ArgsOf, Client, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';
import { GlobalEventBan } from '../../feature/event/event-ban/global-event-ban.entity.js';
import { Guild } from '../../feature/guild/guild.entity.js';
import { GuildService } from '../../feature/guild/guild.service.js';

@Discord()
@injectable()
export class Event {
  constructor(private guildService: GuildService) {}
  @On({ event: 'voiceStateUpdate' })
  async onVoiceStateUpdate([oldState, newState]: ArgsOf<'voiceStateUpdate'>, bot: Client) {
    const member = oldState.member || newState.member;
    if (!member) return;

    const guild = await Guild.findOneBy({ id: oldState.guild.id, isEnabled: true });
    if (!guild) return;

    if (
      newState.channel?.parent &&
      newState.channel?.parent.id === guild.settingsManagement.eventsmodeCategoryId
    ) {
      const user = await GlobalEventBan.findOne({
        relations: { target: true },
        where: { target: { userId: member.id, guild: { id: member.guild.id } } },
      });

      if (!user) return;

      await newState.disconnect('User is global banned from event');
    }
  }
}
