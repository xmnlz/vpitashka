import {
  ApplicationCommandOptionType,
  bold,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  userMention,
} from 'discord.js';
import { Discord, Guard, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { Eventsmode, StaffRole } from '../../feature/eventsmode/eventsmode.entity.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { Guild } from '../../feature/guild/guild.entity.js';
import { CuratorGuard } from '../../guards/curator.guard.js';
import { ModeratorGuard } from '../../guards/moderator.guard.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { getStuffRole, interpolate, userWithNameAndId } from '../../lib/log-formatter.js';
import { logger } from '../../lib/logger.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@injectable()
@Guard(CuratorGuard)
@SlashGroup({ description: 'Manage eventsmode', name: 'eventsmode' })
export class Command {
  constructor(
    private eventsmodeService: EventsmodeService,
    private loggerService: LoggerService,
  ) {}

  @SlashGroup('eventsmode')
  @Slash({ description: 'List of all eventsmode' })
  async list(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventsmode = await Eventsmode.find({
      where: { guild: { id: ctx.guild.id }, isHired: true },
      order: { staffRole: 'ASC' },
    });

    if (!eventsmode.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: `Список eventsmode-в пуст.`,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const textChunks = chunks(
      eventsmode.map(({ userId, staffRole }, index) =>
        interpolate(`${index + 1}. ${userMention(userId)} | ${getStuffRole(staffRole)}`, [
          userMention(userId),
          bold(getStuffRole(staffRole)),
        ]),
      ),
      20,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INVISIBLE);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }

  @SlashGroup('eventsmode')
  @Slash({ description: 'Hire new eventsmode' })
  async add(
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

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const { isRolesConfigured, eventsmodeRoleId } = guild!.settingsManagement;

    if (!isRolesConfigured) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.ROLES_NOT_CONFIGURED,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.eventsmodeService.createEventsmode(member.id, member.guild.id);
    await member.roles.add(eventsmodeRoleId).catch(logger.error);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 нанял $2 на позицию $3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          userWithNameAndId(member.user),
          bold('Eventsmode'),
        ],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `Пользователь $1 был нанят как ${bold('Eventsmode')}`,
        replaceArgs: [userWithNameAndId(member.user), bold('Eventsmode')],
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('eventsmode')
  @Slash({ description: 'Fire eventsmode' })
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

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const { isRolesConfigured, eventsmodeRoleId } = guild!.settingsManagement;

    if (!isRolesConfigured) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.ROLES_NOT_CONFIGURED,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.eventsmodeService.removeEventsmode(member.id, member.guild.id);
    await member.roles.remove(eventsmodeRoleId).catch(logger.error);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 снял пользователя $2 с должности $3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          userWithNameAndId(member.user),
          bold('Eventsmode'),
        ],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `$1 был снят с должности $3`,
        replaceArgs: [userWithNameAndId(member.user), bold('Eventsmode')],
        status: Colors.SUCCESS,
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('eventsmode')
  @Guard(ModeratorGuard)
  @Slash({ description: 'Fire eventsmode' })
  async assent(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    @SlashChoice({ name: 'Admin', value: String(StaffRole.Admin) })
    @SlashChoice({ name: 'Moderator', value: String(StaffRole.Moderator) })
    @SlashChoice({ name: 'Curator', value: String(StaffRole.Curator) })
    @SlashChoice({ name: 'Coach', value: String(StaffRole.Coach) })
    @SlashChoice({ name: 'Eventsmode', value: String(StaffRole.Eventsmode) })
    @SlashOption({
      description: 'Choice staff role for user',
      name: 'role',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    staffRole: number,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    const eventsmode = await Eventsmode.findOneBy({
      userId: member.id,
      guild: { id: member.guild.id },
      isHired: true,
    });

    if (!eventsmode)
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.EVENTSMODE_NOT_EXISTS,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });

    await this.eventsmodeService.assentEventsmode(member.id, member.guild.id, staffRole);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 поставил $2 на должность $3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          userWithNameAndId(member.user),
          getStuffRole(staffRole),
        ],
      }),
    });

    await ctx.editReply(
      embedResponse({
        template: `$1 был поставлен на должность $2`,
        replaceArgs: [userWithNameAndId(member.user), bold(getStuffRole(staffRole))],
        ephemeral: true,
      }),
    );
  }
}
