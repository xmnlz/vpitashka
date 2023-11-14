import { Snowflake } from 'discord.js';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { Event } from '../event.entity.js';
import { Guild } from '../../guild/guild.entity.js';

@Entity()
export class EventActivity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Guild, (guild) => guild.eventActivities, { eager: true })
  @JoinColumn()
  guild: Relation<Guild>;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', eager: true })
  event: Relation<Event>;

  @Column('text', { nullable: false })
  textChannelId: Snowflake;

  @Column('text')
  voiceChannelId: Snowflake;

  @OneToOne(() => Eventsmode, (eventsmode) => eventsmode.eventActivity, { eager: true })
  @JoinColumn({ name: 'eventsmode_id', foreignKeyConstraintName: 'user_id' })
  executor: Relation<Eventsmode>;

  @Column('int', { default: 0 })
  eventTime: number;

  @Column('timestamptz', { nullable: true })
  startedAt: Date;

  @Column('boolean', { default: false })
  isStared: boolean;

  @Column('boolean', { default: false })
  isPaused: boolean;

  @Column('boolean', { default: false })
  isEnded: boolean;
}
