import { Snowflake } from 'discord.js';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { EventActivity } from '../event/event-activity/event-activity.entity.js';
import { EventBan } from '../event/event-ban/event-ban.entity.js';
import { Guild } from '../guild/guild.entity.js';
import { Warn } from '../warn/warn.entity.js';

export enum StaffRole {
  Admin = 5,
  Moderator = 4,
  Curator = 3,
  Coach = 2,
  Eventsmode = 1,
}
@Entity()
export class Eventsmode extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { default: true })
  isHired: boolean;

  @Index()
  @Column('text')
  userId: Snowflake;

  @Column('enum', { enum: StaffRole, default: StaffRole.Eventsmode })
  staffRole: StaffRole;

  @Column('bigint', { default: 0 })
  totalTime: number;

  @Column('bigint', { default: 0 })
  weeklyTime: number;

  @Column('bigint', { default: 0 })
  totalSalary: number;

  @Column('bigint', { default: 0 })
  weeklySalary: number;

  @Column('bigint', { default: 0 })
  hearts: number;

  @Column('text', { default: 'vorerst leer' })
  favoriteEvent: string;

  @Column('bigint', { default: 0 })
  longestEvent: number;

  @CreateDateColumn()
  hiredAt: Date;

  @ManyToOne(() => Guild, (guild) => guild.eventsmodes, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  guild: Relation<Guild>;

  @OneToOne(() => EventActivity, (eventActivity) => eventActivity.executor)
  eventActivity: Relation<EventActivity>;

  @OneToMany(() => EventBan, (eventBan) => eventBan.executor, {
    eager: true,
    onDelete: 'CASCADE',
  })
  eventBans: Relation<EventBan[]>;

  @OneToMany(() => Warn, (warn) => warn.target, {
    eager: true,
    onDelete: 'CASCADE',
  })
  warns: Relation<Warn[]>;
}
