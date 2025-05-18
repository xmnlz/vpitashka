import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";

type GuildProtoSettings = {
  general: {
    minimumWeeklyQuota: number;
  };

  roles: {
    eventsmodeRoleId: string | null;
    coachRoleId: string | null;
    curatorRoleId: string | null;
    moderatorRoleId: string | null;
    adminRoleId: string | null;
  };

  channels: {
    eventCategoryId: string | null;
    startedEventCategoryId: string | null;
    announceEventChannelId: string | null;
  };

  features: {
    eventAnnouncement: boolean;
    eventAutoPayment: boolean;
    eventActiveCategory: boolean;
  };
};

export const guild = pgTable("guilds", {
  id: text("id").primaryKey().notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  // preferredLanguage: text("preferred_language")
  //   .default("en-US")
  //   .notNull()
  //   .$type<SupportedLanguages>(),

  protoSettings: jsonb("proto_settings")
    .notNull()
    .$type<GuildProtoSettings>()
    .default({
      general: {
        // 5 hours | 5 * 60
        minimumWeeklyQuota: 300,
      },
      roles: {
        adminRoleId: null,
        moderatorRoleId: null,
        curatorRoleId: null,
        coachRoleId: null,
        eventsmodeRoleId: null,
      },
      channels: {
        eventCategoryId: null,
        announceEventChannelId: null,
        startedEventCategoryId: null,
      },
      features: {
        eventAnnouncement: false,
        eventAutoPayment: false,
        eventActiveCategory: false,
      },
    }),
});

export type SelectGuild = typeof guild.$inferSelect;
