import {
  GuildChannelOverwriteOptions,
  PermissionOverwriteOptions,
  RoleResolvable,
  TextChannel,
  UserResolvable,
  VoiceChannel,
} from 'discord.js';

export const permissionForChannels = async (
  channels: Array<VoiceChannel | TextChannel>,
  userOrRole: RoleResolvable | UserResolvable,
  options: PermissionOverwriteOptions,
  overwriteOptions?: GuildChannelOverwriteOptions,
) => {
  channels.map(
    async (channel) =>
      await channel.permissionOverwrites.create(userOrRole, options, overwriteOptions),
  );
};
