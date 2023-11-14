import {
  ApplicationCommandOptionType,
  bold,
  codeBlock,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  time,
  userMention,
} from 'discord.js';
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { EventBan } from '../../feature/event/event-ban/event-ban.entity.js';
import { EventBanService } from '../../feature/event/event-ban/event-ban.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { interpolate, userWithNameAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@injectable()
@Guard(EventsmodeGuard)
@SlashGroup({ description: 'Manage temporary bans and stuff', name: 'tban' })
export class Command {
  constructor(
    private eventBanService: EventBanService,
    private loggerService: LoggerService,
  ) {}

  @SlashGroup('tban')
  @Slash({ description: 'Add user to ban list' })
  async add(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    @SlashOption({
      description: 'days',
      name: 'days',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    dayCount: number,
    @SlashOption({
      description: 'reason',
      name: 'reason',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    reason: string,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    if (member.id === ctx.user.id || member.user.bot) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'You cant ban yourself or ban a bot',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.eventBanService.addTemporaryBan({
      guildId: ctx.guild.id,
      executorId: ctx.user.id,
      targetId: member.id,
      days: dayCount,
      reason,
    });

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 добавил $2 в свой банлист $3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          userWithNameAndId(member.user),
          codeBlock(`Причина: ${reason}\nКол-во Дней: ${dayCount}`),
        ],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `$1 был добавлен в ваш ивент бан`,
        replaceArgs: [userWithNameAndId(member.user)],
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('tban')
  @Slash({ description: 'Remove user from ban list' })
  async remove(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    await this.eventBanService.removeTemporaryBan({
      guildId: ctx.guild.id,
      executorId: ctx.user.id,
      targetId: member.id,
    });

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 убрал $2 из своего ивент бана`,
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user)],
        status: Colors.DANGER,
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `$1 успешно был убран из вашего бан листа!`,
        replaceArgs: [userWithNameAndId(member.user)],
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('tban')
  @Slash({ description: 'All baned users' })
  async list(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember | undefined,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    const author = member || ctx.user;

    const eventBans = await EventBan.findBy({
      executor: { userId: author.id, guild: { id: ctx.guild.id } },
    });

    if (!eventBans.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Event ban list is empty yo',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const textChunks = chunks(
      eventBans.map(({ target, reason, days, bannedAt }, index) =>
        interpolate(`${index + 1}. $1 | Дни: $2 | Причина: $3 | Забнен: $4`, [
          userMention(target.userId),
          bold(days.toString()),
          bold(reason),
          time(~~(bannedAt.getTime() / 1000)),
        ]),
      ),
      5,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INFO);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
