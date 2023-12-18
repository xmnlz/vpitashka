import type { Snowflake } from 'discord.js';
import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryColumn, Relation } from 'typeorm';
import { EventActivity } from '../event/event-activity/event-activity.entity.js';
import { EventBan } from '../event/event-ban/event-ban.entity.js';
import { GlobalEventHistory } from '../event/global-event-history/global-event-history.entity.js';
import { WeeklyEventHistory } from '../event/weekly-event-history/weekly-event-history.entity.js';
import { Eventsmode } from '../eventsmode/eventsmode.entity.js';
import { GlobalEventBan } from '../event/event-ban/global-event-ban.entity.js';
import { Warn } from '../warn/warn.entity.js';
import { SettingsManagement } from './settings-management/settings-management.entity.js';
import { User } from '../user/user.entity.js';

@Entity()
export class Guild extends BaseEntity {
  @PrimaryColumn('text')
  id: Snowflake;

  @Column('boolean', { default: false })
  isEnabled: boolean;

  @OneToMany(() => EventBan, (eventBan) => eventBan.guild, { cascade: true })
  eventBans: Relation<EventBan[]>;

  @OneToMany(() => Warn, (warn) => warn.guild, { cascade: true })
  warns: Relation<Warn[]>;

  @OneToMany(() => GlobalEventBan, (globalEventBan) => globalEventBan.guild, { cascade: true })
  globalEventBans: Relation<GlobalEventBan[]>;

  @OneToMany(() => Eventsmode, (eventsmode) => eventsmode.guild, { cascade: true })
  eventsmodes: Relation<Eventsmode[]>;

  @OneToMany(() => User, (user) => user.guild, { cascade: true })
  users: Relation<User[]>;

  @OneToMany(() => EventActivity, (eventActivity) => eventActivity.guild)
  eventActivities: Relation<EventActivity[]>;

  @OneToMany(() => GlobalEventHistory, (globalEventHistory) => globalEventHistory.guild)
  globalEventHistory: Relation<GlobalEventHistory[]>;

  @OneToMany(() => WeeklyEventHistory, (weeklyEventHistory) => weeklyEventHistory.guild)
  weeklyEventHistory: Relation<WeeklyEventHistory[]>;

  @OneToOne(() => SettingsManagement, (settingsManagement) => settingsManagement.guild, {
    eager: true,
  })
  settingsManagement: Relation<SettingsManagement>;
}
