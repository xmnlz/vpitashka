import { Interaction } from 'discord.js';
import { ArgsOf, Client, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';
import { Guild } from '../../feature/guild/guild.entity.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { logger } from '../../lib/logger.js';

@Discord()
@injectable()
export class Event {
  @On({ event: 'interactionCreate' })
  async onInteractionCreate([interaction]: ArgsOf<'interactionCreate'>, bot: Client) {
    if (!(interaction.member && interaction.guild && 'id' in interaction.member)) return;

    if (
      interaction.isCommand() ||
      interaction.isMessageComponent() ||
      interaction.isModalSubmit() ||
      interaction.isAnySelectMenu()
    ) {
      const guild = await Guild.findOneBy({ id: interaction.guild.id, isEnabled: true });

      if (!guild) {
        await interaction
          .reply(
            embedResponse({
              template: BotMessages.GUILD_NOT_REGISTERED,
              status: Colors.DANGER,
              ephemeral: true,
            }),
          )
          .catch(logger.error);
      }
    }

    await bot.executeInteraction(interaction);
  }
}
