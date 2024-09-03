import { joinVoiceChannel } from '@discordjs/voice';
import {
  ApplicationCommandOptionType,
  channelMention,
  ChannelType,
  CommandInteraction,
  VoiceChannel,
} from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';

import { PermissionRole, type GuardPropsType } from '../../guards/permission-role.guard';
import { i18n } from '../../lib/i18n';
import { permissionRole } from '../../schemas/eventsmodes';

@Discord()
@SlashGroup({ name: 'voice', description: 'voice' })
export class Command {
  @SlashGroup('voice')
  @Guard(PermissionRole(permissionRole.developer))
  @Slash({ description: 'Connection to the selected voice channel' })
  async connect(
    @SlashOption({
      description: 'Select any voice channel to connect',
      name: 'voice',
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildVoice],
    })
    channel: VoiceChannel,
    ctx: CommandInteraction<'cached'>,
    _: Client,
    props: GuardPropsType,
  ) {
    await ctx.deferReply();

    const {
      eventsmode: { preferredLanguage },
    } = props;

    const t = i18n(preferredLanguage);

    const voiceChannel: VoiceChannel | undefined = channel || ctx.member.voice.channel?.id;

    if (voiceChannel) {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: ctx.guild.id,
        adapterCreator: ctx.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      await ctx.editReply(
        t('voice.connect.successReply', { channel: channelMention(voiceChannel.id) }),
      );
    } else {
      await ctx.editReply(t('voice.connect.errorReply'));
    }
  }
}
