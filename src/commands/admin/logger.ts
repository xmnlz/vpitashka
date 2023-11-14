import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { AdministratorGuard } from '../../guards/administrator.guard.js';

@Discord()
@injectable()
@Guard(AdministratorGuard)
@SlashGroup({ description: 'Manage logging stuff', name: 'logger' })
export class Command {
  constructor(private readonly loggerService: LoggerService) {}

  @SlashGroup('logger')
  @Slash({ description: 'All events by week' })
  async add(
    @SlashOption({
      description: 'guild id',
      name: 'guild',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    guild: string,
    @SlashOption({
      description: 'logger channel id',
      name: 'channel',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    channel: string,
    ctx: CommandInteraction<'cached'>,
  ) {
    await this.loggerService.createLogger(ctx.guild.id, guild, channel);

    await ctx.reply('Logger channel was created');
  }
}
