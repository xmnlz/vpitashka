import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  time,
  userMention,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption, SlashGroup, SelectMenuComponent } from 'discordx';
import { injectable } from 'tsyringe';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { Warn } from '../../feature/warn/warn.entity.js';
import { WarnService } from '../../feature/warn/warn.service.js';
import { CuratorGuard } from '../../guards/curator.guard.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { interpolate, userWithNameAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@injectable()
@Guard(CuratorGuard)
@SlashGroup({ description: 'Manage warns', name: 'warn' })
export class Command {
  constructor(
    private readonly warnService: WarnService,
    private readonly loggerService: LoggerService,
  ) {}

  @SlashGroup('warn')
  @Slash({ description: 'Add warn to eventsmode' })
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
    @SlashOption({
      description: 'is-verbal',
      name: 'verbal',
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    isVerbal: boolean | undefined,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    await this.warnService.addWarn(ctx.user.id, member.user.id, ctx.guild.id, isVerbal, reason);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 дал варн $2 по причине: $3`,
        replaceArgs: [userWithNameAndId(ctx.user), userWithNameAndId(member.user), reason],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `Вы успешно выдали варн $1`,
        replaceArgs: [userWithNameAndId(member.user)],
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('warn')
  @Slash({ description: 'remove warn to eventsmode' })
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

    const warns = await Warn.find({
      where: {
        guild: { id: ctx.guild.id },
        target: { userId: member.user.id, guild: { id: ctx.guild.id } },
      },
      relations: { executor: true },
    });

    if (!warns.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'У данного пользователя нету варнов.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const mappedWarns = warns.map((warn) => {
      return {
        value: warn.id,
        label: `Выдал: ${warn.executor.userId}`,
        description: `Прична: ${warn.reason} | Вербалный: ${warn.isVerbal}`,
      };
    });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('@select/remove-warn')
        .addOptions(mappedWarns)
        .setPlaceholder('Choose a warn to remove'),
    );

    await ctx.editReply({ components: [row] });
  }

  @SelectMenuComponent({ id: '@select/remove-warn' })
  async handleWarnRemove(ctx: StringSelectMenuInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const warnId = ctx.values?.[0];

    const warn = await Warn.findOne({
      where: { id: warnId, guild: { id: ctx.guild.id } },
      relations: { target: true },
    });

    if (!warn) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.SOMETHING_GONE_WRONG,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.warnService.removeWarn(warnId);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: '$1 удалил варн: $2 у пользователя $3',
        replaceArgs: [userWithNameAndId(ctx.user), warn.id, warn.target.userId],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: 'Вы успешно удалили варн у $1',
        replaceArgs: [userMention(warn.target.userId)],
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('warn')
  @Slash({ description: 'All warned users' })
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

    const author = member || ctx.member;

    const warns = await Warn.find({
      relations: { target: true, executor: true },
      where: {
        guild: { id: ctx.guild.id },
        target: { userId: author.user.id, guild: { id: ctx.guild.id } },
      },
    });

    if (!warns.length)
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Пока варнов нет, радуйся!',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });

    const textChunks = chunks(
      warns.map(({ executor, warnedAt, reason, isVerbal }, index) =>
        interpolate(`${index + 1}. Выдал: $1 | Причина: $2 | Warned At: $3 | Вербалный: $4`, [
          userMention(executor.userId),
          reason,
          time(~~(warnedAt.getTime() / 1000)),
          String(isVerbal),
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
