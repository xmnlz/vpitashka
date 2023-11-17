import {
  ActionRowBuilder,
  ButtonInteraction,
  CategoryChannel,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ChannelType,
  OverwriteType,
  ComponentType,
} from 'discord.js';

import { ButtonComponent, Discord } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventBan } from '../../feature/event/event-ban/event-ban.entity.js';
import { Event } from '../../feature/event/event.entity.js';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { Guild } from '../../feature/guild/guild.entity.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { isGuildMember } from '../../lib/is-guild-member.js';
import { logger } from '../../lib/logger.js';
import { permissionForChannels } from '../../lib/permission-for-channels.js';
import { safeJsonParse } from '../../lib/safe-json-parse.js';

@Discord()
@injectable()
export class Button {
  constructor(private readonly eventActivityService: EventActivityService) {}

  @ButtonComponent({ id: '@action/start-event' })
  async startEventAction(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const guild = await Guild.findOne({
      where: { id: ctx.guild.id },
      relations: { globalEventBans: true },
    });

    const eventsmode = await Eventsmode.findOneBy({
      userId: ctx.member.id,
      guild: { id: ctx.guild.id },
      isHired: true,
    });

    if (!eventsmode) {
      await ctx.followUp({});
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.EVENTSMODE_NOT_EXISTS,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
      guild: { id: ctx.guild.id },
    });

