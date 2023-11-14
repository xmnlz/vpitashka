import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonComponentData,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Discord, Guard, Slash } from 'discordx';
import { injectable } from 'tsyringe';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { ModeratorGuard } from '../../guards/moderator.guard.js';
import { embedResponse } from '../../lib/embed-response.js';
import { userWithNameAndId } from '../../lib/log-formatter.js';

@Discord()
@injectable()
@Guard(ModeratorGuard)
export class Command {
  constructor(
    private readonly eventsmodeService: EventsmodeService,
    private readonly loggerService: LoggerService,
  ) {}
  @Slash({ description: 'Reset weekly statistics' })
  async reset(ctx: CommandInteraction<'cached'>) {
    await this.eventsmodeService.resetWeekly(ctx.guild.id);

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 сбросил неделную статистику`,
        replaceArgs: [userWithNameAndId(ctx.user)],
      }),
    });

    await ctx.reply({ content: 'Недельная статистика была успешно сброшенна! ', ephemeral: true });
  }
}
