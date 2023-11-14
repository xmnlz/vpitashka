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
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Guild, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  guild: Relation<Guild>;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  category: string;

  @Column('float8', { nullable: false })
  multiplayer: number;

  @Column('simple-json', { nullable: false })
  startEmbed: string;

  @Column('simple-json', { nullable: false })
  announcedEmbed: string;
}
