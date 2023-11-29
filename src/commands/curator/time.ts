import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { CuratorGuard } from '../../guards/curator.guard.js';
import { embedResponse } from '../../lib/embed-response.js';
import { userWithNameAndId } from '../../lib/log-formatter.js';

@Discord()
@injectable()
@Guard(CuratorGuard)
@SlashGroup({ description: 'Manage eventsmode event time', name: 'time' })
export class Command {
  constructor(
    private eventsmodeService: EventsmodeService,
    private loggerService: LoggerService,
  ) {
    this.eventsmodeService = eventsmodeService;
    this.loggerService = loggerService;
  }

  @SlashGroup('time')
  @Slash({ description: 'add time to eventsmode' })
  async add(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    @SlashOption({
      description: 'amount',
      name: 'amount',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    amount: number,

    ctx: CommandInteraction<'cached'>,
  ) {
    await this.eventsmodeService.addTime(member.user.id, member.guild.id, amount);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: '$1 добавил $2 $3 минут',
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), String(amount)],
      }),
    });

    await ctx.reply({ content: 'done', ephemeral: true });
  }

  @SlashGroup('time')
  @Slash({ description: 'remove time from eventsmode' })
  async remove(
    @SlashOption({
      description: 'пользователь',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    @SlashOption({
      description: 'количество',
      name: 'amount',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    amount: number,
    ctx: CommandInteraction<'cached'>,
  ) {
    await this.eventsmodeService.removeTime(member.user.id, member.guild.id, amount);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: '$1 забрал $2 $3 минут',
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), String(amount)],
      }),
    });

    await ctx.reply({ content: 'done', ephemeral: true });
  }
}
