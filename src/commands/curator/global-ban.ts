import {
  ApplicationCommandOptionType,
  bold,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  time,
  userMention,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption, SlashGroup } from 'discordx';
import { injectable } from 'tsyringe';
import { GlobalEventBanService } from '../../feature/event/event-ban/global-event-ban.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { Guild } from '../../feature/guild/guild.entity.js';
import { CuratorGuard } from '../../guards/curator.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { interpolate, userWithNameAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@injectable()
@Guard(CuratorGuard)
@SlashGroup({ description: 'Manage global bans and stuff', name: 'gban' })
export class Command {
  constructor(
    private globalEventBanService: GlobalEventBanService,
    private loggerService: LoggerService,
  ) {}

  @SlashGroup('gban')
  @Slash({ description: 'Add user to global ban list' })
  async add(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    @SlashOption({
      description: 'reason',
      name: 'reason',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    reason: string,
    ctx: CommandInteraction<'cached'>,
  ) {
    await this.globalEventBanService.addGlobalBan(member.id, ctx.guild.id, reason);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 добавил $2 в глобальный бан по причинае: $3`,
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), reason],
      }),
    });

    await ctx.reply(
      embedResponse({
        template: `$1 был добавлен в глобальный бан по причинае: $2`,
        replaceArgs: [userWithNameAndId(member.user), reason],
        ephemeral: true,
        status: Colors.SUCCESS,
      }),
    );
  }

  @SlashGroup('gban')
  @Slash({ description: 'Remove user from global ban list' })
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
    await this.globalEventBanService.removeGlobalBan(member.id, ctx.guild.id);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 убрал $2 из глобального бана`,
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user)],
      }),
    });

    await ctx.reply(
      embedResponse({
        template: `$1 был убран из глобального бана`,
        replaceArgs: [userWithNameAndId(member.user)],
        status: Colors.SUCCESS,
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('gban')
  @Slash({ description: 'Remove user from global ban list' })
  async list(ctx: CommandInteraction<'cached'>) {
    const guild = await Guild.findOne({
      where: { id: ctx.guild.id },
      relations: { globalEventBans: true },
    });

    const { globalEventBans } = guild!;

    if (!globalEventBans.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Global Event ban list is empty yo',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const textChunks = chunks(
      globalEventBans.map(({ target, reason, bannedAt }, index) =>
        interpolate(`${index + 1}. $1 | Reason: $2 | Banned At: $3`, [
          userMention(target.userId),
          bold(reason),
          time(~~(bannedAt.getTime() / 1000)),
        ]),
      ),
      5,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INVISIBLE);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
