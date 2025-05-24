import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  CommandInteraction,
  InteractionContextType,
} from "discord.js";
import { createCommand, guards, option } from "disenchantment";
import { permissionRoleGuard } from "../../guard/permission-role.guard";
import {
  eventmode,
  PermissionRole,
  permissionToString,
} from "../../schemas/eventmode";
import { generateCanvasProfile } from "../../lib/canvas/profile";
import { db } from "../../database/database";
import { and, eq } from "drizzle-orm/expressions";
import { sql } from "drizzle-orm";

const calculateProgress = (targetTime: number, weeklyTimeQuote: number) => {
  const percent = (weeklyTimeQuote / targetTime) * 100;
  return Math.min(Math.max(Math.round(percent), 0), 100);
};

const getEventmodeRank = async (guildId: string, userId: string) => {
  const ranked = db
    .select({
      userId: eventmode.userId,
      top: sql<number>`RANK() OVER (ORDER BY ${eventmode.weeklyTime} DESC)`.as(
        "top",
      ),
    })
    .from(eventmode)
    .where(and(eq(eventmode.guildId, guildId), eq(eventmode.isHired, true)))
    .as("ranked");

  const [row] = await db
    .select({ top: ranked.top })
    .from(ranked)
    .where(eq(ranked.userId, userId));

  return row?.top ?? 0;
};

export const profile = createCommand({
  name: "profile",
  description: "Show your or another member's eventsmode profile",
  context: [InteractionContextType.Guild],
  guards: guards(permissionRoleGuard(PermissionRole.eventsmode)),
  options: {
    member: option({
      type: ApplicationCommandOptionType.User,
      name: "member",
      description: "The member whose profile you want to view",
      required: false,
    }),
  },

  handler: async (i: CommandInteraction<"cached">, { member }, { guild }) => {
    const targetMember = member || i.member;

    const _eventmode = await db.query.eventmode.findFirst({
      where: and(
        eq(eventmode.guildId, targetMember.guild.id),
        eq(eventmode.userId, targetMember.user.id),
      ),
      with: { warns: true },
    });

    if (!_eventmode) return;

    const eventmodeRank = await getEventmodeRank(
      targetMember.guild.id,
      targetMember.user.id,
    );

    const profileImage = await generateCanvasProfile({
      user: {
        avatar: targetMember.displayAvatarURL({ extension: "webp" }),
        nickname: targetMember.displayName,
        permissionRole: permissionToString(_eventmode.permissionRole),
      },
      stats: {
        weeklySalary: _eventmode.weeklySalary,
        weeklyTime: _eventmode.weeklyTime,

        totalSalary: _eventmode.totalSalary,
        totalTime: _eventmode.totalTime,

        favoriteEvent: _eventmode.favoriteEvent,

        hiredAt: _eventmode.hiredAt,
        hearts: _eventmode.hearts,

        top: eventmodeRank,
        longestEvent: "deprecated",
        totalWarns: _eventmode.warns.length,

        percentage: calculateProgress(
          _eventmode.weeklyTime,
          guild.protoSettings.general.minimumWeeklyQuota,
        ),
      },
    });

    await i.reply({
      files: [new AttachmentBuilder(profileImage, { name: "profile.png" })],
    });
  },
});