    if (eventActivity) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'You already have an active event going on.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const allEvents = await Event.find({
      where: { guild: { id: ctx.guild.id } },
    });

    if (!allEvents.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.EVENT_LIST_EMPTY,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const allCategory = [...new Set(allEvents.map(({ category }) => category))];

    const categorySelectMenuRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('@select/choose-event-category')
          .setPlaceholder('Choose event category')
          .addOptions(
            allCategory.map((value) => {
              return { label: value, value };
            }),
          ),
      );

    const categorySelectMessage = await ctx.followUp({
      components: [categorySelectMenuRow],
      ephemeral: true,
    });

    const categorySelectCollector = categorySelectMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 15_000,
    });

    categorySelectCollector.once(
      'collect',
      async (categorySelectMenuCtx: StringSelectMenuInteraction<'cached'>) => {
        await categorySelectMenuCtx.deferReply({ ephemeral: true });

        const eventCategory = categorySelectMenuCtx.values[0];

        const eventSelectMenuRow =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('@select/choose-event')
              .setPlaceholder('Choose event by name')
              .addOptions(
                allEvents
                  .filter((event) => event.category === eventCategory)
                  .map(({ name }) => {
                    return { label: name, value: name };
                  }),
              ),
          );

        const eventSelectMessage = await categorySelectMenuCtx.editReply({
          components: [eventSelectMenuRow],
        });

        const eventSelectCollector = eventSelectMessage.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 15_000,
        });

        eventSelectCollector.once(
          'collect',
          async (eventSelectMenuCtx: StringSelectMenuInteraction<'cached'>) => {
            await eventSelectMenuCtx.deferReply({ ephemeral: true });

            const event = await Event.findOneBy({
              guild: { id: ctx.guild.id },
              category: eventCategory,
              name: eventSelectMenuCtx.values[0],
            });

            if (!event) {
              throw new CommandError({
                ctx: eventSelectMenuCtx,
                content: embedResponse({
                  template: BotMessages.SOMETHING_GONE_WRONG,
                  status: Colors.DANGER,
                  ephemeral: true,
                }),
              });
            }

            const {
              isChannelConfigured,
              isEventAnnounce,
              eventsmodeCategoryId,
              announceEventChannelId,
            } = guild!.settingsManagement;

            if (!isChannelConfigured) {
              throw new CommandError({
                ctx: eventSelectMenuCtx,
                content: embedResponse({
                  template: 'channel is not configured',
                  status: Colors.DANGER,
                  ephemeral: true,
                }),
              });
            }

            const eventCategoryChannel = eventSelectMenuCtx.guild.channels.cache.get(
              eventsmodeCategoryId,
            ) as CategoryChannel | undefined;

            if (!eventCategoryChannel) {
              throw new CommandError({
                ctx: eventSelectMenuCtx,
                content: embedResponse({
                  template: 'bot cant fetch channel :((',
                  status: Colors.DANGER,
                  ephemeral: true,
                }),
              });
            }

            const eventBans = await EventBan.findBy({
              executor: { userId: ctx.user.id, guild: { id: ctx.guild.id } },
              guild: { id: ctx.guild.id },
            });

            const eventVoiceChannelRaw = await eventCategoryChannel.children.create({
              name: event.name,
              userLimit: 10,
              type: ChannelType.GuildVoice,
              position: 0,
            });

            const eventTextChannelRaw = await eventCategoryChannel.children.create({
              name: event.name,
              type: ChannelType.GuildText,
            });

            const eventVoiceChannel = await eventVoiceChannelRaw.lockPermissions();
            const eventTextChannel = await eventTextChannelRaw.lockPermissions();

            if (!eventBans.length) {
              for (const { target } of eventBans) {
                if (await isGuildMember(ctx.guild, target.userId)) {
                  await permissionForChannels(
                    [eventVoiceChannel, eventTextChannel],
                    target.userId,
                    {
                      Speak: false,
                      Connect: false,
                      SendMessages: false,
                    },
                    { type: OverwriteType.Member },
                  );
                }
              }
            }

            const { globalEventBans } = guild!;

            if (globalEventBans.length) {
              for (const { target } of globalEventBans) {
                if (await isGuildMember(ctx.guild, target.userId)) {
                  await permissionForChannels(
                    [eventVoiceChannel, eventTextChannel],
                    target.userId,
                    {
                      Speak: false,
                      Connect: false,
                      SendMessages: false,
                    },
                    { type: OverwriteType.Member },
                  );
                }
              }
            }

            await permissionForChannels(
              [eventVoiceChannel, eventTextChannel],
              eventSelectMenuCtx.user.id,
              {
                ManageChannels: true,
                SendMessages: true,
                ViewChannel: true,
              },
              { type: OverwriteType.Member },
            );

            if (isEventAnnounce) {
              if (!announceEventChannelId.length) {
                throw new CommandError({
                  ctx: eventSelectMenuCtx,
                  content: embedResponse({
                    template:
                      'Please contact your moderator/administrator to setup announce channel',
                    status: Colors.DANGER,
                    ephemeral: true,
                  }),
                });
              }

              if (!event.announcedEmbed.length) {
                throw new CommandError({
                  ctx: eventSelectMenuCtx,
                  content: embedResponse({
                    template:
                      'Please contact your moderator/administrator to setup announce embed to event',
                    status: Colors.DANGER,
                    ephemeral: true,
                  }),
                });
              }

              const eventAnnounceChannel =
                eventSelectMenuCtx.guild.channels.cache.get(announceEventChannelId);

              if (!eventAnnounceChannel) {
                throw new CommandError({
                  ctx: eventSelectMenuCtx,
                  content: embedResponse({
                    template: 'bot cant fetch channel :((',
                    status: Colors.DANGER,
                    ephemeral: true,
                  }),
                });
              }

              if (!eventAnnounceChannel.isTextBased()) {
                throw new CommandError({
                  ctx: eventSelectMenuCtx,
                  content: embedResponse({
                    template: 'bot cant fetch channel :((',
                    status: Colors.DANGER,
                    ephemeral: true,
                  }),
                });
              }

              await eventAnnounceChannel
                .send(
                  safeJsonParse(event.announcedEmbed, {
                    content: BotMessages.SOMETHING_GONE_WRONG,
                  }),
                )
                .catch(logger.error);
            }

            await this.eventActivityService.createEventActivity({
              guildId: eventSelectMenuCtx.guild.id,
              event,
              eventsmode,
              voiceChannelId: eventVoiceChannel.id,
              textChannelId: eventTextChannel.id,
            });

            await eventSelectMenuCtx.editReply({
              content: 'Event was successfully created!',
              components: [],
            });

            await eventTextChannel
              .send(safeJsonParse(event.startEmbed, { content: BotMessages.SOMETHING_GONE_WRONG }))
              .then(async (msg) => await msg.pin())
              .catch(logger.error);
          },
        );
      },
    );
  }
}
