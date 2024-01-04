import { GuildMember, StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { ArgsOf, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { GlobalEventBan } from '../../feature/event/event-ban/global-event-ban.entity.js';
import { Eventsmode, StaffRole } from '../../feature/eventsmode/eventsmode.entity.js';
import { Guild } from '../../feature/guild/guild.entity.js';

@Discord()
@injectable()
export class Event {
  async toggleChannelPerms(
    voiceState: StageChannel | VoiceChannel,
    member: GuildMember,
    guildEntity: Guild,
    permission: boolean,
  ) {
    if (voiceState.parent?.id !== guildEntity.settingsManagement.eventsmodeCategoryId) return;

    const eventActivity = await EventActivity.findOne({
      where: { voiceChannelId: voiceState.id },
    });
    if (!eventActivity) return;

    const textChannel = voiceState.guild.channels.cache.get(eventActivity.textChannelId) as
      | TextChannel
      | undefined;

    if (!textChannel) return;

    await textChannel.permissionOverwrites.edit(member.id, { SendMessages: permission });
  }

  @On({ event: 'voiceStateUpdate' })
  async onVoiceStateUpdateBan([oldState, newState]: ArgsOf<'voiceStateUpdate'>) {
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

  @On({ event: 'voiceStateUpdate' })
  async onVoiceStateUpdateTextPerms([oldState, newState]: ArgsOf<'voiceStateUpdate'>) {
    const member = oldState.member || newState.member;
    if (!member) return;

    const eventsmode = await Eventsmode.findOneBy({
      userId: member.user.id,
      guild: { id: member.guild.id },
      isHired: true,
    });

    if (eventsmode && eventsmode.staffRole >= StaffRole.Eventsmode) return;

    const guild = await Guild.findOneBy({ id: oldState.guild.id, isEnabled: true });
    if (!guild) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (newChannel && oldChannel !== newChannel) {
      await this.toggleChannelPerms(newChannel, member, guild, true);
    }

    if (oldChannel && oldChannel !== newChannel) {
      await this.toggleChannelPerms(oldChannel, member, guild, false);
    }
  }
}
