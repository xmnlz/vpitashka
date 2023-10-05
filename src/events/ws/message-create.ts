import { ArgsOf, Client, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';


@Discord()
@injectable()
export class Event {

  @On({ event: 'messageCreate' })
  async onMessageCreate([message]: ArgsOf<'messageCreate'>, bot: Client) {
      await bot.executeCommand(message);
  }
}
