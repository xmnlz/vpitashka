import { createEvent } from "disenchantment";
import { db } from "../database/database";
import { eventmode } from "../schemas/eventmode";
import { and, eq } from "drizzle-orm/expressions";

export const guildMemberRemoveEvent = createEvent({
  event: "guildMemberRemove",
  handler: async (_client, member) => {
    await db
      .update(eventmode)
      .set({ isHired: false })
      .where(
        and(
          eq(eventmode.userId, member.id),
          eq(eventmode.guildId, member.guild.id),
        ),
      );
  },
});
