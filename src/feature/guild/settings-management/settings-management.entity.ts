import { Snowflake } from 'discord.js';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Guild } from '../guild.entity.js';

@Entity()
export class SettingsManagement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Guild, (guild) => guild.settingsManagement)
  @JoinColumn()
  guild: Relation<Guild>;

  @Column('boolean', { default: false })
  isChannelConfigured: boolean;

  @Column('boolean', { default: false })
  isRolesConfigured: boolean;

  @Column('boolean', { default: false })
  isStartedEventCategory: boolean;

  @Column('boolean', { default: false })
  isEventAnnounce: boolean;

  @Column('integer', { default: 60 * 5 })
  minimumWeeklyQuota: number;

  @Column('text', { nullable: true })
  eventsmodeRoleId: Snowflake;

  @Column('text', { nullable: true })
  coachRoleId: Snowflake;

  @Column('text', { nullable: true })
  curatorRoleId: Snowflake;

  @Column('text', { nullable: true })
  moderatorRoleId: Snowflake;

  @Column('text', { nullable: true })
  adminRoleId: Snowflake;

  @Column('text', { nullable: true })
  eventsmodeCategoryId: Snowflake;

  @Column('text', { nullable: true })
  startedEventCategoryId: Snowflake;

  @Column('text', { nullable: true })
  announceEventChannelId: Snowflake;
}
