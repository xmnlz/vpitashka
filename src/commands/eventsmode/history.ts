import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  userMention,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';
import moment from 'moment/moment.js';
import { Between } from 'typeorm';
import { EventHistory } from '../../feature/event/event-history/event-history.entity.js';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { generateEventsmodeProfile } from '../../html/eventsmode-profile/profile.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { interpolate, userWithNameAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@Guard(EventsmodeGuard)
export class Command {
  @Slash({ description: 'Eventsmode all/weekly history' })
  async history(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember | undefined,
    @SlashOption({
      description: 'weekly',
      name: 'weekly',
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    weekly: boolean,
    ctx: CommandInteraction<'cached'>,
  ) {
    const author = member || ctx.member;

    const eventsmode = await Eventsmode.findOneBy({
      guild: { id: author.guild.id },
      userId: author.id,
      isHired: true,
    });

    if (!eventsmode) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.EVENTSMODE_NOT_EXISTS,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const eventHistory = weekly
      ? await EventHistory.findBy({
          guild: { id: ctx.guild.id },
          eventsmode: { guild: { id: author.guild.id }, userId: author.id, isHired: true },
          startedAt: Between(moment().startOf('week').toDate(), moment().endOf('week').toDate()),
        })
      : await EventHistory.findBy({
          guild: { id: ctx.guild.id },
          eventsmode: { guild: { id: author.guild.id }, userId: author.id, isHired: true },
        });

    if (!eventHistory.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: `$1 не запускал(а) никаких ивенто пока что.`,
          replaceArgs: [userWithNameAndId(author.user)],
          ephemeral: true,
          status: Colors.DANGER,
        }),
      });
    }

    const textChunks = chunks(
      eventHistory.map(({ totalTime, totalSalary, event }, index) =>
        interpolate(`${index + 1}. Ивент: $1 | Время : $2 | Зарплата: $3`, [
          event.name,
          humanizeMinutes(totalTime),
          totalSalary.toString(),
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
}
