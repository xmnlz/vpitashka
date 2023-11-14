import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { Event } from '../event.entity.js';
import { Guild } from '../../guild/guild.entity.js';
@Entity()
export class EventHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Eventsmode, { onDelete: 'CASCADE', eager: true })
  eventsmode: Relation<Eventsmode>;

  @ManyToOne(() => Event, { onDelete: 'CASCADE', eager: true })
  event: Relation<Event>;

  @ManyToOne(() => Guild, (guild) => guild.eventHistory, { eager: true })
  @JoinColumn()
  guild: Relation<Guild>;

  @Column('int')
  totalTime: number;

  @Column('int')
  totalSalary: number;

  @Column('timestamptz')
  startedAt: Date;

  @Column('timestamptz')
  endedAt: Date;
}
