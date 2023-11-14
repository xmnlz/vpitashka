import {
  CommandInteraction,
  InteractionReplyOptions,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export class CommandError extends Error {
  constructor(
    private readonly props: {
      ctx:
        | CommandInteraction<'cached'>
        | MessageComponentInteraction<'cached'>
        | ModalSubmitInteraction<'cached'>;
      content: InteractionReplyOptions;
    },
  ) {
    super();
  }

  async useErrorHandle() {
    const { ctx, content } = this.props;

    if (ctx.deferred) {
      await ctx.editReply(content);
      return;
    }

    await ctx.reply(content);
  }
}
