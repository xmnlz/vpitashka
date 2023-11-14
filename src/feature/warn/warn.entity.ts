import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Eventsmode } from '../eventsmode/eventsmode.entity.js';
import { Guild } from '../guild/guild.entity.js';

@Entity()
export class Warn extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Guild, (guild) => guild.warns, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  guild: Relation<Guild>;

  @ManyToOne(() => Eventsmode, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn()
  executor: Relation<Eventsmode>;

  @ManyToOne(() => Eventsmode, (eventsmode) => eventsmode.warns, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn()
  target: Relation<Eventsmode>;

  @Column('boolean')
  isVerbal: boolean;

  @Column('text', { nullable: false })
  reason: string;

  @CreateDateColumn()
  warnedAt: Date;
}
