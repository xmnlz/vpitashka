import { CommandInteraction, TextChannel } from 'discord.js';
import { Discord, Guard, Slash, SlashGroup } from 'discordx';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { permissionForChannels } from '../../lib/permission-for-channels.js';

@Discord()
@Guard(EventsmodeGuard)
@SlashGroup({ description: 'chat management', name: 'chat' })
export class Command {
  @SlashGroup('chat')
  @Slash({ description: 'open chat to everyone' })
  async open(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    if (!eventActivity) {
      // TODO: create special bot message for that kind of case's

      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.SOMETHING_GONE_WRONG,
          ephemeral: true,
        }),
      });
    }

    const { textChannelId } = eventActivity;

    const channel = (await ctx.guild.channels.fetch(textChannelId)) as TextChannel | undefined;

    if (!channel) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.SOMETHING_GONE_WRONG,
          ephemeral: true,
        }),
      });
    }

    await permissionForChannels([channel], ctx.guild.roles.everyone.id, {
      SendMessages: true,
    });

    await ctx.followUp(
      embedResponse({
        template: 'Чат успешно был открыт.',
        status: Colors.SUCCESS,
        ephemeral: true,
      }),
    );
  }

  @SlashGroup('chat')
  @Slash({ description: 'close chat to everyone' })
  async close(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    if (!eventActivity) {
      // TODO: create special bot message for that kind of case's

      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.SOMETHING_GONE_WRONG,
          ephemeral: true,
        }),
      });
    }

    const { textChannelId } = eventActivity;

    const channel = (await ctx.guild.channels.fetch(textChannelId)) as TextChannel | undefined;

    if (!channel) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.SOMETHING_GONE_WRONG,
          ephemeral: true,
        }),
      });
    }

    await permissionForChannels([channel], ctx.guild.roles.everyone.id, {
      SendMessages: false,
    });

    await ctx.followUp(
      embedResponse({
        template: 'Чат успешно был закрыт.',
        status: Colors.SUCCESS,
        ephemeral: true,
      }),
    );
  }
}
