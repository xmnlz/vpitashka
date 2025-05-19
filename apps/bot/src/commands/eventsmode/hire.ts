import {
  ApplicationCommandOptionType,
  CommandInteraction,
  InteractionContextType,
} from "discord.js";
import { createCommand, guards, option } from "disenchantment";
import { eventmode, permissionRole } from "../../schemas/eventmode";
import { sql } from "drizzle-orm";
import { db } from "../../database/database";
import { permissionRoleGuard } from "../../guard/permission-role.guard";

export const hire = createCommand({
  name: "hire",
  description: "Hire eventsmode",
  context: [InteractionContextType.Guild],
  guards: guards(permissionRoleGuard(permissionRole.curator)),
  options: {
    user: option({
      name: "user",
      description: "user",
      required: true,
      type: ApplicationCommandOptionType.User,
    }),
  },
  handler: async (ctx: CommandInteraction<"cached">, { user }) => {
    await ctx.deferReply();

    await db
      .insert(eventmode)
      .values({ userId: user.id, guildId: ctx.guild.id })
      .onConflictDoUpdate({
        target: [eventmode.userId, eventmode.guildId],
        set: { isHired: sql`NOT ${eventmode.isHired}` },
      })
      .returning();

    await ctx.editReply("respect");
  },
});
