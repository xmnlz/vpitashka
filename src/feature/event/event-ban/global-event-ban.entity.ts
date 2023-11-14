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
export class GlobalEventBan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'NO ACTION' })
  @JoinColumn()
  target: Relation<User>;

  @ManyToOne(() => Guild, (guild) => guild.globalEventBans, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  guild: Relation<Guild>;

  @Column('text', { nullable: false })
  reason: string;

  @CreateDateColumn()
  bannedAt: Date;
}
