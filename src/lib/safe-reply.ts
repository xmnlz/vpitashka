import type {
  CommandInteraction,
  InteractionReplyOptions,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export const safeReply = (
  ctx:
    | CommandInteraction<'cached'>
    | MessageComponentInteraction<'cached'>
    | ModalSubmitInteraction<'cached'>,
  content: InteractionReplyOptions,
) => {
  if (ctx.deferred) {
    return ctx.editReply(content);
  }

  return ctx.reply(content);
};
