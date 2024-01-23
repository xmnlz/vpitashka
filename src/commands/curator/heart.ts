import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { CuratorGuard } from '../../guards/curator.guard.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js';
import { embedResponse } from '../../lib/embed-response.js';
import { userWithNameAndId } from '../../lib/log-formatter.js';

@Discord()
@injectable()
@Guard(CuratorGuard)
@SlashGroup({ description: 'Manage eventsmode hearts', name: 'heart' })
export class Command {
  constructor(
    private eventsmodeService: EventsmodeService,
    private loggerService: LoggerService,
  ) {
    this.eventsmodeService = eventsmodeService;
    this.loggerService = loggerService;
  }

  @SlashGroup('heart')
  @Slash({ description: 'add heart to eventsmode' })
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
    await this.eventsmodeService.addHeart(member.user.id, member.guild.id, amount);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: '$1 добавил $2 $3 сердец',
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), String(amount)],
      }),
    });

    await ctx.reply({ content: 'done', ephemeral: true });
  }

  @SlashGroup('heart')
  @Slash({ description: 'remove heart from eventsmode' })
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
    await this.eventsmodeService.removeHeart(member.user.id, member.guild.id, amount);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: '$1 забрал $2 $3 сердец',
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), String(amount)],
      }),
    });

    await ctx.reply({ content: 'done', ephemeral: true });
  }
}
