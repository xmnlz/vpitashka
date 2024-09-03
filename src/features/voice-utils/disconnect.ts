import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';

@Discord()
@SlashGroup({ name: 'voice', description: 'voice' })
export class Command {
  @SlashGroup('voice')
  @Slash({
    description: 'voice',
  })
  async disconnect(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply();

    const connection = getVoiceConnection(ctx.guild.id);

    if (!connection) {
      return await ctx.editReply('123');
    }

    connection.disconnect();

    await ctx.editReply('ssss');
  }
}
