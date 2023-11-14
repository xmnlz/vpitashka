import { Snowflake } from 'discord.js';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuildLogger extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  mainGuild: Snowflake;

  @Column('text', { nullable: false })
  loggerGuild: Snowflake;

  @Column('text', { nullable: false })
  loggerChannelId: Snowflake;
}
