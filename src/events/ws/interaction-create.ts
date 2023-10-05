import { ArgsOf, Client, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';

@Discord()
@injectable()
export class Event {

  @On({ event: 'interactionCreate' })
  async onInteractionCreate([interaction]: ArgsOf<'interactionCreate'>, bot: Client) {
    await bot.executeInteraction(interaction);
  }
}
