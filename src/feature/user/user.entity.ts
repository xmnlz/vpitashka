import type { Snowflake } from 'discord.js';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Guild } from '../guild/guild.entity.js';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  userId: Snowflake;

  @Column('bigint', { default: 100 })
  reputationScore: number;

  @Column('bigint', { default: 0 })
  totalEventTime: number;

  @Column('text', { default: 'vorerst leer' })
  favoriteEvent: string;

  @ManyToOne(() => Guild, (guild) => guild.users, { eager: true })
  @JoinColumn()
  guild: Relation<Guild>;
}
