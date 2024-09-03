import { ModalSubmitInteraction } from 'discord.js';
import { Discord, Guard, ModalComponent } from 'discordx';
import { PermissionRole } from '../../../guards/permission-role.guard';
import { permissionRole } from '../../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.administrator))
export class Command {
  @ModalComponent({ id: '@modal/logger' })
  async modalLoggerHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const testField = ctx.fields.getTextInputValue('@modal-field/test');

    await ctx.reply(testField);
  }
}
