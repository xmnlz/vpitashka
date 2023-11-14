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
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { Guild } from '../../guild/guild.entity.js';
import { User } from '../../user/user.entity.js';

@Entity()
export class EventBan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Eventsmode, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn()
  executor: Relation<Eventsmode>;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'NO ACTION' })
  @JoinColumn()
  target: Relation<User>;

  @ManyToOne(() => Guild, (guild) => guild.eventBans, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  guild: Relation<Guild>;

  @Column('int', { nullable: false })
  days: number;

  @Column('text', { nullable: false })
  reason: string;

  @CreateDateColumn()
  bannedAt: Date;
}
