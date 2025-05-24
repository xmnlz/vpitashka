import { createCommand, guards } from "disenchantment";
import { permissionRoleGuard } from "../../guard/permission-role.guard";
import {
  eventmode,
  PermissionRole,
  permissionToString,
} from "../../schemas/eventmode";
import { db } from "../../database/database";
import { and, desc, eq } from "drizzle-orm/expressions";
import { EmbedBuilder, userMention, type CommandInteraction } from "discord.js";
import { chunks } from "../../lib/pagination";

export const list = createCommand({
  name: "list",
  description: "adad",
  guards: guards(permissionRoleGuard(PermissionRole.eventsmode)),
  handler: async (i: CommandInteraction<"cached">) => {
    await i.deferReply();

    const eventsmodeList = await db.query.eventmode.findMany({
      where: and(
        eq(eventmode.isHired, true),
        eq(eventmode.guildId, i.guild.id),
      ),
      orderBy: [desc(eventmode.permissionRole)],
    });

    const textChunks = chunks(
      eventsmodeList.map(
        ({ userId, permissionRole }, index) =>
          `${index + 1}. ${userMention(userId)} | ${permissionToString(permissionRole)}`,
      ),
      10,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor("Random");
      embed.setDescription(textArray.join("\n"));
      return embed;
    });

    await i.editReply({ embeds });
  },
});
