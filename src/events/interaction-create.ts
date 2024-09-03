import { type ArgsOf, Client, Discord, On } from 'discordx';

@Discord()
export class Event {
  @On({ event: 'interactionCreate' })
  async onInteractionCreate([interaction]: ArgsOf<'interactionCreate'>, bot: Client) {
    if (!interaction.inCachedGuild()) return;

    await bot.executeInteraction(interaction);
  }
}
