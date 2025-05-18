import type { GuardFn } from "disenchantment";
import { eventmode, type SelectEventmode } from "../schemas/eventmode";
import { EmbedBuilder, type CommandInteraction } from "discord.js";
import { db } from "../database/database";
import { and, eq, gte } from "drizzle-orm/pg-core/expressions";
import type { SelectGuild } from "../schemas/guild";

export type PermissionRoleGuardProps = {
  guild: SelectGuild;
  eventmode: SelectEventmode;
};

export const permissionRoleGuard = (role: number) => {
  const guard: GuardFn<
    CommandInteraction<"cached">,
    PermissionRoleGuardProps
  > = async (_client, ctx, next, props) => {
    const user = await db.query.eventmode.findFirst({
      with: { guild: true },
      where: and(
        eq(eventmode.isHired, true),
        eq(eventmode.guildId, ctx.guild.id),
        eq(eventmode.userId, ctx.user.id),
        gte(eventmode.permissionRole, role),
      ),
    });

    if (user) {
      props.eventmode = user;
      props.guild = user.guild;
      return next();
    }

    const notAllowedEmbed = new EmbedBuilder()
      .setColor("Random")
      .setDescription("Not allowed");

    if (ctx.deferred) {
      await ctx.editReply({ embeds: [notAllowedEmbed] });
      return;
    }

    await ctx.reply({ embeds: [notAllowedEmbed] });
    return;
  };

  return guard;
};
